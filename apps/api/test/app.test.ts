import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { PrismaClient } from "@ghardekho/database";
import { buildApp } from "../src/app.js";

function memoryDatabase() {
  const users: Record<string, unknown>[] = [];
  const sessions: Record<string, unknown>[] = [];
  const properties: Record<string, unknown>[] = [];
  const project = (source: Record<string, unknown>, select?: Record<string, unknown>) => {
    if (!select) return source;
    const output: Record<string, unknown> = {};
    for (const [key, selection] of Object.entries(select)) {
      if (selection === true) output[key] = source[key];
      if (typeof selection === "object" && selection !== null && key === "profile") output.profile = project(source.profile as Record<string, unknown>, (selection as { select: Record<string, unknown> }).select);
    }
    return output;
  };
  const db = {
    user: {
      create: async ({ data, select }: { data: Record<string, unknown>; select?: Record<string, unknown> }) => {
        const user = { id: randomUUID(), email: data.email, phone: data.phone ?? null, passwordHash: data.passwordHash, role: "USER", isActive: true, profile: { name: (data.profile as { create: { name: string } }).create.name, avatar: null, bio: null, city: null, state: null } };
        users.push(user);
        return project(user, select);
      },
      findUnique: async ({ where, select }: { where: { email?: string; id?: string }; select?: Record<string, unknown> }) => {
        const user = users.find((item) => (where.email && item.email === where.email) || (where.id && item.id === where.id));
        return user ? project(user, select) : null;
      },
      findUniqueOrThrow: async ({ where, select }: { where: { id: string }; select?: Record<string, unknown> }) => {
        const item = users.find((user) => user.id === where.id);
        if (!item) throw new Error("User not found");
        return project(item, select);
      },
    },
    authSession: {
      deleteMany: async () => ({ count: 0 }),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const session = { id: randomUUID(), ...data, revokedAt: null };
        sessions.push(session);
        return session;
      },
      findUnique: async ({ where, include }: { where: { tokenHash: string }; include: { user: { select: Record<string, unknown> } } }) => {
        const session = sessions.find((item) => item.tokenHash === where.tokenHash);
        if (!session) return null;
        const user = users.find((item) => item.id === session.userId);
        return { ...session, user: user ? project(user, include.user.select) : null };
      },
      updateMany: async ({ where, data }: { where: { tokenHash: string }; data: Record<string, unknown> }) => {
        const session = sessions.find((item) => item.tokenHash === where.tokenHash);
        if (!session) return { count: 0 };
        Object.assign(session, data);
        return { count: 1 };
      },
    },
    property: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const ownerLink = data.owner as { connect: { id: string } };
        const property = { id: randomUUID(), ...data, ownerId: ownerLink.connect.id, status: "DRAFT", media: [], amenities: [] };
        properties.push(property);
        return property;
      },
      findUnique: async ({ where }: { where: { id: string } }) => properties.find((property) => property.id === where.id) ?? null,
      findFirst: async ({ where }: { where: { id?: string; slug?: string } }) => properties.find((property) => (where.id && property.id === where.id) || (where.slug && property.slug === where.slug)) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const property = properties.find((item) => item.id === where.id);
        if (!property) throw new Error("Property not found");
        Object.assign(property, data);
        return property;
      },
      count: async ({ where }: { where: Record<string, unknown> }) => {
        const city = where.city as { equals?: string } | undefined;
        return properties.filter((item) => item.status === where.status && (!city || String(item.city).toLowerCase() === city.equals?.toLowerCase())).length;
      },
      findMany: async ({ where, skip, take }: { where: Record<string, unknown>; skip: number; take: number }) => {
        const city = where.city as { equals?: string } | undefined;
        return properties.filter((item) => item.status === where.status && (!city || String(item.city).toLowerCase() === city.equals?.toLowerCase())).slice(skip, skip + take);
      },
    },
    inquiry: { create: async ({ data }: { data: Record<string, unknown> }) => ({ id: randomUUID(), ...data }) },
    visitRequest: { create: async ({ data }: { data: Record<string, unknown> }) => ({ id: randomUUID(), ...data }) },
    $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
  };
  return { db: db as unknown as PrismaClient, users, sessions, properties };
}

