import axios from "axios";
import addressesRouter from "../controllers/Addresses";
import { Address } from "../entities/Address";
import { closeDb, createMockRes, createUser, getRouteHandler, makeTokenForUser, resetDb } from "./testHelpers";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Addresses routes", () => {
  const createAddressHandler = getRouteHandler(addressesRouter, "post", "/", 1);
  const listAddressesMiddleware = getRouteHandler(addressesRouter, "get", "/", 0);
  const listAddressesHandler = getRouteHandler(addressesRouter, "get", "/", 1);
  const deleteAddressMiddleware = getRouteHandler(addressesRouter, "delete", "/:id", 0);
  const deleteAddressHandler = getRouteHandler(addressesRouter, "delete", "/:id", 1);
  const searchAddressesHandler = getRouteHandler(addressesRouter, "post", "/searches", 1);

  beforeEach(async () => {
    await resetDb();
    mockedAxios.get.mockReset();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("GET /api/addresses middleware returns 403 without token", async () => {
    const req: any = { headers: {}, cookies: {} };
    const res = createMockRes();
    const next = jest.fn();

    await listAddressesMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "access denied" });
  });

  it("DELETE /api/addresses/:id middleware returns 403 without token", async () => {
    const req: any = { headers: {}, cookies: {}, params: { id: "1" } };
    const res = createMockRes();
    const next = jest.fn();

    await deleteAddressMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "access denied" });
  });

  it("POST /api/addresses validates payload", async () => {
    const req: any = { body: { name: "Home" } };
    const res = createMockRes();

    await createAddressHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "name and search word are required" });
  });

  it("POST /api/addresses creates an address when geocoding resolves coordinates", async () => {
    const user = await createUser("geo-create@example.com", "password123");
    const token = makeTokenForUser(user.id);
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
      body: {
        name: "Paris",
        searchWord: "Paris",
        description: "Capitale",
      },
    };
    const res = createMockRes();
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        features: [{ geometry: { coordinates: [2.3522, 48.8566] } }],
      },
    });

    await createAddressHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      item: expect.objectContaining({
        id: expect.any(Number),
        name: "Paris",
        description: "Capitale",
        lng: 2.3522,
        lat: 48.8566,
      }),
    });
    const createdAddress = res.json.mock.calls[0][0].item;
    expect(createdAddress).toMatchObject({
      id: expect.any(Number),
      name: "Paris",
      description: "Capitale",
      lng: 2.3522,
      lat: 48.8566,
    });
  });

  it("GET /api/addresses returns only the authenticated user's addresses", async () => {
    const userA = await createUser("a@example.com", "secret123");
    const userB = await createUser("b@example.com", "secret123");
    const tokenA = makeTokenForUser(userA.id);
    const tokenB = makeTokenForUser(userB.id);

    const a1 = new Address();
    a1.name = "A1";
    a1.lng = 1;
    a1.lat = 1;
    a1.user = userA;
    await a1.save();

    const a2 = new Address();
    a2.name = "A2";
    a2.lng = 2;
    a2.lat = 2;
    a2.user = userA;
    await a2.save();

    const b1 = new Address();
    b1.name = "B1";
    b1.lng = 3;
    b1.lat = 3;
    b1.user = userB;
    await b1.save();

    const reqA: any = {
      headers: { authorization: `Bearer ${tokenA}` },
      cookies: {},
    };
    const resA = createMockRes();
    await listAddressesHandler(reqA, resA);
    const bodyA = resA.json.mock.calls[0][0];

    const reqB: any = {
      headers: { authorization: `Bearer ${tokenB}` },
      cookies: {},
    };
    const resB = createMockRes();
    await listAddressesHandler(reqB, resB);
    const bodyB = resB.json.mock.calls[0][0];

    expect(bodyA.items).toHaveLength(2);
    expect(bodyA.items.map((item: { name: string }) => item.name).sort()).toEqual(["A1", "A2"]);

    expect(bodyB.items).toHaveLength(1);
    expect(bodyB.items[0].name).toBe("B1");
  });

  it("POST /api/addresses/searches filters results by radius", async () => {
    const user = await createUser("geo@example.com", "secret123");
    const token = makeTokenForUser(user.id);

    const near = new Address();
    near.name = "Near";
    near.lng = 2.3522;
    near.lat = 48.8566;
    near.user = user;
    await near.save();

    const far = new Address();
    far.name = "Far";
    far.lng = -73.9857;
    far.lat = 40.7484;
    far.user = user;
    await far.save();

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
      body: {
        radius: 10,
        from: { lng: 2.35, lat: 48.85 },
      },
    };
    const res = createMockRes();
    await searchAddressesHandler(req, res);
    const body = res.json.mock.calls[0][0];

    expect(body.items).toHaveLength(1);
    expect(body.items[0].name).toBe("Near");
  });

  it("POST /api/addresses/searches validates radius and from payload", async () => {
    const user = await createUser("check@example.com", "secret123");
    const token = makeTokenForUser(user.id);
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
      body: {
        radius: -2,
        from: { lng: 2.3, lat: 48.8 },
      },
    };
    const res = createMockRes();
    await searchAddressesHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "radius is required, must be a positive number",
    });
  });

  it("DELETE /api/addresses/:id returns 400 when id is invalid", async () => {
    const user = await createUser("delete-invalid-id@example.com", "secret123");
    const token = makeTokenForUser(user.id);
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
      params: { id: "abc" },
    };
    const res = createMockRes();

    await deleteAddressHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "address id must be a positive integer",
    });
  });

  it("DELETE /api/addresses/:id returns 404 when address is not found", async () => {
    const user = await createUser("delete-not-found@example.com", "secret123");
    const token = makeTokenForUser(user.id);
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
      params: { id: "9999" },
    };
    const res = createMockRes();

    await deleteAddressHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "address not found" });
  });

  it("DELETE /api/addresses/:id returns 404 when address belongs to another user", async () => {
    const owner = await createUser("delete-owner@example.com", "secret123");
    const otherUser = await createUser("delete-other@example.com", "secret123");
    const token = makeTokenForUser(otherUser.id);

    const address = new Address();
    address.name = "Private";
    address.lng = 1.11;
    address.lat = 2.22;
    address.user = owner;
    await address.save();

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
      params: { id: String(address.id) },
    };
    const res = createMockRes();

    await deleteAddressHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "address not found" });
  });

  it("DELETE /api/addresses/:id removes the address and returns 204", async () => {
    const user = await createUser("delete-success@example.com", "secret123");
    const token = makeTokenForUser(user.id);

    const address = new Address();
    address.name = "To delete";
    address.lng = 3.14;
    address.lat = 2.72;
    address.user = user;
    await address.save();

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
      params: { id: String(address.id) },
    };
    const res = createMockRes();

    await deleteAddressHandler(req, res);
    const deletedAddress = await Address.findOneBy({ id: address.id });

    expect(deletedAddress).toBeNull();
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
