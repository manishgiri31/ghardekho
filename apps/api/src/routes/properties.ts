import { randomBytes } from "node:crypto";
import { Prisma } from "@ghardekho/database";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { inquiryCreateSchema, ownerPropertySearchSchema, propertyCreateSchema, propertySearchSchema, propertyUpdateSchema, visitRequestCreateSchema } from "@ghardekho/validation";
import type { OwnerPropertySearchInput, PropertySearchInput, PropertyStatus } from "@ghardekho/validation";
import { authenticatedUser } from "../utils/session.js";
import { badRequest, forbidden, notFound } from "../utils/errors.js";

function parse<T>(schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw badRequest(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  return result.data;
}

function slugFromTitle(title: string) {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
}

function isPrivileged(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

async function requireActor(request: FastifyRequest, app: FastifyInstance) {
  return authenticatedUser(request, app.db);
}

function requireUuid(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw notFound("Property not found.");
  return id;
}

export async function propertyRoutes(app: FastifyInstance) {
  app.get("/mine", async (request, reply) => {
    const actor = await requireActor(request, app);
    const filters = parse(ownerPropertySearchSchema, request.query) as OwnerPropertySearchInput;
    const where: Prisma.PropertyWhereInput = { ownerId: actor.id };
    const statuses: PropertyStatus[] = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SOLD", "RENTED", "ARCHIVED"];
    const [properties, statusCounts] = await app.db.$transaction(async (tx) => Promise.all([
      tx.property.findMany({
        where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (filters.page - 1) * filters.limit, take: filters.limit,
        include: { media: { orderBy: { sortOrder: "asc" } } },
      }),
      Promise.all(statuses.map(async (status) => [status, await tx.property.count({ where: { ownerId: actor.id, status } })] as const)),
    ]));
    const byStatus = Object.fromEntries(statusCounts) as Record<PropertyStatus, number>;
    const total = statusCounts.reduce((count, [, statusCount]) => count + statusCount, 0);
    return reply.send({ success: true, data: properties, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) }, summary: { total, byStatus } });
  });

  app.post("/:id/inquiries", async (request, reply) => {
    const actor = await requireActor(request, app);
    const { id: rawId } = request.params as { id: string };
    const propertyId = requireUuid(rawId);
    const input = parse(inquiryCreateSchema, request.body);
    const property = await app.db.property.findUnique({ where: { id: propertyId }, select: { id: true, status: true, ownerId: true } });
    if (!property || property.status !== "PUBLISHED") throw notFound("Property not found.");
    if (property.ownerId === actor.id) throw forbidden("You cannot send an inquiry about your own listing.");
    const inquiry = await app.db.inquiry.create({ data: { ...input, userId: actor.id, propertyId } });
    return reply.code(201).send({ success: true, data: inquiry });
  });

  app.post("/:id/visits", async (request, reply) => {
    const actor = await requireActor(request, app);
    const { id: rawId } = request.params as { id: string };
    const propertyId = requireUuid(rawId);
    const input = parse(visitRequestCreateSchema, request.body);
    const property = await app.db.property.findUnique({ where: { id: propertyId }, select: { id: true, status: true, ownerId: true } });
    if (!property || property.status !== "PUBLISHED") throw notFound("Property not found.");
    if (property.ownerId === actor.id) throw forbidden("You cannot request a visit to your own listing.");
    const visitRequest = await app.db.visitRequest.create({ data: { ...input, userId: actor.id, propertyId } });
    return reply.code(201).send({ success: true, data: visitRequest });
  });

  app.get("/", async (request, reply) => {
    const filters = parse(propertySearchSchema, request.query) as PropertySearchInput;
    const where: Prisma.PropertyWhereInput = {
      status: "PUBLISHED",
      ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
      ...(filters.locality ? { locality: { equals: filters.locality, mode: "insensitive" } } : {}),
      ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
      ...(filters.listingType ? { listingType: filters.listingType } : {}),
      ...(filters.bedrooms !== undefined ? { bedrooms: filters.bedrooms } : {}),
      ...(filters.furnishing ? { furnishing: filters.furnishing } : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined ? { price: { ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}), ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}) } } : {}),
    };
    const orderBy: Prisma.PropertyOrderByWithRelationInput = filters.sort === "price_asc" ? { price: "asc" } : filters.sort === "price_desc" ? { price: "desc" } : filters.sort === "area" ? { area: "desc" } : { publishedAt: "desc" };
    const [total, properties] = await app.db.$transaction([
      app.db.property.count({ where }),
      app.db.property.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: { media: { orderBy: { sortOrder: "asc" } }, amenities: { include: { amenity: true } }, owner: { select: { id: true, profile: { select: { name: true } } } } },
      }),
    ]);
    return reply.send({ success: true, data: properties, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } });
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(id)) throw notFound("Property not found.");
    const property = await app.db.property.findFirst({ where: isUuid ? { id } : { slug: id }, include: { media: { orderBy: { sortOrder: "asc" } }, amenities: { include: { amenity: true } }, owner: { select: { id: true, profile: { select: { name: true } } } } } });
    if (!property) throw notFound("Property not found.");
    if (property.status !== "PUBLISHED") {
      let actor;
      try { actor = await authenticatedUser(request, app.db); } catch { throw notFound("Property not found."); }
      if (actor.id !== property.ownerId && !isPrivileged(actor.role)) throw notFound("Property not found.");
    }
    return reply.send({ success: true, data: property });
  });

  app.post("/", async (request, reply) => {
    const actor = await requireActor(request, app);
    const input = parse(propertyCreateSchema, request.body);
    const base = input.slug ?? slugFromTitle(input.title);
    const slug = `${base}-${randomBytes(3).toString("hex")}`;
    try {
      const { amenityIds, ...fields } = input;
      const property = await app.db.property.create({
        data: {
          ...fields,
          slug,
          owner: { connect: { id: actor.id } },
          ...(amenityIds.length ? { amenities: { create: amenityIds.map((amenityId) => ({ amenity: { connect: { id: amenityId } } })) } } : {}),
        },
        include: { media: true, amenities: { include: { amenity: true } } },
      });
      return reply.code(201).send({ success: true, data: property });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") throw badRequest("One or more amenity IDs are invalid.");
      throw error;
    }
  });

  app.patch("/:id", async (request, reply) => {
    const actor = await requireActor(request, app);
    const { id: rawId } = request.params as { id: string };
    const id = requireUuid(rawId);
    const input = parse(propertyUpdateSchema, request.body);
    const property = await app.db.property.findUnique({ where: { id }, select: { id: true, ownerId: true } });
    if (!property) throw notFound("Property not found.");
    if (property.ownerId !== actor.id && !isPrivileged(actor.role)) throw forbidden();
    const { amenityIds, ...fields } = input;
    const updated = await app.db.property.update({
      where: { id },
      data: {
        ...fields,
        ...(amenityIds !== undefined ? { amenities: { deleteMany: {}, create: amenityIds.map((amenityId) => ({ amenity: { connect: { id: amenityId } } })) } } : {}),
        ...(property.ownerId === actor.id ? { status: "PENDING_REVIEW", publishedAt: null } : {}),
      },
      include: { media: true, amenities: { include: { amenity: true } } },
    });
    return reply.send({ success: true, data: updated });
  });

  app.delete("/:id", async (request, reply) => {
    const actor = await requireActor(request, app);
    const { id: rawId } = request.params as { id: string };
    const id = requireUuid(rawId);
    const property = await app.db.property.findUnique({ where: { id }, select: { id: true, ownerId: true } });
    if (!property) throw notFound("Property not found.");
    if (property.ownerId !== actor.id && !isPrivileged(actor.role)) throw forbidden();
    await app.db.property.update({ where: { id }, data: { status: "ARCHIVED", publishedAt: null } });
    return reply.code(204).send();
  });
}
