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
        return properties.filter((item) => (!where.status || item.status === where.status) && (!where.ownerId || item.ownerId === where.ownerId) && (!city || String(item.city).toLowerCase() === city.equals?.toLowerCase())).length;
      },
      findMany: async ({ where, skip, take }: { where: Record<string, unknown>; skip: number; take: number }) => {
        const city = where.city as { equals?: string } | undefined;
        return properties.filter((item) => (!where.status || item.status === where.status) && (!where.ownerId || item.ownerId === where.ownerId) && (!city || String(item.city).toLowerCase() === city.equals?.toLowerCase())).slice(skip, skip + take);
      },
      groupBy: async ({ where }: { where: Record<string, unknown> }) => {
        const matching = properties.filter((item) => item.ownerId === where.ownerId);
        const counts = new Map<string, number>();
        for (const item of matching) counts.set(String(item.status), (counts.get(String(item.status)) ?? 0) + 1);
        return [...counts].map(([status, count]) => ({ status, _count: { _all: count } }));
      },
    },
    inquiry: { create: async ({ data }: { data: Record<string, unknown> }) => ({ id: randomUUID(), ...data }) },
    visitRequest: { create: async ({ data }: { data: Record<string, unknown> }) => ({ id: randomUUID(), ...data }) },
    $transaction: async (operations: Promise<unknown>[] | ((tx: unknown) => Promise<unknown>)) => typeof operations === "function" ? operations(db) : Promise.all(operations),
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

test("owner property list is authenticated, private, paginated, and summarizes real statuses", async () => {
  const memory = memoryDatabase();
  const app = await buildApp({ db: memory.db, logger: false });
  const property = {
    title: "A considered home for owner listing", description: "A comfortable residence near parks, shops, and local transit.",
    propertyType: "APARTMENT", listingType: "SALE", price: 8500000, area: 1050,
    address: "7 Test Lane", locality: "Test Park", city: "Pune", state: "Maharashtra", pincode: "411001",
  };
  const register = async (email: string) => {
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email, password: "a-long-enough-test-password", name: "Owner Test" } });
    return (response.headers["set-cookie"] as string).split(";")[0];
  };
  try {
    const denied = await app.inject({ method: "GET", url: "/api/v1/properties/mine" });
    assert.equal(denied.statusCode, 401);
    const ownerCookie = await register("properties-owner@example.com");
    const otherCookie = await register("properties-other@example.com");
    const first = await app.inject({ method: "POST", url: "/api/v1/properties", headers: { cookie: ownerCookie, origin: "http://localhost:3000" }, payload: property });
    const second = await app.inject({ method: "POST", url: "/api/v1/properties", headers: { cookie: ownerCookie, origin: "http://localhost:3000" }, payload: { ...property, title: "Another considered owner property" } });
    assert.equal(first.statusCode, 201); assert.equal(second.statusCode, 201);
    memory.properties.find((item) => item.id === first.json().data.id)!.status = "PUBLISHED";
    memory.properties.find((item) => item.id === second.json().data.id)!.status = "ARCHIVED";

    const pageOne = await app.inject({ method: "GET", url: "/api/v1/properties/mine?page=1&limit=1", headers: { cookie: ownerCookie } });
    assert.equal(pageOne.statusCode, 200, pageOne.body);
    assert.equal(pageOne.json().pagination.total, 2);
    assert.equal(pageOne.json().pagination.totalPages, 2);
    assert.equal(pageOne.json().data.length, 1);
    assert.equal(pageOne.json().summary.total, 2);
    assert.equal(pageOne.json().summary.byStatus.PUBLISHED, 1);
    assert.equal(pageOne.json().summary.byStatus.ARCHIVED, 1);
    const pageTwo = await app.inject({ method: "GET", url: "/api/v1/properties/mine?page=2&limit=1", headers: { cookie: ownerCookie } });
    assert.equal(pageTwo.json().data.length, 1);
    assert.notEqual(pageOne.json().data[0].id, pageTwo.json().data[0].id);

    const otherOwner = await app.inject({ method: "GET", url: "/api/v1/properties/mine", headers: { cookie: otherCookie } });
    assert.equal(otherOwner.statusCode, 200);
    assert.equal(otherOwner.json().data.length, 0);
    assert.equal(otherOwner.json().summary.total, 0);
    assert.equal(otherOwner.json().pagination.totalPages, 0);
    assert.equal((await app.inject({ method: "GET", url: `/api/v1/properties/mine?ownerId=${first.json().data.ownerId}`, headers: { cookie: otherCookie } })).statusCode, 400);
    assert.equal((await app.inject({ method: "GET", url: "/api/v1/properties/mine?page=0", headers: { cookie: ownerCookie } })).statusCode, 400);
    assert.equal((await app.inject({ method: "GET", url: "/api/v1/properties/mine?limit=101", headers: { cookie: ownerCookie } })).statusCode, 400);

    const publicList = await app.inject({ method: "GET", url: "/api/v1/properties" });
    assert.deepEqual(publicList.json().data.map((item: { id: string }) => item.id), [first.json().data.id]);

    const archivedProperty = memory.properties.find((item) => item.id === second.json().data.id)!;
    archivedProperty.publishedAt = new Date();
    const archivedEdit = await app.inject({ method: "PATCH", url: `/api/v1/properties/${archivedProperty.id}`, headers: { cookie: ownerCookie, origin: "http://localhost:3000" }, payload: { title: "Attempt to edit an archived listing" } });
    assert.equal(archivedEdit.statusCode, 400);
    assert.equal(archivedProperty.status, "ARCHIVED");
    assert.equal((await app.inject({ method: "PATCH", url: `/api/v1/properties/${archivedProperty.id}/restore` })).statusCode, 401);
    assert.equal((await app.inject({ method: "PATCH", url: `/api/v1/properties/${archivedProperty.id}/restore`, headers: { cookie: otherCookie, origin: "http://localhost:3000" } })).statusCode, 403);
    const restored = await app.inject({ method: "PATCH", url: `/api/v1/properties/${archivedProperty.id}/restore`, headers: { cookie: ownerCookie, origin: "http://localhost:3000" } });
    assert.equal(restored.statusCode, 200, restored.body);
    assert.equal(restored.json().data.status, "PENDING_REVIEW");
    assert.equal(restored.json().data.publishedAt, null);
    assert.equal((await app.inject({ method: "PATCH", url: `/api/v1/properties/${archivedProperty.id}/restore`, headers: { cookie: ownerCookie, origin: "http://localhost:3000" } })).statusCode, 400);
    const afterRestorePublicList = await app.inject({ method: "GET", url: "/api/v1/properties" });
    assert.deepEqual(afterRestorePublicList.json().data.map((item: { id: string }) => item.id), [first.json().data.id]);
  } finally { await app.close(); }
});
