import usersRouter from "../controllers/Users";
import {
  closeDb,
  createMockRes,
  getRouteHandler,
  resetDb,
} from "./testHelpers";

function randomEmail() {
  return `coverage.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

function randomPassword() {
  return `pw-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

describe("App integration routes", () => {
  const createUserHandler = getRouteHandler(usersRouter, "post", "/", 0);
  const tokensHandler = getRouteHandler(usersRouter, "post", "/tokens", 0);
  const meAuthMiddleware = getRouteHandler(usersRouter, "get", "/me", 0);
  const meHandler = getRouteHandler(usersRouter, "get", "/me", 1);

  const scenario = {
    email: "",
    password: "",
    token: "",
  };

  beforeEach(async () => {
    await resetDb();
    scenario.email = randomEmail();
    scenario.password = randomPassword();
    scenario.token = "";
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates a user, logs in, and loads /api/users/me", async () => {
    const createReq: any = {
      body: {
        email: scenario.email,
        password: scenario.password,
      },
    };
    const createRes = createMockRes();
    await createUserHandler(createReq, createRes);

    expect(createRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({
          id: expect.any(Number),
          email: scenario.email,
        }),
      }),
    );

    const loginReq: any = {
      body: {
        email: scenario.email,
        password: scenario.password,
      },
      headers: {},
      cookies: {},
    };
    const loginRes = createMockRes();
    await tokensHandler(loginReq, loginRes);

    expect(loginRes.json).toHaveBeenCalledWith({
      token: expect.any(String),
    });
    scenario.token = loginRes.json.mock.calls[0][0].token;

    const meReq: any = {
      headers: { authorization: `Bearer ${scenario.token}` },
      cookies: {},
    };
    const meRes = createMockRes();
    const next = jest.fn();

    await meAuthMiddleware(meReq, meRes, next);
    expect(next).toHaveBeenCalled();

    await meHandler(meReq, meRes);
    expect(meRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({
          id: expect.any(Number),
          email: scenario.email,
        }),
      }),
    );
  });

  it("returns 409 when trying to create two users with the same email", async () => {
    const firstReq: any = {
      body: {
        email: scenario.email,
        password: scenario.password,
      },
    };
    const firstRes = createMockRes();
    await createUserHandler(firstReq, firstRes);

    const duplicateReq: any = {
      body: {
        email: scenario.email,
        password: scenario.password,
      },
    };
    const duplicateRes = createMockRes();
    await createUserHandler(duplicateReq, duplicateRes);

    expect(duplicateRes.status).toHaveBeenCalledWith(409);
    expect(duplicateRes.json).toHaveBeenCalledWith({ message: "email already used" });
  });

  it("returns 400 for invalid payload on token creation", async () => {
    const req: any = {
      body: {
        email: "",
        password: "",
      },
      headers: {},
      cookies: {},
    };
    const res = createMockRes();

    await tokensHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "email and password are required" });
  });
});
