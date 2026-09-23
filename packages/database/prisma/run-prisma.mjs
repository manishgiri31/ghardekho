import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(packageDirectory, "../../.env") });

const cliPath = resolve(packageDirectory, "node_modules/prisma/build/index.js");
const result = spawnSync(process.execPath, [cliPath, ...process.argv.slice(2)], {
  cwd: packageDirectory,
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
