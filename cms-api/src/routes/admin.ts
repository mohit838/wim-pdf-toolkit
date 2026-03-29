import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import { sanitize } from "payload-sanitizer";
import { ZodError } from "zod";
import {
  clearSessionCookie,
  createSessionCookie,
  createTwoFactorChallenge,
  destroySession,
  requireAuth,
  requirePermission,
  toSessionUser,
  verifyPassword,
  verifyTwoFactorCode,
} from "../lib/auth";
import {
  getCmsSystemStatus,
  appendAuditLog,
  getAuditLogPaged,
  getAdsDraftPlacementsPaged,
  getDraftConfig,
  getDraftContentLibrary,
  getDraftSiteContent,
  getReleaseLog,
  getUserByEmail,
  getUserById,
  getUsers,
  getUsersPaged,
  getFaqDraftPaged,
  getGuidesDraftPaged,
  getPublishReadiness,
  publishAllDraftContent,
  saveDraftConfig,
  saveDraftContentLibrary,
  saveDraftSiteContent,
  updateDraftAds,
  updateDraftHomepage,
  updateDraftIntegrations,
  updateUserPermissions,
  updateDraftSeo,
  updateDraftSiteShell,
  updateDraftTools,
  refreshRuntimeCaches,
} from "../lib/storage";
import {
  loginSchema,
  updateAdsDraftSchema,
  updateContentLibraryDraftSchema,
  updateDraftSchema,
  updateHomepageDraftSchema,
  updateHomepageHeroDraftSchema,
  updateIntegrationsDraftSchema,
  updateSeoDraftSchema,
  updateSiteContentDraftSchema,
  updateSiteShellDraftSchema,
  updateToolsDraftSchema,
} from "../lib/schemas";
import { parseQueryBoolean, parseQueryNumber, parseQueryString } from "../lib/pagination";
import type { CmsModuleSummaryItem, SessionUser } from "../lib/types";

function getRequestId(): string {
  return crypto.randomUUID();
}

function getIpAddress(request: Request): string | null {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0] || null;
  }

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.socket.remoteAddress || null;
}

async function audit(
  user: SessionUser | null,
  requestId: string,
  request: Request,
  action: string,
  module: string,
  target: string,
  result: "success" | "failure",
  details: Record<string, unknown> = {},
): Promise<void> {
  await appendAuditLog({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    actorId: user?.id || null,
    actorEmail: user?.email || null,
    actorRole: user?.role || null,
    action,
    module,
    target,
    result,
    requestId,
    ipAddress: getIpAddress(request),
    userAgent: request.headers["user-agent"] || null,
    details,
  });
}

