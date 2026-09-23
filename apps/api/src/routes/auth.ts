import { compare, hash } from "bcryptjs";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { loginSchema, registrationSchema } from "@ghardekho/validation";
import { ApiError, badRequest, unauthorized } from "../utils/errors.js";
import { authenticatedUser, clearSessionCookie, createSession, hashSessionToken, publicUserSelect, sessionCookieName, setSessionCookie } from "../utils/session.js";

function parse<T>(schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw badRequest(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  return result.data;
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const input = parse(registrationSchema, request.body);
    const passwordHash = await hash(input.password, 12);
    let user;
    try {
      user = await app.db.user.create({
        data: {
          email: input.email,
          phone: input.phone,
          passwordHash,
          profile: { create: { name: input.name } },
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        throw new ApiError(409, "ACCOUNT_EXISTS", "An account with that email or phone already exists.");
      }
      throw error;
    }
    const session = await createSession(app.db, user.id);
    setSessionCookie(reply, session.token, session.expiresAt);
    return reply.code(201).send({ success: true, data: { user } });
  });

  app.post("/login", { config: { rateLimit: { max: 8, timeWindow: "1 minute" } } }, async (request, reply) => {
    const input = parse(loginSchema, request.body);
    const user = await app.db.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive || !(await compare(input.password, user.passwordHash))) throw unauthorized("Email or password is incorrect.");
    const session = await createSession(app.db, user.id);
    setSessionCookie(reply, session.token, session.expiresAt);
    const publicUser = await app.db.user.findUniqueOrThrow({ where: { id: user.id }, select: publicUserSelect });
    return reply.send({ success: true, data: { user: publicUser } });
  });

  app.post("/logout", async (request: FastifyRequest, reply) => {
    const token = request.cookies[sessionCookieName];
    if (token) {
      await app.db.authSession.updateMany({
        where: { tokenHash: hashSessionToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearSessionCookie(reply);
    return reply.send({ success: true, data: { loggedOut: true } });
  });

  app.get("/me", async (request) => {
    const user = await authenticatedUser(request, app.db);
    return { success: true, data: { user } };
  });
}
