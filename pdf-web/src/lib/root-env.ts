let envLoaded = false;

/**
 * Searches for a .env file from the current directory up to the root,
 * and loads it into process.env if found.
 */
export function ensureRootEnvLoaded() {
  if (typeof window !== "undefined") {
    return;
  }

  if (envLoaded) {
    return;
  }

  try {
    // Shielded from bundler using eval('require')
    const fs = eval('require("node:fs")');
    const path = eval('require("node:path")');

    let current = process.cwd();
    const root = path.parse(current).root;

    const candidates = [
      path.resolve(current, ".env"),
      path.resolve(current, "..", ".env"),
      path.resolve(current, "..", "..", ".env"),
    ];

    const envPath = candidates.find((candidate: string) => fs.existsSync(candidate));
    if (!envPath) {
      return;
    }

    const content = fs.readFileSync(envPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = line.split("=");
      const normalizedKey = key.trim();
      if (!normalizedKey || process.env[normalizedKey] !== undefined) {
        continue;
      }

      let value = valueParts.join("=").trim();
      if (value.length >= 2 && value[0] === value[value.length - 1] && [`"`, "'"].includes(value[0])) {
        value = value.slice(1, -1);
      }

      process.env[normalizedKey] = value;
    }

    envLoaded = true;
  } catch (error) {
    // Silently fail if require is not available (e.g. edge runtime)
  }
}