function handleRouteError(error: unknown, response: Response, invalidMessage: string, fallbackMessage: string): void {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      message: invalidMessage,
      issues: error.issues,
    });
    return;
  }

  response.status(500).json({
    success: false,
    message: fallbackMessage,
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function sanitizeRequestBody<T>(value: T): T {
  return sanitize(value, {
    drop: ["undefined", "null", "nan"],
    trimStrings: true,
    cleanArrays: true,
  }) as T;
}

async function requireSuperadmin(request: Request, response: Response): Promise<SessionUser | null> {
  const user = await requireAuth(request, response);
  if (!user) {
    return null;
  }

  if (user.role !== "SUPERADMIN") {
    response.status(403).json({
      success: false,
      message: "Superadmin access required.",
    });
    return null;
  }

  return user;
}

async function buildModuleSummary(): Promise<CmsModuleSummaryItem[]> {
  const [runtimeConfig, contentLibrary, users] = await Promise.all([
    getDraftConfig(),
    getDraftContentLibrary(),
    getUsers(),
  ]);
  const seo = asRecord(runtimeConfig.seo);
  const seoPages = asRecord(seo.pages);

  return [
    {
      id: "seo",
      title: "Runtime SEO",
      status: "live",
      description: "Site defaults and per-route metadata for the public frontend.",
      entityCount: Object.keys(seoPages).length,
    },
    {
      id: "ads",
      title: "Ads and Slots",
      status: "live",
      description: "AdSense and custom slot placement rules resolved at runtime.",
      entityCount: runtimeConfig.adPlacements.length,
    },
    {
      id: "legal-pages",
      title: "Legal Pages",
      status: "live",
      description: "About, contact, privacy, terms, cookies, and ad disclosure pages published on the public frontend.",
      entityCount: Object.keys(contentLibrary.legalPages).length,
    },
    {
      id: "admins",
      title: "Admins and Roles",
      status: "live",
      description: "Prisma-backed admin accounts, sessions, and permission assignments.",
      entityCount: users.length,
    },
  ];
}

const permissionCatalog = {
  modules: [
    "runtime_config",
    "content_library",
    "audit_logs",
    "admins",
    "permissions",
  ],
  actions: ["read", "update", "publish", "manage"],
};

export const adminRouter = Router();

adminRouter.post("/auth/login", async (request, response) => {
  const requestId = getRequestId();

  try {
    const payload = loginSchema.parse(sanitizeRequestBody(request.body));
    const user = await getUserByEmail(payload.email);

    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
      await audit(null, requestId, request, "login", "auth", payload.email, "failure");
      response.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    if (user.twoFactorEnabled) {
      if (!user.twoFactorSecret || !payload.twoFactorCode) {
        await audit(toSessionUser(user), requestId, request, "login_2fa_required", "auth", user.email, "success");
        response.status(202).json({
          success: true,
          data: {
            requiresTwoFactor: true,
            challengeToken: createTwoFactorChallenge(user),
          },
        });
        return;
      }

      if (!verifyTwoFactorCode(user.twoFactorSecret, payload.twoFactorCode)) {
        await audit(toSessionUser(user), requestId, request, "login_2fa", "auth", user.email, "failure");
        response.status(401).json({
          success: false,
          message: "Invalid two-factor code.",
        });
        return;
      }
    }

    response.setHeader("set-cookie", await createSessionCookie(toSessionUser(user), request));
    await audit(toSessionUser(user), requestId, request, "login", "auth", user.email, "success");
    response.json({
      success: true,
      data: {
        user: toSessionUser(user),
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Invalid login payload.", "Login failed.");
  }
});

adminRouter.get("/auth/session", async (request, response) => {
  const user = await requireAuth(request, response);
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: {
      user,
    },
  });
});

adminRouter.post("/auth/logout", async (request, response) => {
  const requestId = getRequestId();
  const user = await requireAuth(request, response);
  if (!user) {
    return;
  }

  await destroySession(request);
  response.setHeader("set-cookie", clearSessionCookie());
  await audit(user, requestId, request, "logout", "auth", user.email, "success");
  response.json({
    success: true,
  });
});

adminRouter.get("/system/status", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: await getCmsSystemStatus(),
  });
});

adminRouter.get("/modules/summary", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: await buildModuleSummary(),
  });
});

adminRouter.get("/admins", async (request, response) => {
  const user = await requireSuperadmin(request, response);
  if (!user) {
    return;
  }

  const q = parseQueryString(request.query.q);
  const page = parseQueryNumber(request.query.page, 1);
  const pageSize = parseQueryNumber(request.query.pageSize, 20);
  const admins = await getUsersPaged({ q, page, pageSize });
  response.json({
    success: true,
    data: {
      ...admins,
      items: admins.items.map((entry) => ({
        id: entry.id,
        email: entry.email,
        name: entry.name,
        role: entry.role,
        permissions: entry.permissions,
        twoFactorEnabled: entry.twoFactorEnabled,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })),
    },
  });
});

adminRouter.get("/permissions/catalog", async (request, response) => {
  const user = await requireSuperadmin(request, response);
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: permissionCatalog,
  });
});

