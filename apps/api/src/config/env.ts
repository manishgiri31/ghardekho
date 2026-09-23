import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

for (const candidate of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  WEB_ORIGINS: z.string().default("http://localhost:3000"),
  COOKIE_DOMAIN: z.string().optional().transform((value) => value?.trim() || undefined),
});

export const env = envSchema.parse(process.env);

if (env.AUTH_SECRET.startsWith("replace-with-")) {
  throw new Error("Replace the example AUTH_SECRET with a private random value.");
}

export const allowedOrigins = env.WEB_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);

if (allowedOrigins.includes("*")) {
  throw new Error("WEB_ORIGINS must list exact origins; wildcard CORS is incompatible with session cookies.");
}
if (env.NODE_ENV === "production" && (!process.env.WEB_ORIGINS || allowedOrigins.some((origin) => /localhost|127\.0\.0\.1/.test(origin)))) {
  throw new Error("Set WEB_ORIGINS to the deployed web origin(s) in production.");
}
