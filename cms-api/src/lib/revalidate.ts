import { cmsEnv } from "./env";

async function postRevalidateRequest(dryRun: boolean): Promise<void> {
  if (!cmsEnv.publicSiteRevalidateUrl || !cmsEnv.cmsRevalidateSecret) {
    throw new Error("Frontend revalidation URL/secret is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(cmsEnv.publicSiteRevalidateUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-cms-revalidate-secret": cmsEnv.cmsRevalidateSecret,
        ...(dryRun ? { "x-cms-revalidate-dry-run": "1" } : {}),
      },
      body: JSON.stringify({
        source: dryRun ? "cms-backend-readiness" : "cms-backend",
        dryRun,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Frontend revalidation failed with status ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function revalidatePublicSite(): Promise<void> {
  await postRevalidateRequest(false);
}

export async function checkPublicSiteRevalidateHealth(): Promise<void> {
  await postRevalidateRequest(true);
}
