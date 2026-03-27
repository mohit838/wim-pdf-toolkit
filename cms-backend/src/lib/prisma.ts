import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { cmsEnv } from "./env";

const globalForPrisma = globalThis as typeof globalThis & {
  cmsPrismaClient?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: cmsEnv.postgresUrl,
  max: 20,
});

export const prisma = globalForPrisma.cmsPrismaClient || new PrismaClient({
  adapter,
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.cmsPrismaClient = prisma;
}

export async function closePrisma(): Promise<void> {
  await prisma.$disconnect();
}