adminRouter.put("/admins/:id/permissions", async (request, response) => {
  const requestId = getRequestId();
  const user = await requireSuperadmin(request, response);
  if (!user) {
    return;
  }

  const targetId = String(request.params.id || "").trim();
  if (!targetId) {
    response.status(400).json({
      success: false,
      message: "Admin user id is required.",
    });
    return;
  }

  if (targetId === user.id) {
    response.status(400).json({
      success: false,
      message: "You cannot edit your own permissions.",
    });
    return;
  }

  const target = await getUserById(targetId);
  if (!target) {
    response.status(404).json({
      success: false,
      message: "Admin user not found.",
    });
    return;
  }

  if (target.role !== "ADMIN") {
    response.status(403).json({
      success: false,
      message: "Only ADMIN users can be edited here.",
    });
    return;
  }

  try {
    const body = asRecord(sanitizeRequestBody(request.body));
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];
    const allowed = new Set(permissionCatalog.modules.flatMap((module) =>
      permissionCatalog.actions.map((action) => `${module}:${action}`),
    ));
    const filtered = Array.from(new Set(
      permissions
        .map((entry) => String(entry).trim())
        .filter((entry) => allowed.has(entry)),
    ));

    const updated = await updateUserPermissions(targetId, filtered);
    await audit(user, requestId, request, "update_permissions", "admins", target.email, "success", {
      targetId,
      permissionCount: filtered.length,
    });

    response.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        permissions: updated.permissions,
        twoFactorEnabled: updated.twoFactorEnabled,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    await audit(user, requestId, request, "update_permissions", "admins", target.email, "failure");
    response.status(500).json({
      success: false,
      message: "Could not update admin permissions.",
    });
  }
});

adminRouter.get("/runtime-config/draft", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: await getDraftConfig(),
  });
});

adminRouter.put("/runtime-config/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "runtime_config:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateDraftSchema.parse(request.body);
    const saved = await saveDraftConfig(payload.config);
    await audit(user, requestId, request, "update_draft", "runtime_config", "draft", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "runtime_config", "draft", "failure");
    handleRouteError(error, response, "Invalid runtime config payload.", "Could not save the draft config.");
  }
});

adminRouter.get("/site-content/draft", async (request, response) => {
  const user = await requirePermission(request, response, "site_content:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: await getDraftSiteContent(),
  });
});

adminRouter.put("/site-content/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "site_content:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateSiteContentDraftSchema.parse(request.body);
    const saved = await saveDraftSiteContent(payload.site);
    await audit(user, requestId, request, "update_draft", "site_content", "site", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "site_content", "site", "failure");
    handleRouteError(error, response, "Invalid site content payload.", "Could not save the site content draft.");
  }
});

adminRouter.get("/site-shell/draft", async (request, response) => {
  const user = await requirePermission(request, response, "site_content:read");
  if (!user) {
    return;
  }

  const site = asRecord((await getDraftSiteContent()).site);
  response.json({
    success: true,
    data: {
      branding: asRecord(site.branding),
      contact: asRecord(site.contact),
      organization: asRecord(site.organization),
      system: asRecord(site.system),
      ui: asRecord(site.ui),
      navigation: asRecord(site.navigation),
      footer: asRecord(site.footer),
    },
  });
});

adminRouter.put("/site-shell/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "site_content:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateSiteShellDraftSchema.parse(sanitizeRequestBody(request.body));
    const saved = await updateDraftSiteShell(payload);
    await audit(user, requestId, request, "update_draft", "site_shell", "site-shell", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "site_shell", "site-shell", "failure");
    handleRouteError(error, response, "Invalid site shell payload.", "Could not save the site shell draft.");
  }
});

adminRouter.get("/homepage/draft", async (request, response) => {
  const user = await requirePermission(request, response, "site_content:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: {
      home: asRecord(asRecord((await getDraftSiteContent()).site).home),
    },
  });
});

adminRouter.put("/homepage/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "site_content:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateHomepageDraftSchema.parse(sanitizeRequestBody(request.body));
    const saved = await updateDraftHomepage(payload.home);
    await audit(user, requestId, request, "update_draft", "homepage", "home", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "homepage", "home", "failure");
    handleRouteError(error, response, "Invalid homepage payload.", "Could not save the homepage draft.");
  }
});

