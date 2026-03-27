export type AppMode = "dev" | "prod";

function isTruthy(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function getActiveValue(devValue: string | undefined, prodValue: string | undefined): string | undefined {
  const useDev = isTruthy(process.env.APP_DEV ?? process.env.NEXT_PUBLIC_APP_DEV);
  return useDev ? devValue : prodValue;
}

function normalizeOrigin(value: string | undefined, fallback: string): string {
  return (value || fallback).replace(/\/+$/, "");
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const appMode: AppMode = isTruthy(process.env.APP_DEV ?? process.env.NEXT_PUBLIC_APP_DEV)
  ? "dev"
  : "prod";

export const selectedCmsApiInternalOrigin = normalizeOrigin(
  getActiveValue(
    process.env.DEV_CMS_API_INTERNAL_ORIGIN ?? process.env.DEV_CMS_API_ORIGIN,
    process.env.PROD_CMS_API_INTERNAL_ORIGIN ?? process.env.PROD_CMS_API_ORIGIN,
  ),
  "http://localhost:4100",
);

export const selectedInternalApiOrigin = normalizeOrigin(
  getActiveValue(
    process.env.DEV_INTERNAL_API_ORIGIN,
    process.env.PROD_INTERNAL_API_ORIGIN,
  ),
  "http://localhost:8000",
);

export const selectedInternalApiToken = getActiveValue(
  process.env.DEV_INTERNAL_API_TOKEN,
  process.env.PROD_INTERNAL_API_TOKEN,
) || "";

export const cmsRevalidateSecret = getActiveValue(
  process.env.DEV_CMS_REVALIDATE_SECRET,
  process.env.PROD_CMS_REVALIDATE_SECRET,
) || process.env.CMS_REVALIDATE_SECRET || "local-dev-cms-revalidate-secret";

export const selectedRedisUrl = getActiveValue(
  process.env.DEV_DOCKER_REDIS_URL,
  process.env.PROD_DOCKER_REDIS_URL,
) || "";

export const selectedSmtpHost = getActiveValue(
  process.env.DEV_SMTP_HOST,
  process.env.PROD_SMTP_HOST,
) || "";

export const selectedSmtpPort = parseInteger(getActiveValue(
  process.env.DEV_SMTP_PORT,
  process.env.PROD_SMTP_PORT,
), 587);

export const selectedSmtpSecure = parseBoolean(getActiveValue(
  process.env.DEV_SMTP_SECURE,
  process.env.PROD_SMTP_SECURE,
), false);

export const selectedSmtpUser = getActiveValue(
  process.env.DEV_SMTP_USER,
  process.env.PROD_SMTP_USER,
) || "";

export const selectedSmtpPassword = getActiveValue(
  process.env.DEV_SMTP_PASSWORD,
  process.env.PROD_SMTP_PASSWORD,
) || "";

export const selectedSmtpFromAddress = getActiveValue(
  process.env.DEV_SMTP_FROM_ADDRESS,
  process.env.PROD_SMTP_FROM_ADDRESS,
) || "";

export const contactRateLimitMaxRequests = parseInteger(getActiveValue(
  process.env.DEV_CONTACT_RATE_LIMIT_MAX_REQUESTS ?? process.env.DEV_RATE_LIMIT_MAX_REQUESTS,
  process.env.PROD_CONTACT_RATE_LIMIT_MAX_REQUESTS ?? process.env.PROD_RATE_LIMIT_MAX_REQUESTS,
), 5);

export const contactRateLimitWindowSeconds = parseInteger(getActiveValue(
  process.env.DEV_CONTACT_RATE_LIMIT_WINDOW_SECONDS ?? process.env.DEV_RATE_LIMIT_WINDOW_SECONDS,
  process.env.PROD_CONTACT_RATE_LIMIT_WINDOW_SECONDS ?? process.env.PROD_RATE_LIMIT_WINDOW_SECONDS,
), 600);
