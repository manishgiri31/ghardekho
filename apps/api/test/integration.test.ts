import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { buildApp } from "../src/app.js";

test("PostgreSQL-backed auth, property lifecycle, inquiry and visit endpoints", async () => {
  const app = await buildApp({ logger: false });
  const emailPrefix = `api-integration-${randomUUID()}`;
  const ownerEmail = `${emailPrefix}-owner@example.test`;
  const otherEmail = `${emailPrefix}-other@example.test`;
  const password = "integration-only-password-94";
  const origin = "http://localhost:3000";
  const emails = [ownerEmail, otherEmail];
  let propertyId: string | undefined;

  try {
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    assert.ok(address && typeof address === "object");
    const health = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });

    const register = async (email: string) => {
      const response = await app.inject({
        method: "POST", url: "/api/v1/auth/register",
        payload: { email, password, name: "Integration Test Account" },
      });
      assert.equal(response.statusCode, 201, response.body);
      assert.equal("passwordHash" in response.json().data.user, false);
      return (response.headers["set-cookie"] as string).split(";")[0];
    };

    const ownerCookie = await register(ownerEmail);
    const otherCookie = await register(otherEmail);
    const actor = await app.inject({ method: "GET", url: "/api/v1/auth/me", headers: { cookie: ownerCookie } });
    assert.equal(actor.statusCode, 200);

    const draft = {
      title: "Integration test home near the city park",
      description: "A sample listing created only by an automated API integration test.",
      propertyType: "APARTMENT", listingType: "SALE", price: 9000000, area: 1100,
      address: "4 Integration Avenue", locality: "Test Layout", city: "IntegrationCity",
      state: "Karnataka", pincode: "560038",
    };
    const unauthenticated = await app.inject({ method: "POST", url: "/api/v1/properties", payload: draft });
    assert.equal(unauthenticated.statusCode, 401);
    const created = await app.inject({ method: "POST", url: "/api/v1/properties", headers: { cookie: ownerCookie, origin }, payload: draft });
    assert.equal(created.statusCode, 201, created.body);
    propertyId = created.json().data.id;
    assert.equal(created.json().data.status, "DRAFT");

    const hidden = await app.inject({ method: "GET", url: `/api/v1/properties/${propertyId}` });
    assert.equal(hidden.statusCode, 404);
    const wrongOwnerEdit = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}`, headers: { cookie: otherCookie, origin }, payload: { title: "Attempted unauthorized listing edit" } });
    assert.equal(wrongOwnerEdit.statusCode, 403);
    const ownerEdit = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}`, headers: { cookie: ownerCookie, origin }, payload: { title: "Updated integration test home near the city park" } });
    assert.equal(ownerEdit.statusCode, 200, ownerEdit.body);
    assert.equal(ownerEdit.json().data.status, "PENDING_REVIEW");

    await app.db.property.update({ where: { id: propertyId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    const publicSearch = await app.inject({ method: "GET", url: "/api/v1/properties?city=IntegrationCity&propertyType=APARTMENT" });
    assert.equal(publicSearch.statusCode, 200, publicSearch.body);
    assert.equal(publicSearch.json().data.some((item: { id: string }) => item.id === propertyId), true);

    const inquiry = await app.inject({
      method: "POST", url: `/api/v1/properties/${propertyId}/inquiries`, headers: { cookie: otherCookie, origin },
      payload: { message: "I would like to know more about the property and availability." },
    });
    assert.equal(inquiry.statusCode, 201, inquiry.body);
    const visit = await app.inject({
      method: "POST", url: `/api/v1/properties/${propertyId}/visits`, headers: { cookie: otherCookie, origin },
      payload: { requestedAt: new Date(Date.now() + 86_400_000).toISOString(), message: "Please confirm a suitable time." },
    });
    assert.equal(visit.statusCode, 201, visit.body);

    const archived = await app.inject({ method: "DELETE", url: `/api/v1/properties/${propertyId}`, headers: { cookie: ownerCookie, origin } });
    assert.equal(archived.statusCode, 204);
    const noLongerPublic = await app.inject({ method: "GET", url: `/api/v1/properties/${propertyId}` });
    assert.equal(noLongerPublic.statusCode, 404);

    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: ownerEmail, password } });
    assert.equal(login.statusCode, 200, login.body);
    const logout = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie: ownerCookie, origin } });
    assert.equal(logout.statusCode, 200);
    const afterLogout = await app.inject({ method: "GET", url: "/api/v1/auth/me", headers: { cookie: ownerCookie } });
    assert.equal(afterLogout.statusCode, 401);
  } finally {
    try {
      const users = await app.db.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
      await app.db.property.deleteMany({ where: { ownerId: { in: users.map((user) => user.id) } } });
      await app.db.user.deleteMany({ where: { email: { in: emails } } });
    } finally {
      await app.close();
    }
  }
});