adminRouter.get("/homepage/hero", async (request, response) => {
  const user = await requirePermission(request, response, "site_content:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: {
      hero: asRecord(asRecord(asRecord((await getDraftSiteContent()).site).home).hero),
    },
  });
});

adminRouter.put("/homepage/hero", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "site_content:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateHomepageHeroDraftSchema.parse(sanitizeRequestBody(request.body));
    const currentHome = asRecord(asRecord((await getDraftSiteContent()).site).home);
    const saved = await updateDraftHomepage({
      ...currentHome,
      hero: asRecord(payload.hero),
    });
    await audit(user, requestId, request, "update_draft", "homepage", "hero", "success", { version: saved.version });
    response.json({
      success: true,
      data: {
        hero: asRecord(asRecord(asRecord(saved.site).home).hero),
      },
    });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "homepage", "hero", "failure");
    handleRouteError(error, response, "Invalid homepage hero payload.", "Could not save the homepage hero draft.");
  }
});

adminRouter.get("/tools/draft", async (request, response) => {
  const user = await requirePermission(request, response, "site_content:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: {
      tools: asRecord(asRecord((await getDraftSiteContent()).site).tools),
    },
  });
});

adminRouter.put("/tools/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "site_content:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateToolsDraftSchema.parse(sanitizeRequestBody(request.body));
    const saved = await updateDraftTools(payload.tools);
    await audit(user, requestId, request, "update_draft", "tools", "tools", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "tools", "tools", "failure");
    handleRouteError(error, response, "Invalid tools payload.", "Could not save the tool content draft.");
  }
});

adminRouter.get("/runtime-seo/draft", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: {
      seo: asRecord((await getDraftConfig()).seo),
    },
  });
});

adminRouter.put("/runtime-seo/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "runtime_config:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateSeoDraftSchema.parse(sanitizeRequestBody(request.body));
    const saved = await updateDraftSeo(payload.seo);
    await audit(user, requestId, request, "update_draft", "runtime_seo", "seo", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "runtime_seo", "seo", "failure");
    handleRouteError(error, response, "Invalid runtime SEO payload.", "Could not save the SEO draft.");
  }
});

adminRouter.get("/integrations/draft", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: {
      integrations: (await getDraftConfig()).integrations,
    },
  });
});

adminRouter.put("/integrations/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "runtime_config:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateIntegrationsDraftSchema.parse(sanitizeRequestBody(request.body));
    const saved = await updateDraftIntegrations(payload.integrations);
    await audit(user, requestId, request, "update_draft", "integrations", "integrations", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "integrations", "integrations", "failure");
    handleRouteError(error, response, "Invalid integrations payload.", "Could not save the integrations draft.");
  }
});

adminRouter.get("/ads/draft", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  const runtime = await getDraftConfig();
  response.json({
    success: true,
    data: {
      adPlacements: runtime.adPlacements,
      adsTxtLines: runtime.adsTxtLines,
      blueprintEnabled: runtime.ads.blueprint.enabled,
    },
  });
});

adminRouter.get("/ads/placements", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  const q = parseQueryString(request.query.q);
  const provider = parseQueryString(request.query.provider);
  const environment = parseQueryString(request.query.environment);
  const enabled = parseQueryBoolean(parseQueryString(request.query.enabled));
  const page = parseQueryNumber(request.query.page, 1);
  const pageSize = parseQueryNumber(request.query.pageSize, 20);

  response.json({
    success: true,
    data: await getAdsDraftPlacementsPaged({ q, provider, environment, enabled, page, pageSize }),
  });
});

