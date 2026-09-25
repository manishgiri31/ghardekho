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
    const secondCreated = await app.inject({ method: "POST", url: "/api/v1/properties", headers: { cookie: ownerCookie, origin }, payload: { ...draft, title: "Another integration test home on quiet road" } });
    assert.equal(secondCreated.statusCode, 201, secondCreated.body);

    const unauthenticatedOwnerList = await app.inject({ method: "GET", url: "/api/v1/properties/mine" });
    assert.equal(unauthenticatedOwnerList.statusCode, 401);
    const ownerPageOne = await app.inject({ method: "GET", url: "/api/v1/properties/mine?page=1&limit=1", headers: { cookie: ownerCookie } });
    assert.equal(ownerPageOne.statusCode, 200, ownerPageOne.body);
    assert.equal(ownerPageOne.json().pagination.total, 2);
    assert.equal(ownerPageOne.json().pagination.totalPages, 2);
    assert.equal(ownerPageOne.json().data.length, 1);
    assert.equal(ownerPageOne.json().summary.total, 2);
    assert.equal(ownerPageOne.json().summary.byStatus.DRAFT, 2);
    const ownerPageTwo = await app.inject({ method: "GET", url: "/api/v1/properties/mine?page=2&limit=1", headers: { cookie: ownerCookie } });
    assert.equal(ownerPageTwo.json().data.length, 1);
    assert.notEqual(ownerPageOne.json().data[0].id, ownerPageTwo.json().data[0].id);
    const otherOwnerList = await app.inject({ method: "GET", url: "/api/v1/properties/mine", headers: { cookie: otherCookie } });
    assert.equal(otherOwnerList.statusCode, 200);
    assert.equal(otherOwnerList.json().data.length, 0);
    assert.equal(otherOwnerList.json().summary.total, 0);
    assert.equal((await app.inject({ method: "GET", url: `/api/v1/properties/mine?ownerId=${actor.json().data.user.id}`, headers: { cookie: otherCookie } })).statusCode, 400);
    assert.equal((await app.inject({ method: "GET", url: "/api/v1/properties/mine?page=0", headers: { cookie: ownerCookie } })).statusCode, 400);
    assert.equal((await app.inject({ method: "GET", url: "/api/v1/properties/mine?limit=101", headers: { cookie: ownerCookie } })).statusCode, 400);

    const hidden = await app.inject({ method: "GET", url: `/api/v1/properties/${propertyId}` });
    assert.equal(hidden.statusCode, 404);
    const ownerUnpublishedDetails = await app.inject({ method: "GET", url: `/api/v1/properties/${propertyId}`, headers: { cookie: ownerCookie } });
    assert.equal(ownerUnpublishedDetails.statusCode, 200);
    assert.equal(ownerUnpublishedDetails.json().data.status, "DRAFT");
    const otherOwnerUnpublishedDetails = await app.inject({ method: "GET", url: `/api/v1/properties/${propertyId}`, headers: { cookie: otherCookie } });
    assert.equal(otherOwnerUnpublishedDetails.statusCode, 404);
    const wrongOwnerEdit = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}`, headers: { cookie: otherCookie, origin }, payload: { title: "Attempted unauthorized listing edit" } });
    assert.equal(wrongOwnerEdit.statusCode, 403);
    const ownerEdit = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}`, headers: { cookie: ownerCookie, origin }, payload: { title: "Updated integration test home near the city park" } });
    assert.equal(ownerEdit.statusCode, 200, ownerEdit.body);
    assert.equal(ownerEdit.json().data.status, "PENDING_REVIEW");

    await app.db.property.update({ where: { id: propertyId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    const publishedSummary = await app.inject({ method: "GET", url: "/api/v1/properties/mine", headers: { cookie: ownerCookie } });
    assert.equal(publishedSummary.json().summary.byStatus.PUBLISHED, 1);
    assert.equal(publishedSummary.json().summary.byStatus.DRAFT, 1);
    const publicDetails = await app.inject({ method: "GET", url: `/api/v1/properties/${created.json().data.slug}` });
    assert.equal(publicDetails.statusCode, 200, publicDetails.body);
    assert.equal(publicDetails.json().data.id, propertyId);
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
    const archivedSummary = await app.inject({ method: "GET", url: "/api/v1/properties/mine", headers: { cookie: ownerCookie } });
    assert.equal(archivedSummary.json().summary.byStatus.ARCHIVED, 1);
    assert.equal(archivedSummary.json().summary.byStatus.PUBLISHED, 0);
    const publicAfterArchive = await app.inject({ method: "GET", url: "/api/v1/properties?city=IntegrationCity" });
    assert.equal(publicAfterArchive.json().data.some((item: { id: string }) => item.id === propertyId), false);
    const editArchived = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}`, headers: { cookie: ownerCookie, origin }, payload: { title: "Attempt to edit an archived integration listing" } });
    assert.equal(editArchived.statusCode, 400);

    await app.db.property.update({ where: { id: propertyId }, data: { publishedAt: new Date() } });
    const unauthenticatedRestore = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}/restore`, origin });
    assert.equal(unauthenticatedRestore.statusCode, 401);
    const wrongOwnerRestore = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}/restore`, headers: { cookie: otherCookie, origin } });
    assert.equal(wrongOwnerRestore.statusCode, 403);
    const restored = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}/restore`, headers: { cookie: ownerCookie, origin } });
    assert.equal(restored.statusCode, 200, restored.body);
    assert.equal(restored.json().data.status, "PENDING_REVIEW");
    assert.equal(restored.json().data.publishedAt, null);
    const restoredSummary = await app.inject({ method: "GET", url: "/api/v1/properties/mine", headers: { cookie: ownerCookie } });
    assert.equal(restoredSummary.json().summary.byStatus.PENDING_REVIEW, 1);
    assert.equal(restoredSummary.json().summary.byStatus.ARCHIVED, 0);
    const publicAfterRestore = await app.inject({ method: "GET", url: "/api/v1/properties?city=IntegrationCity" });
    assert.equal(publicAfterRestore.json().data.some((item: { id: string }) => item.id === propertyId), false);
    const duplicateRestore = await app.inject({ method: "PATCH", url: `/api/v1/properties/${propertyId}/restore`, headers: { cookie: ownerCookie, origin } });
    assert.equal(duplicateRestore.statusCode, 400);

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
