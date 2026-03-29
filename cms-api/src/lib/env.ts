import fs from "node:fs";
import path from "node:path";

function readRootEnvFile(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(process.cwd(), "..", "..", ".env"),
  ];

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) {
    return;
  }

  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
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
}

function isTruthy(value: string | undefined, fallback = false): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function getActiveValue(devValue: string | undefined, prodValue: string | undefined): string | undefined {
  const useDev = isTruthy(process.env.APP_DEV, true);
  return useDev ? devValue : prodValue;
}

function getScopedValue(name: string, fallback = ""): string {
  return getActiveValue(process.env[`DEV_${name}`], process.env[`PROD_${name}`])?.trim() || fallback;
}

function getScopedDockerValue(name: string, fallback = ""): string {
  return getActiveValue(process.env[`DEV_DOCKER_${name}`], process.env[`PROD_DOCKER_${name}`])?.trim() || fallback;
}

function getScopedBoolean(name: string, fallback: boolean): boolean {
  return isTruthy(getActiveValue(process.env[`DEV_${name}`], process.env[`PROD_${name}`]), fallback);
}

function isRunningInDocker(): boolean {
  return process.env.DOCKER_CONTAINER === "true";
}

function getScopedNumber(name: string, fallback: number): number {
  const value = Number(getScopedValue(name, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, "");
}

readRootEnvFile();

const appMode = isTruthy(process.env.APP_DEV, true) ? "dev" : "prod";
const cmsRedisPrefix = getScopedValue("REDIS_CMS_PREFIX", "cms");

export interface CmsEnv {
  appMode: "dev" | "prod";
  apiPort: number;
  cmsWebOrigin: string;
  publicSiteOrigin: string;
  publicSiteRevalidateUrl: string;
  cmsRevalidateSecret: string;
  cmsIngestSecret: string;
  sessionSecret: string;
  secureCookies: boolean;
  cookieDomain: string;
  totpIssuer: string;
  superadminEmail: string;
  superadminPassword: string;
  superadminName: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  analyticsEnabled: boolean;
  logLevel: string;
  postgresUrl: string;
  redisUrl: string;
  redisPrefix: string;
  redisSessionPrefix: string;
  redisCachePrefix: string;
  redisQueuePrefix: string;
  redisRateLimitPrefix: string;
  sessionTtlSeconds: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxRequests: number;
  contactRateLimitIpWindowSeconds: number;
  contactRateLimitIpMaxRequests: number;
  contactRateLimitEmailWindowSeconds: number;
  contactRateLimitEmailMaxRequests: number;
  contactRateLimitPayloadWindowSeconds: number;
  contactRateLimitPayloadMaxRequests: number;
  contactMaxLinks: number;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFromAddress: string;
}

export const cmsEnv: CmsEnv = {
  appMode,
  apiPort: getScopedNumber("CMS_API_PORT", 4100),
  cmsWebOrigin: normalizeOrigin(getScopedValue("CMS_WEB_ORIGIN", "http://localhost:3100")),
  publicSiteOrigin: normalizeOrigin(getScopedValue("PUBLIC_SITE_ORIGIN", "http://localhost:3000")),
  publicSiteRevalidateUrl: normalizeOrigin(
    getScopedValue("PUBLIC_SITE_REVALIDATE_URL", "http://localhost:3000/api/revalidate/cms"),
  ),
  cmsRevalidateSecret: getScopedValue("CMS_REVALIDATE_SECRET", "change-this-cms-revalidate-secret"),
  cmsIngestSecret: getScopedValue("CMS_INGEST_SECRET", "change-this-cms-ingest-secret"),
  sessionSecret: getScopedValue("CMS_SESSION_SECRET", "change-this-cms-session-secret"),
  secureCookies: getScopedBoolean("CMS_COOKIE_SECURE", false),
  cookieDomain: getScopedValue("CMS_COOKIE_DOMAIN", ""),
  totpIssuer: getScopedValue("CMS_TOTP_ISSUER", "PDF Toolkit CMS"),
  superadminEmail: getScopedValue("CMS_SUPERADMIN_EMAIL", "superadmin@example.com"),
  superadminPassword: getScopedValue("CMS_SUPERADMIN_PASSWORD", "ChangeMe123!"),
  superadminName: getScopedValue("CMS_SUPERADMIN_NAME", "Super Admin"),
  adminEmail: getScopedValue("CMS_ADMIN_EMAIL", ""),
  adminPassword: getScopedValue("CMS_ADMIN_PASSWORD", ""),
  adminName: getScopedValue("CMS_ADMIN_NAME", "Admin"),
  analyticsEnabled: getScopedBoolean("ANALYTICS_ENABLED", true),
  logLevel: getScopedValue("LOG_LEVEL", "info"),
  postgresUrl: (isRunningInDocker() ? getScopedDockerValue("POSTGRES_URL") : "") ||
    getScopedValue("POSTGRES_URL") ||
    "postgresql://postgres:postgres@127.0.0.1:5432/pdf_cms_db?schema=public",
  redisUrl: (isRunningInDocker() ? getScopedDockerValue("REDIS_URL") : "") ||
    getScopedValue("REDIS_URL") ||
    "redis://:mypassword@127.0.0.1:6379/0",
  redisPrefix: cmsRedisPrefix,
  redisSessionPrefix: `${cmsRedisPrefix}:session`,
  redisCachePrefix: `${cmsRedisPrefix}:cache`,
  redisQueuePrefix: `${cmsRedisPrefix}:queue`,
  redisRateLimitPrefix: `${cmsRedisPrefix}:ratelimit`,
  sessionTtlSeconds: getScopedNumber("CMS_SESSION_TTL_SECONDS", 60 * 60 * 12),
  rateLimitWindowSeconds: getScopedNumber("RATE_LIMIT_WINDOW_SECONDS", 60),
  rateLimitMaxRequests: getScopedNumber("RATE_LIMIT_MAX_REQUESTS", 120),
  contactRateLimitIpWindowSeconds: getScopedNumber("CONTACT_RATE_LIMIT_IP_WINDOW_SECONDS", 60 * 60),
  contactRateLimitIpMaxRequests: getScopedNumber("CONTACT_RATE_LIMIT_IP_MAX_REQUESTS", 3),
  contactRateLimitEmailWindowSeconds: getScopedNumber("CONTACT_RATE_LIMIT_EMAIL_WINDOW_SECONDS", 60 * 60 * 24),
  contactRateLimitEmailMaxRequests: getScopedNumber("CONTACT_RATE_LIMIT_EMAIL_MAX_REQUESTS", 2),
  contactRateLimitPayloadWindowSeconds: getScopedNumber("CONTACT_RATE_LIMIT_PAYLOAD_WINDOW_SECONDS", 60 * 10),
  contactRateLimitPayloadMaxRequests: getScopedNumber("CONTACT_RATE_LIMIT_PAYLOAD_MAX_REQUESTS", 1),
  contactMaxLinks: getScopedNumber("CONTACT_MAX_LINKS", 2),
  smtpHost: getScopedValue("SMTP_HOST", "127.0.0.1"),
  smtpPort: getScopedNumber("SMTP_PORT", 1025),
  smtpSecure: getScopedBoolean("SMTP_SECURE", false),
  smtpUser: getScopedValue("SMTP_USER", ""),
  smtpPassword: getScopedValue("SMTP_PASSWORD", ""),
  smtpFromAddress: getScopedValue("SMTP_FROM_ADDRESS", "notifications@example.test"),
};

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("replace-") || normalized.includes("example.invalid") || normalized.includes("changeme") || normalized.includes("<");
}

