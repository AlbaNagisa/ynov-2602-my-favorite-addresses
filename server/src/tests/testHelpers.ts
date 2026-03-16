import argon2 from "argon2";
import jwt from "jsonwebtoken";
import usersRouter from "../controllers/Users";
import addressesRouter from "../controllers/Addresses";
import datasource from "../datasource";
import { Address } from "../entities/Address";
import { User } from "../entities/User";

type HttpMethod = "get" | "post" | "delete";
type TestRouteHandler = (req: any, res: any, next?: any) => unknown | Promise<unknown>;

export function getRouteHandler(
  router: typeof usersRouter | typeof addressesRouter,
  method: HttpMethod,
  path: string,
  index = 0,
): TestRouteHandler {
  const layer = router.stack.find(
    (entry: any) => entry.route?.path === path && entry.route?.methods?.[method],
  );
  if (!layer) {
    throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  }
  const handle = layer.route?.stack?.[index]?.handle;
  if (!handle) {
    throw new Error(`Handler #${index} not found for ${method.toUpperCase()} ${path}`);
  }
  return handle as TestRouteHandler;
}

export function createMockRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.cookie = jest.fn(() => res);
  return res;
}

export async function ensureDbReady() {
  if (!datasource.isInitialized) {
    await datasource.initialize();
  }
}

export async function resetDb() {
  await ensureDbReady();
  await datasource.getRepository(Address).clear();
  await datasource.getRepository(User).clear();
}

export async function closeDb() {
  if (datasource.isInitialized) {
    await datasource.destroy();
  }
}

export async function createUser(email: string, plainPassword = "password123") {
  const user = new User();
  user.email = email;
  user.hashedPassword = await argon2.hash(plainPassword);
  await user.save();
  return user;
}

export function makeTokenForUser(userId: number) {
  const secret = process.env.SESSION_SECRET || "superlongstring";
  return jwt.sign({ userId }, secret);
}
