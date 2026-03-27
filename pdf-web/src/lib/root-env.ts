import fs from "node:fs";
import path from "node:path";

let loaded = false;

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  if (!key || key in process.env) {
    return null;
  }

  let value = trimmed.slice(separatorIndex + 1).trim();
  if (value.length >= 2 && value[0] === value[value.length - 1] && (value[0] === '"' || value[0] === "'")) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

export function ensureRootEnvLoaded(): void {
  if (loaded) {
    return;
  }

  const rootEnvPath = path.resolve(process.cwd(), "..", ".env");
  if (!fs.existsSync(rootEnvPath)) {
    loaded = true;
    return;
  }

  const raw = fs.readFileSync(rootEnvPath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;
    process.env[key] = value;
  }

  loaded = true;
}
