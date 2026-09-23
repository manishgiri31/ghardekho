import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Prisma, PrismaClient } from "@ghardekho/database";
import { ZodError } from "zod";
import { allowedOrigins, env } from "./config/env.js";
import { prisma } from "./plugins/database.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { propertyRoutes } from "./routes/properties.js";
import { ApiError } from "./utils/errors.js";
import { sessionCookieName } from "./utils/session.js";

declare module "fastify" {
  interface FastifyInstance { db: PrismaClient }
}

export type AppOptions = { db?: PrismaClient; logger?: boolean };

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger === false ? false : {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      redact: ["req.headers.cookie", "req.headers.authorization", "req.body.password", "req.body.passwordHash", "res.headers.set-cookie"],
    },
    bodyLimit: 1_048_576,
    requestTimeout: 30_000,
    trustProxy: env.NODE_ENV === "production",
  });

  app.decorate("db", options.db ?? prisma);
  await app.register(helmet, { contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } });
  await app.register(cors, { origin: allowedOrigins, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] });
  await app.register(cookie);
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  app.addHook("preHandler", (request, _reply, done) => {
    const changesState = ["POST", "PATCH", "PUT", "DELETE"].includes(request.method);
    const usesSessionCookie = Boolean(request.cookies[sessionCookieName]);
    const origin = request.headers.origin;
    if (changesState && usesSessionCookie && (!origin || !allowedOrigins.includes(origin))) {
      done(new ApiError(403, "CSRF_REJECTED", "Request origin is not allowed."));
      return;
    }
    if (changesState && origin && !allowedOrigins.includes(origin)) {
      done(new ApiError(403, "CSRF_REJECTED", "Request origin is not allowed."));
      return;
    }
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) return reply.code(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
    if (error instanceof ZodError) return reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request." } });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return reply.code(409).send({ success: false, error: { code: "CONFLICT", message: "A record with these details already exists." } });
      if (error.code === "P2025") return reply.code(404).send({ success: false, error: { code: "NOT_FOUND", message: "Resource not found." } });
    }
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : undefined;
    if (statusCode === 429) return reply.code(429).send({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." } });
    if (statusCode && statusCode < 500) return reply.code(statusCode).send({ success: false, error: { code: "INVALID_REQUEST", message: error instanceof Error ? error.message : "Invalid request." } });
    request.log.error({ err: error }, "Unhandled request error");
    return reply.code(500).send({ success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
  });

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(propertyRoutes, { prefix: "/api/v1/properties" });
  app.addHook("onClose", async () => {
    if (!options.db) await prisma.$disconnect();
  });

  return app;
}
