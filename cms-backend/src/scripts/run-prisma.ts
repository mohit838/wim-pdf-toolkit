import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cmsEnv } from "../lib/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsBackendRoot = path.resolve(__dirname, "..", "..");
const prismaBin = path.resolve(cmsBackendRoot, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: tsx src/scripts/run-prisma.ts <prisma-args...>");
  process.exit(1);
}

const child = spawn(prismaBin, args, {
  cwd: cmsBackendRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: cmsEnv.postgresUrl,
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
