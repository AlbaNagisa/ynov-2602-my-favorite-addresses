import request from "supertest";
import { faker } from "@faker-js/faker";
import app from "./app";
import { closeDb, ensureDbReady, resetDb } from "./tests/testHelpers";

type ScenarioData = {
  email: string;
  password: string;
  token: string;
};

describe("MFP integration scenario", () => {
  const scenario: ScenarioData = {
    email: "",
    password: "",
    token: "",
  };

  beforeAll(async () => {
    await ensureDbReady();
    await resetDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates a user account with random credentials", async () => {
    scenario.email = faker.internet.email().toLowerCase();
    scenario.password = faker.internet.password({ length: 16, memorable: false });

    const response = await request(app).post("/api/users").send({
      email: scenario.email,
      password: scenario.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.item).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        email: scenario.email,
      }),
    );
  });

  it("logs in with the created user", async () => {
    const response = await request(app).post("/api/users/tokens").send({
      email: scenario.email,
      password: scenario.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    scenario.token = response.body.token;
  });

  it("retrieves the current user profile with the bearer token", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${scenario.token}`);

    expect(response.status).toBe(200);
    expect(response.body.item).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        email: scenario.email,
      }),
    );
  });
});
