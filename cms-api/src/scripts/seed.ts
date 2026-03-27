import { closePrisma } from "../lib/prisma";
import { getRedisClient } from "../lib/redis";
import { ensureCmsStorage } from "../lib/storage";

async function main() {
  await ensureCmsStorage();
  console.log("cms-backend seed completed");
}

main()
  .catch((error) => {
    console.error("cms-backend seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    const redis = await getRedisClient();
    if (redis.isOpen) {
      await redis.quit();
    }
    await closePrisma();
  });
