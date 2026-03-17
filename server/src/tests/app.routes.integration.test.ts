import request from "supertest";
import { faker } from "@faker-js/faker";
import app from "../app";
import { closeDb, resetDb } from "./testHelpers";

describe("App integration routes", () => {
  const scenario = {
    email: "",
    password: "",
    token: "",
  };

  beforeEach(async () => {
    await resetDb();
    scenario.email = faker.internet.email().toLowerCase();
    scenario.password = faker.internet.password({ length: 16, memorable: false });
    scenario.token = "";
  });

  afterAll(async () => {
    await closeDb();
  });

  it("creates a user, logs in, and loads /api/users/me", async () => {
    const createResponse = await request(app).post("/api/users").send({
      email: scenario.email,
      password: scenario.password,
    });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.item).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        email: scenario.email,
      }),
    );

    const loginResponse = await request(app).post("/api/users/tokens").send({
      email: scenario.email,
      password: scenario.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toEqual(expect.any(String));
    scenario.token = loginResponse.body.token;

    const meResponse = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${scenario.token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.item).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        email: scenario.email,
      }),
    );
  });

  it("returns 409 when trying to create two users with the same email", async () => {
    await request(app).post("/api/users").send({
      email: scenario.email,
      password: scenario.password,
    });

    const duplicateResponse = await request(app).post("/api/users").send({
      email: scenario.email,
      password: scenario.password,
    });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body).toEqual({ message: "email already used" });
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/route-that-does-not-exist");
    expect(response.status).toBe(404);
  });
});