adminRouter.put("/ads/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "runtime_config:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateAdsDraftSchema.parse(sanitizeRequestBody(request.body));

    if (user.role !== "SUPERADMIN") {
      const existingIds = new Set((await getDraftConfig()).adPlacements.map((placement) => placement.id));
      const nextIds = new Set(payload.adPlacements.map((placement) => placement.id));
      const removed = [...existingIds].filter((id) => !nextIds.has(id));
      if (removed.length > 0) {
        response.status(403).json({
          success: false,
          message: "Only superadmin can delete ad placements.",
        });
        return;
      }
    }

    const saved = await updateDraftAds(payload.adPlacements, payload.adsTxtLines, payload.blueprintEnabled);
    await audit(user, requestId, request, "update_draft", "ads", "ad-placements", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "ads", "ad-placements", "failure");
    handleRouteError(error, response, "Invalid ads payload.", "Could not save the ads draft.");
  }
});

adminRouter.get("/legal-pages/draft", async (request, response) => {
  const user = await requirePermission(request, response, "content_library:read");
  if (!user) {
    return;
  }

  const content = await getDraftContentLibrary();
  response.json({
    success: true,
    data: {
      legalPages: content.legalPages,
    },
  });
});

adminRouter.put("/legal-pages/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "content_library:update");
  if (!user) {
    return;
  }

  try {
    const body = asRecord(sanitizeRequestBody(request.body));
    const legalPages = asRecord(body.legalPages);
    const current = await getDraftContentLibrary();
    const saved = await saveDraftContentLibrary({
      ...current,
      legalPages: legalPages as Record<string, unknown> as typeof current.legalPages,
    });
    await audit(user, requestId, request, "update_draft", "legal_pages", "legal-pages", "success", { version: saved.version });
    response.json({ success: true, data: { legalPages: saved.legalPages } });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "legal_pages", "legal-pages", "failure");
    handleRouteError(error, response, "Invalid legal pages payload.", "Could not save the legal pages draft.");
  }
});

adminRouter.get("/faq/draft", async (request, response) => {
  const user = await requirePermission(request, response, "content_library:read");
  if (!user) {
    return;
  }

  const q = parseQueryString(request.query.q);
  const page = parseQueryNumber(request.query.page, 1);
  const pageSize = parseQueryNumber(request.query.pageSize, 20);

  response.json({
    success: true,
    data: await getFaqDraftPaged({ q, page, pageSize }),
  });
});

adminRouter.put("/faq/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "content_library:update");
  if (!user) {
    return;
  }

  try {
    const body = asRecord(sanitizeRequestBody(request.body));
    const faq = Array.isArray(body.faq) ? body.faq : [];
    const current = await getDraftContentLibrary();
    const saved = await saveDraftContentLibrary({
      ...current,
      faq: faq as typeof current.faq,
    });
    await audit(user, requestId, request, "update_draft", "faq", "faq", "success", { version: saved.version });
    response.json({ success: true, data: { faq: saved.faq } });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "faq", "faq", "failure");
    handleRouteError(error, response, "Invalid FAQ payload.", "Could not save the FAQ draft.");
  }
});

adminRouter.get("/guides/draft", async (request, response) => {
  const user = await requirePermission(request, response, "content_library:read");
  if (!user) {
    return;
  }

  const q = parseQueryString(request.query.q);
  const page = parseQueryNumber(request.query.page, 1);
  const pageSize = parseQueryNumber(request.query.pageSize, 20);

  response.json({
    success: true,
    data: await getGuidesDraftPaged({ q, page, pageSize }),
  });
});

adminRouter.put("/guides/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "content_library:update");
  if (!user) {
    return;
  }

  try {
    const body = asRecord(sanitizeRequestBody(request.body));
    const guides = Array.isArray(body.guides) ? body.guides : [];
    const current = await getDraftContentLibrary();
    const saved = await saveDraftContentLibrary({
      ...current,
      guides: guides as typeof current.guides,
    });
    await audit(user, requestId, request, "update_draft", "guides", "guides", "success", { version: saved.version });
    response.json({ success: true, data: { guides: saved.guides } });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "guides", "guides", "failure");
    handleRouteError(error, response, "Invalid guides payload.", "Could not save the guides draft.");
  }
});

