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
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No response body");
      console.error(`[Revalidate] Failed: Status ${response.status}, URL: ${cmsEnv.publicSiteRevalidateUrl}, Body: ${errorText}`);
      throw new Error(`Frontend revalidation failed (${response.status}): ${errorText.slice(0, 100)}`);
    }

    console.log(`[Revalidate] Success: ${cmsEnv.publicSiteRevalidateUrl}`);
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error(`[Revalidate] Timeout: ${cmsEnv.publicSiteRevalidateUrl}`);
      throw new Error("Frontend revalidation timed out after 5s.");
    }
    console.error(`[Revalidate] Unexpected Error: ${error.message}`);
    throw error;
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
