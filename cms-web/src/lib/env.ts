function isTruthy(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
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

export const cmsAppMode = isTruthy(process.env.APP_DEV ?? process.env.NEXT_PUBLIC_APP_DEV)
  ? "dev"
  : "prod";

export const selectedCmsApiInternalOrigin = normalizeOrigin(
  getActiveValue(
    process.env.DEV_CMS_API_INTERNAL_ORIGIN ?? process.env.DEV_CMS_API_ORIGIN,
    process.env.PROD_CMS_API_INTERNAL_ORIGIN ?? process.env.PROD_CMS_API_ORIGIN,
  ),
  "http://localhost:4100",
);