adminRouter.get("/content-library/draft", async (request, response) => {
  const user = await requirePermission(request, response, "content_library:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: await getDraftContentLibrary(),
  });
});

adminRouter.put("/content-library/draft", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "content_library:update");
  if (!user) {
    return;
  }

  try {
    const payload = updateContentLibraryDraftSchema.parse(sanitizeRequestBody(request.body));
    const saved = await saveDraftContentLibrary(payload);
    await audit(user, requestId, request, "update_draft", "content_library", "content-library", "success", { version: saved.version });
    response.json({ success: true, data: saved });
  } catch (error) {
    await audit(user, requestId, request, "update_draft", "content_library", "content-library", "failure");
    handleRouteError(error, response, "Invalid content library payload.", "Could not save the content library draft.");
  }
});

async function publishHandler(request: Request, response: Response) {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "runtime_config:publish");
  if (!user) {
    return;
  }

  try {
    const release = await publishAllDraftContent(user.id, user.email);
    await audit(user, requestId, request, "publish", "cms_bundle", `release:${release.id}`, "success", { version: release.version });
    response.json({
      success: true,
      data: release,
    });
  } catch (error) {
    await audit(user, requestId, request, "publish", "cms_bundle", "release", "failure", {
      message: error instanceof Error ? error.message : "unknown",
    });
    response.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Could not publish the CMS content bundle.",
    });
  }
}

adminRouter.post("/publish", async (request, response) => {
  await publishHandler(request, response);
});

adminRouter.post("/runtime-config/publish", async (request, response) => {
  await publishHandler(request, response);
});

adminRouter.get("/releases", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  const q = parseQueryString(request.query.q);
  const dateFrom = parseQueryString(request.query.dateFrom);
  const dateTo = parseQueryString(request.query.dateTo);

  response.json({
    success: true,
    data: await getReleaseLog({ q, dateFrom, dateTo }),
  });
});

adminRouter.get("/publish/readiness", async (request, response) => {
  const user = await requirePermission(request, response, "runtime_config:read");
  if (!user) {
    return;
  }

  response.json({
    success: true,
    data: await getPublishReadiness(),
  });
});

adminRouter.post("/cache/refresh", async (request, response) => {
  const requestId = getRequestId();
  const user = await requirePermission(request, response, "runtime_config:publish");
  if (!user) {
    return;
  }

  const body = asRecord(sanitizeRequestBody(request.body));
  const clearCmsCache = typeof body.clearCmsCache === "boolean" ? body.clearCmsCache : true;
  const revalidateFrontend = typeof body.revalidateFrontend === "boolean" ? body.revalidateFrontend : true;

  try {
    const data = await refreshRuntimeCaches({ clearCmsCache, revalidateFrontend });
    await audit(user, requestId, request, "cache_refresh", "runtime_config", "cache", "success", data);
    response.json({
      success: true,
      data,
    });
  } catch (error) {
    await audit(user, requestId, request, "cache_refresh", "runtime_config", "cache", "failure", {
      message: error instanceof Error ? error.message : "unknown",
      clearCmsCache,
      revalidateFrontend,
    });
    response.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Could not refresh runtime caches.",
    });
  }
});

adminRouter.get("/audit-logs", async (request, response) => {
  const user = await requirePermission(request, response, "audit_logs:read");
  if (!user) {
    return;
  }

  const q = parseQueryString(request.query.q);
  const module = parseQueryString(request.query.module);
  const action = parseQueryString(request.query.action);
  const actorId = parseQueryString(request.query.actorId);
  const dateFrom = parseQueryString(request.query.dateFrom);
  const dateTo = parseQueryString(request.query.dateTo);
  const page = parseQueryNumber(request.query.page, 1);
  const pageSize = parseQueryNumber(request.query.pageSize, 20);

  response.json({
    success: true,
    data: await getAuditLogPaged({
      q,
      module,
      action,
      actorId,
      dateFrom,
      dateTo,
      page,
      pageSize,
    }),
  });
});
