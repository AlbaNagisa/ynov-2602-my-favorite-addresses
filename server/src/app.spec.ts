import usersRouter from "./controllers/Users";
import {
  closeDb,
  createMockRes,
  getRouteHandler,
  resetDb,
} from "./tests/testHelpers";

type ScenarioData = {
  email: string;
  password: string;
  token: string;
};

function randomEmail() {
  return `test.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

function randomPassword() {
  return `pw-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

describe("MFP integration scenario", () => {
  const createUserHandler = getRouteHandler(usersRouter, "post", "/", 0);
  const tokensHandler = getRouteHandler(usersRouter, "post", "/tokens", 0);
  const meAuthMiddleware = getRouteHandler(usersRouter, "get", "/me", 0);
  const meHandler = getRouteHandler(usersRouter, "get", "/me", 1);

  const scenario: ScenarioData = {
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

  it("creates, logs in, and loads current user profile", async () => {
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
      headers: {
        authorization: `Bearer ${scenario.token}`,
      },
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
});
