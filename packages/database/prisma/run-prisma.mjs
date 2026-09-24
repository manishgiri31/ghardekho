import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");

dotenv.config({
  path: resolve(packageDirectory, "../../.env"),
});

const require = createRequire(import.meta.url);

let prismaPackageJson;
try {
  prismaPackageJson = require.resolve("prisma/package.json");
} catch (error) {
  throw new Error(
    "Unable to resolve the Prisma CLI. Ensure prisma@6.12.0 is installed in the root or database workspace.",
    { cause: error },
  );
}
const prismaDirectory = dirname(prismaPackageJson);
const cliPath = resolve(prismaDirectory, "build/index.js");

const result = spawnSync(
  process.execPath,
  [cliPath, ...process.argv.slice(2)],
  {
    cwd: packageDirectory,
    env: process.env,
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
