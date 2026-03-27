export type PublicAppMode = "dev" | "prod";

function isTruthy(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const publicAppMode: PublicAppMode = isTruthy(process.env.NEXT_PUBLIC_APP_DEV)
  ? "dev"
  : "prod";

const publicSiteOrigins = {
  dev: process.env.NEXT_PUBLIC_DEV_SITE_ORIGIN,
  prod: process.env.NEXT_PUBLIC_PROD_SITE_ORIGIN,
} satisfies Record<PublicAppMode, string | undefined>;

export const selectedPublicSiteOrigin = publicSiteOrigins[publicAppMode];
