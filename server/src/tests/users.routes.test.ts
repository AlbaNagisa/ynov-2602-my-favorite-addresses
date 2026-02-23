import usersRouter from "../controllers/Users";
import { closeDb, createUser, createMockRes, getRouteHandler, makeTokenForUser, resetDb } from "./testHelpers";

describe("Users routes", () => {
  const createUserHandler = getRouteHandler(usersRouter, "post", "/", 0);
  const meAuthMiddleware = getRouteHandler(usersRouter, "get", "/me", 0);
  const meHandler = getRouteHandler(usersRouter, "get", "/me", 1);
  const tokensHandler = getRouteHandler(usersRouter, "post", "/tokens", 0);

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("POST /api/users returns 400 when payload is incomplete", async () => {
    const req: any = { body: { email: "john@example.com" } };
    const res = createMockRes();

    await createUserHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "email and password are required" });
  });

  it("POST /api/users creates a user", async () => {
    const req: any = {
      body: { email: "john@example.com", password: "secret123" },
    };
    const res = createMockRes();

    await createUserHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      item: expect.objectContaining({
        id: expect.any(Number),
        email: "john@example.com",
      }),
    });
    const createdUser = res.json.mock.calls[0][0].item;
    expect(createdUser).toMatchObject({
      id: expect.any(Number),
      email: "john@example.com",
    });
    expect(createdUser.hashedPassword).not.toBe("secret123");
  });

  it("POST /api/users/tokens returns 400 on wrong credentials", async () => {
    await createUser("john@example.com", "secret123");
    const req: any = {
      body: { email: "john@example.com", password: "wrong-password" },
    };
    const res = createMockRes();

    await tokensHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "wrong credentials" });
  });

  it("GET /api/users/me middleware returns 403 without token", async () => {
    const req: any = { headers: {}, cookies: {} };
    const res = createMockRes();
    const next = jest.fn();

    await meAuthMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "access denied" });
  });

  it("GET /api/users/me returns current user when token is valid", async () => {
    const user = await createUser("jane@example.com", "secret123");
    const token = makeTokenForUser(user.id);
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    };
    const res = createMockRes();

    await meHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      item: expect.objectContaining({
        id: user.id,
        email: "jane@example.com",
      }),
    });
    const currentUser = res.json.mock.calls[0][0].item;
    expect(currentUser).toMatchObject({
      id: user.id,
      email: "jane@example.com",
    });
  });
});