function assertConfigured(name: string, value: string): void {
  if (isPlaceholderValue(value)) {
    throw new Error(`Invalid ${name}: placeholder value detected. Update your .env for active APP_DEV scope.`);
  }
}

function assertStrongSecret(name: string, value: string): void {
  const trimmed = value.trim();
  if (trimmed.length < 24 || isPlaceholderValue(trimmed)) {
    throw new Error(`Invalid ${name}: use a strong non-placeholder secret for production.`);
  }
}

assertConfigured("REDIS_URL", cmsEnv.redisUrl);
assertConfigured("POSTGRES_URL", cmsEnv.postgresUrl);

if (cmsEnv.appMode === "prod") {
  assertStrongSecret("CMS_SESSION_SECRET", cmsEnv.sessionSecret);
  assertStrongSecret("CMS_REVALIDATE_SECRET", cmsEnv.cmsRevalidateSecret);
  assertStrongSecret("CMS_INGEST_SECRET", cmsEnv.cmsIngestSecret);
  assertStrongSecret("CMS_SUPERADMIN_PASSWORD", cmsEnv.superadminPassword);
  assertConfigured("SMTP_HOST", cmsEnv.smtpHost);
  assertConfigured("SMTP_FROM_ADDRESS", cmsEnv.smtpFromAddress);
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