test("health endpoint responds without a database query", async () => {
  const app = await buildApp({ db: memoryDatabase().db, logger: false });
  const response = await app.inject({ method: "GET", url: "/health" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok" });
  await app.close();
});

test("registration, login, logout, and me use an HTTP-only session cookie", async () => {
  const app = await buildApp({ db: memoryDatabase().db, logger: false });
  const registration = await app.inject({
    method: "POST", url: "/api/v1/auth/register",
    payload: { email: "Person@Example.com", password: "a-long-enough-test-password", name: "Test Person" },
  });
  assert.equal(registration.statusCode, 201);
  assert.equal(registration.json().data.user.email, "person@example.com");
  assert.equal("passwordHash" in registration.json().data.user, false);
  assert.match(registration.headers["set-cookie"] as string, /HttpOnly/i);
  const cookie = (registration.headers["set-cookie"] as string).split(";")[0];
  const me = await app.inject({ method: "GET", url: "/api/v1/auth/me", headers: { cookie } });
  assert.equal(me.statusCode, 200);
  assert.equal("passwordHash" in me.json().data.user, false);
  const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "person@example.com", password: "a-long-enough-test-password" } });
  assert.equal(login.statusCode, 200);
  assert.equal("passwordHash" in login.json().data.user, false);
  const loginCookie = (login.headers["set-cookie"] as string).split(";")[0];
  const logout = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie: loginCookie, origin: "http://localhost:3000" } });
  assert.equal(logout.statusCode, 200);
  const afterLogout = await app.inject({ method: "GET", url: "/api/v1/auth/me", headers: { cookie: loginCookie } });
  assert.equal(afterLogout.statusCode, 401);
  await app.close();
});

test("property creation requires authentication and owners cannot edit another account's listing", async () => {
  const memory = memoryDatabase();
  const app = await buildApp({ db: memory.db, logger: false });
  const property = {
    title: "Bright apartment in central Bengaluru", description: "A thoughtfully planned home near daily essentials and public transport.",
    propertyType: "APARTMENT", listingType: "SALE", price: 12500000, area: 1250, address: "12 Example Road",
    locality: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038",
  };
  const unauthenticated = await app.inject({ method: "POST", url: "/api/v1/properties", payload: property });
  assert.equal(unauthenticated.statusCode, 401);
  const register = async (email: string) => {
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email, password: "a-long-enough-test-password", name: "Listing Owner" } });
    return (response.headers["set-cookie"] as string).split(";")[0];
  };
  const ownerCookie = await register("owner@example.com");
  const otherCookie = await register("other@example.com");
  const created = await app.inject({ method: "POST", url: "/api/v1/properties", headers: { cookie: ownerCookie, origin: "http://localhost:3000" }, payload: property });
  assert.equal(created.statusCode, 201);
  const propertyId = created.json().data.id as string;
  const denied = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}`, headers: { cookie: otherCookie, origin: "http://localhost:3000" }, payload: { title: "Different title for another owner" } });
  assert.equal(denied.statusCode, 403);
  const allowed = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}`, headers: { cookie: ownerCookie, origin: "http://localhost:3000" }, payload: { title: "Updated bright apartment in Bengaluru" } });
  assert.equal(allowed.statusCode, 200);
  await app.close();
});

test("public property search returns only published listings and honors its location filter", async () => {
  const memory = memoryDatabase();
  memory.properties.push(
    { id: randomUUID(), title: "Published home", city: "Pune", status: "PUBLISHED" },
    { id: randomUUID(), title: "Draft home", city: "Pune", status: "DRAFT" },
    { id: randomUUID(), title: "Different city home", city: "Mumbai", status: "PUBLISHED" },
  );
  const app = await buildApp({ db: memory.db, logger: false });
  const response = await app.inject({ method: "GET", url: "/api/v1/properties?city=Pune&page=1&limit=10" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.length, 1);
  assert.equal(response.json().data[0].title, "Published home");
  assert.deepEqual(response.json().pagination, { page: 1, limit: 10, total: 1, totalPages: 1 });
  await app.close();
});
