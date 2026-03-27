import express from "express";
import { adminRouter } from "./routes/admin";
import { publishedRouter } from "./routes/published";
import { cmsEnv } from "./lib/env";
import { closePrisma } from "./lib/prisma";
import { checkRateLimit, getRedisClient } from "./lib/redis";
import { ensureCmsStorage, getCmsSystemStatus } from "./lib/storage";
import { getClientIpFromRequest } from "./lib/client-ip";

async function main() {
  await ensureCmsStorage();
  await getRedisClient();

  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "2mb" }));

  app.use(async (request, response, next) => {
    const origin = request.headers.origin;
    if (origin && origin === cmsEnv.cmsWebOrigin) {
      response.setHeader("access-control-allow-origin", origin);
      response.setHeader("access-control-allow-credentials", "true");
      response.setHeader("access-control-allow-headers", "content-type");
      response.setHeader("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
      response.setHeader("vary", "Origin");
    }

    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    if (request.path !== "/healthz") {
      const rateLimit = await checkRateLimit(
        getClientIpFromRequest(request),
        cmsEnv.rateLimitMaxRequests,
        cmsEnv.rateLimitWindowSeconds,
      );

      for (const [headerName, headerValue] of Object.entries(rateLimit.headers)) {
        response.setHeader(headerName, headerValue);
      }

      if (!rateLimit.allowed) {
        response.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });
        return;
      }
    }

    next();
  });

  app.get("/healthz", async (_request, response) => {
    try {
      const status = await getCmsSystemStatus();
      const databaseOk = status.database === "ok";
      const redisOk = status.redis === "ok";
      const ready = databaseOk && redisOk;

      response.status(ready ? 200 : 503).json({
        ok: ready,
        service: "cms-api",
        mode: cmsEnv.appMode,
        checks: {
          database: databaseOk ? "ok" : "degraded",
          redis: redisOk ? "ok" : "degraded",
        },
        status,
      });
    } catch (error) {
      response.status(503).json({
        ok: false,
        service: "cms-api",
        mode: cmsEnv.appMode,
        checks: {
          database: "unknown",
          redis: "unknown",
        },
        message: error instanceof Error ? error.message : "Health check failed.",
      });
    }
  });

  app.use("/published/v1", publishedRouter);
  app.use("/admin/v1", adminRouter);

  app.use((_request, response) => {
    response.status(404).json({
      success: false,
      message: "Route not found.",
    });
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled cms-api error", error);

    if (response.headersSent) {
      return;
    }

    response.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  });

  const server = app.listen(cmsEnv.apiPort, () => {
    console.log(`cms-api listening on ${cmsEnv.apiPort}`);
  });

  async function shutdown() {
    server.close();
    await closePrisma();
    process.exit(0);
  }

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
}

main().catch((error) => {
  console.error("cms-api failed to start", error);
  process.exit(1);
});
