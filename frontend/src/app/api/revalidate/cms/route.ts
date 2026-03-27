import { revalidateTag } from "next/cache";
import { CMS_CONTENT_LIBRARY_TAG, CMS_RUNTIME_CONFIG_TAG, CMS_SITE_CONTENT_TAG } from "@/lib/cms-runtime";
import { ensureRootEnvLoaded } from "@/lib/root-env";

ensureRootEnvLoaded();

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

function getCmsRevalidateSecret(): string {
  const activeSecret = getActiveValue(
    process.env.DEV_CMS_REVALIDATE_SECRET,
    process.env.PROD_CMS_REVALIDATE_SECRET,
  ) || process.env.CMS_REVALIDATE_SECRET;
  const isDev = isTruthy(process.env.APP_DEV ?? process.env.NEXT_PUBLIC_APP_DEV);

  if (isDev) {
    return activeSecret || "local-dev-cms-revalidate-secret";
  }

  return activeSecret || "";
}

export async function POST(request: Request) {
  const expectedSecret = getCmsRevalidateSecret();
  const secret = request.headers.get("x-cms-revalidate-secret");
  const isDryRun = request.headers.get("x-cms-revalidate-dry-run") === "1";

  if (!expectedSecret) {
    return Response.json(
      {
        ok: false,
        message: "Revalidation secret is not configured.",
      },
      {
        status: 500,
      },
    );
  }

  if (!expectedSecret || secret !== expectedSecret) {
    return Response.json(
      {
        ok: false,
        message: "Invalid revalidation secret.",
      },
      {
        status: 401,
      },
    );
  }

  if (isDryRun) {
    return Response.json({
      ok: true,
      dryRun: true,
    });
  }

  revalidateTag(CMS_RUNTIME_CONFIG_TAG, "max");
  revalidateTag(CMS_SITE_CONTENT_TAG, "max");
  revalidateTag(CMS_CONTENT_LIBRARY_TAG, "max");

  return Response.json({
    ok: true,
  });
}
