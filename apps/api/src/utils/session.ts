import { createHmac, randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "@ghardekho/database";
import type { PublicUser } from "@ghardekho/types";
import { env } from "../config/env.js";
import { unauthorized } from "./errors.js";

export const sessionCookieName = "ghardekho_session";
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

export const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  role: true,
  profile: { select: { name: true, avatar: true, bio: true, city: true, state: true } },
} as const;

export function hashSessionToken(token: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");
}

export async function createSession(db: PrismaClient, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await db.authSession.deleteMany({ where: { userId, OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] } });
  await db.authSession.create({ data: { tokenHash: hashSessionToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

export function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date) {
  reply.setCookie(sessionCookieName, token, {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(sessionCookieName, {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
}

export async function authenticatedUser(request: FastifyRequest, db: PrismaClient): Promise<PublicUser> {
  const token = request.cookies[sessionCookieName];
  if (!token) throw unauthorized();
  const session = await db.authSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: { ...publicUserSelect, isActive: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) throw unauthorized();
  return {
    id: session.user.id,
    email: session.user.email,
    phone: session.user.phone,
    role: session.user.role,
    profile: session.user.profile,
  };
}
