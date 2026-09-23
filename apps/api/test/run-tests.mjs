import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), "../../.env") });
process.env.NODE_ENV ??= "test";
process.env.AUTH_SECRET ??= randomBytes(32).toString("base64url");

const integration = process.argv[2] === "integration";
if (integration && !process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL to a migrated PostgreSQL database before running API integration tests.");
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/unused?schema=public";
}

const testFile = integration ? "test/integration.test.ts" : "test/app.test.ts";
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", testFile], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
