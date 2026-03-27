import { revalidateTag } from "next/cache";
import { CMS_CONTENT_LIBRARY_TAG, CMS_RUNTIME_CONFIG_TAG, CMS_SITE_CONTENT_TAG } from "@/lib/cms-runtime";
import { ensureRootEnvLoaded } from "@/lib/root-env";
import { appMode, cmsRevalidateSecret } from "@/lib/server-env";

ensureRootEnvLoaded();

function getCmsRevalidateSecret(): string {
  if (appMode === "dev") {
    return cmsRevalidateSecret || "local-dev-cms-revalidate-secret";
  }

  return cmsRevalidateSecret || "";
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
