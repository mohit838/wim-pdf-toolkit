import { cmsEnv } from "./lib/env";
import { closePrisma } from "./lib/prisma";
import { getRedisClient, waitForRevalidationJob } from "./lib/redis";
import { revalidatePublicSite } from "./lib/revalidate";
import { ensureCmsStorage, markReleaseRevalidationResult } from "./lib/storage";

async function processJobs() {
  console.log(`cms-backend worker started in ${cmsEnv.appMode} mode`);
  await ensureCmsStorage();
  await getRedisClient();

  while (true) {
    const job = await waitForRevalidationJob(5);
    if (!job) {
      continue;
    }

    try {
      await revalidatePublicSite();
      await markReleaseRevalidationResult(job.releaseId, true, "Frontend revalidation completed.");
      console.log(`cms-backend revalidated frontend for release ${job.releaseId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown revalidation error";
      await markReleaseRevalidationResult(job.releaseId, false, message);
      console.error(`cms-backend revalidation failed for release ${job.releaseId}`, error);
    }
  }
}

processJobs().catch(async (error) => {
  console.error("cms-backend worker failed", error);
  await closePrisma();
  process.exit(1);
});
