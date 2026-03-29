import crypto from "node:crypto";
import sanitizeHtml from "sanitize-html";
import { Prisma } from "../generated/prisma/client";
import { cmsEnv } from "./env";
import { hashPassword } from "./password";
import { prisma } from "./prisma";
import {
  acquireRedisLock,
  clearPublishedCache,
  enqueueRevalidation,
  getCachedJson,
  getRedisClient,
  releaseRedisLock,
  setCachedJson,
} from "./redis";
import { checkPublicSiteRevalidateHealth, revalidatePublicSite } from "./revalidate";
import { syncFallbacksToFrontend } from "./fallbacks";
import { contentLibraryStateSchema, runtimeSiteConfigSchema, siteContentStateSchema } from "./schemas";
import type {
  AdPlacement,
  AuditLogEntry,
  ContentLibraryState,
  FaqEntry,
  GuideEntry,
  LegalPageDocument,
  PagedResult,
  ReleaseRecord,
  RuntimeIntegration,
  RuntimeSiteConfigDocument,
  SiteContentState,
  StoredUser,
} from "./types";

const SITE_SHELL_ID = "site-shell";
const HOMEPAGE_ID = "homepage";
const TOOL_CONTENT_ID = "tool-content";
const SEO_ID = "seo";
const ADS_TXT_ID = "ads-txt";
const PUBLISH_LOCK_KEY = "publish";
const CACHE_TTL_SECONDS = 300;
const DEFAULT_EMPTY_OBJECT: Record<string, unknown> = {};
const DEFAULT_EMPTY_ARRAY: string[] = [];
const REMOVED_GUIDE_SLUGS = new Set(["cms-sync-check"]);
const ALLOWED_RICH_TEXT_TAGS = [
  "p",
  "br",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "a",
] as const;

function sanitizePlainText(value: string | null | undefined): string {
  return sanitizeHtml(String(value || ""), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

function sanitizeRichText(value: string | null | undefined): string {
  const sanitized = sanitizeHtml(String(value || ""), {
    allowedTags: [...ALLOWED_RICH_TEXT_TAGS],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      "*": ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedStyles: {
      "*": {
        "text-align": [/^(left|center|right|justify)$/],
      },
    },
    transformTags: {
      a: (tagName: string, attribs: Record<string, string>) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: attribs.target === "_blank" ? "_blank" : undefined,
        },
      }),
    },
  }).trim();

  return sanitized;
}

function sanitizeCta(page: LegalPageDocument["cta"]) {
  if (!page) {
    return null;
  }

  const title = sanitizePlainText(page.title);
  const description = sanitizePlainText(page.description);
  const label = sanitizePlainText(page.label);
  const href = sanitizePlainText(page.href);

  if (!title || !description || !label || !href) {
    return null;
  }

  return {
    title,
    description,
    label,
    href,
  };
}

function sanitizeLegalPage(page: LegalPageDocument): LegalPageDocument {
  const sections = Array.isArray(page.sections)
    ? page.sections
      .map((section, index) => ({
        id: sanitizePlainText(section.id) || `section-${index + 1}`,
        heading: sanitizePlainText(section.heading) || `Section ${index + 1}`,
        body: sanitizeRichText(section.body),
      }))
      .filter((section) => section.body)
    : undefined;

  return {
    slug: sanitizePlainText(page.slug),
    eyebrow: sanitizePlainText(page.eyebrow),
    title: sanitizePlainText(page.title),
    description: sanitizePlainText(page.description),
    body: sanitizeRichText(page.body),
    sections,
    cta: sanitizeCta(page.cta),
  };
}

function sanitizeFaqEntry(entry: FaqEntry): FaqEntry {
  return {
    id: sanitizePlainText(entry.id),
    question: sanitizePlainText(entry.question),
    answer: sanitizePlainText(entry.answer),
  };
}

function isRemovedGuideSlug(slug: string): boolean {
  return REMOVED_GUIDE_SLUGS.has(sanitizePlainText(slug).toLowerCase());
}

function sanitizeGuideEntry(entry: GuideEntry): GuideEntry {
  return {
    id: sanitizePlainText(entry.id),
    slug: sanitizePlainText(entry.slug),
    title: sanitizePlainText(entry.title),
    excerpt: sanitizePlainText(entry.excerpt),
    category: sanitizePlainText(entry.category),
    body: sanitizeRichText(entry.body),
  };
}

function asObject<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  return value as T;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item));
}

function toInputJson(
  value: unknown,
  fallback: Prisma.InputJsonValue = DEFAULT_EMPTY_OBJECT as Prisma.InputJsonValue,
): Prisma.InputJsonValue {
  if (value === undefined || value === null) {
    return fallback;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getLatestTimestamp(values: Array<Date | null | undefined>): string {
  const timestamp = values
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => right.getTime() - left.getTime())[0];

  return (timestamp || new Date()).toISOString();
}

function clampPage(page: number): number {
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function clampPageSize(pageSize: number): number {
  return Number.isFinite(pageSize) ? Math.min(Math.max(Math.floor(pageSize), 1), 100) : 20;
}

function toPagedResult<T>(items: T[], total: number, page: number, pageSize: number): PagedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
  };
}

function sectionBodyToPlainText(sections: Array<{ heading: string; body: string }>): string {
  return sections
    .map((section) => {
      const body = section.body.trim();
      if (!body) {
        return "";
      }

      return `${section.heading}\n\n${body}`.trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

function createSectionsFromPage(page: LegalPageDocument): Array<{ heading: string; body: string; order: number }> {
  const sanitizedPage = sanitizeLegalPage(page);

  if (Array.isArray(sanitizedPage.sections) && sanitizedPage.sections.length > 0) {
    return sanitizedPage.sections.map((section, index) => ({
      heading: section.heading,
      body: section.body,
      order: index,
    }));
  }

  const body = sanitizedPage.body.trim();
  if (!body) {
    return [];
  }

  return [
    {
      heading: sanitizedPage.eyebrow?.trim() || "Overview",
      body,
      order: 0,
    },
  ];
}

function mapIntegration(record: {
  id: string;
  kind: string;
  enabled: boolean;
  scope: string;
  environment: string;
  notes: string;
  lastPublishedAt: Date | null;
  config: unknown;
}): RuntimeIntegration {
  return {
    id: record.id,
    kind: record.kind as RuntimeIntegration["kind"],
    enabled: record.enabled,
    scope: record.scope as RuntimeIntegration["scope"],
    environment: record.environment as RuntimeIntegration["environment"],
    notes: record.notes,
    lastPublishedAt: record.lastPublishedAt?.toISOString() || null,
    config: asObject<Record<string, string | boolean>>(record.config, {}),
  };
}

function mapAdPlacement(record: {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  slotId: string;
  scopes: string[];
  categories: string[];
  environment: string;
  notes: string;
  lastPublishedAt: Date | null;
  config: unknown;
}): AdPlacement {
  return {
    id: record.id,
    name: record.name,
    provider: record.provider as AdPlacement["provider"],
    enabled: record.enabled,
    slotId: record.slotId,
    scopes: record.scopes as AdPlacement["scopes"],
    categories: record.categories,
    environment: record.environment as AdPlacement["environment"],
    notes: record.notes,
    lastPublishedAt: record.lastPublishedAt?.toISOString() || null,
    config: asObject<Record<string, string | boolean>>(record.config, {}),
  };
}

function buildStoredUser(user: {
  id: string;
  email: string;
  name: string;
  role: "SUPERADMIN" | "ADMIN";
  passwordHash: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  twoFactorPendingSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{ module: string; action: string }>;
}): StoredUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.role === "SUPERADMIN" ? ["*"] : user.permissions.map((entry) => `${entry.module}:${entry.action}`),
    passwordHash: user.passwordHash,
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorSecret: user.twoFactorSecret,
    twoFactorPendingSecret: user.twoFactorPendingSecret,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

async function getLatestReleaseRecord() {
  return prisma.cmsRelease.findFirst({
    orderBy: {
      version: "desc",
    },
  });
}

function buildSiteState(params: {
  version: number;
  publishedAt: string | null;
  updatedAt: string;
  siteShell: unknown;
  homepage: unknown;
  toolContent: unknown;
}): SiteContentState {
  const siteShell = asObject<Record<string, unknown>>(params.siteShell, {});
  const homepage = asObject<Record<string, unknown>>(params.homepage, {});
  const toolContent = asObject<Record<string, unknown>>(params.toolContent, {});

  return siteContentStateSchema.parse({
    version: params.version,
    updatedAt: params.updatedAt,
    publishedAt: params.publishedAt,
    site: {
      ...siteShell,
      home: homepage,
      tools: toolContent,
    },
  });
}

function buildRuntimeState(params: {
  version: number;
  publishedAt: string | null;
  updatedAt: string;
  seo: unknown;
  ads: unknown;
  integrations: RuntimeIntegration[];
  adPlacements: AdPlacement[];
  adsTxtLines: string[];
}): RuntimeSiteConfigDocument {
  const adsCandidate = asObject<Record<string, unknown>>(params.ads, {});
  const blueprintCandidate = asObject<Record<string, unknown>>(adsCandidate.blueprint, {});
  const defaultBlueprintEnabled = cmsEnv.appMode === "dev";

  return runtimeSiteConfigSchema.parse({
    version: params.version,
    updatedAt: params.updatedAt,
    publishedAt: params.publishedAt,
    seo: asObject(params.seo, {}),
    ads: {
      blueprint: {
        enabled: typeof blueprintCandidate.enabled === "boolean"
          ? blueprintCandidate.enabled
          : defaultBlueprintEnabled,
      },
    },
    integrations: params.integrations,
    adPlacements: params.adPlacements,
    adsTxtLines: params.adsTxtLines,
  });
}

function readStoredRuntimeConfigData(value: unknown): {
  seo: unknown;
  ads: unknown;
} {
  const candidate = asObject<Record<string, unknown>>(value, {});
  if ("seo" in candidate) {
    return {
      seo: asObject(candidate.seo, {}),
      ads: asObject(candidate.ads, {}),
    };
  }

  // Backward compatibility: older records stored plain SEO JSON in this column.
  return {
    seo: candidate,
    ads: {},
  };
}

function buildContentLibraryState(params: {
  version: number;
  publishedAt: string | null;
  updatedAt: string;
  legalPages: Record<string, LegalPageDocument>;
  faq: FaqEntry[];
  guides: GuideEntry[];
}): ContentLibraryState {
  return contentLibraryStateSchema.parse({
    version: params.version,
    updatedAt: params.updatedAt,
    publishedAt: params.publishedAt,
    legalPages: params.legalPages,
    faq: params.faq,
    guides: params.guides,
  });
}

const DEFAULT_ADMIN_PERMISSIONS = [
  { module: "runtime_config", action: "read" },
  { module: "runtime_config", action: "update" },
  { module: "runtime_config", action: "publish" },
  { module: "content_library", action: "read" },
  { module: "content_library", action: "update" },
  { module: "content_library", action: "publish" },
  { module: "audit_logs", action: "read" },
  { module: "admins", action: "read" },
  { module: "permissions", action: "read" },
] as const;

export interface PublishReadinessState {
  hasChanges: boolean;
  canPublish: boolean;
  checks: Array<{
    id: "database" | "redis" | "frontend_revalidate";
    label: string;
    ok: boolean;
    message: string;
  }>;
}

async function seedAdminUsers(): Promise<void> {
  await prisma.adminUser.upsert({
    where: {
      email: cmsEnv.superadminEmail,
    },
    update: {
      name: cmsEnv.superadminName,
      role: "SUPERADMIN",
      passwordHash: hashPassword(cmsEnv.superadminPassword),
    },
    create: {
      email: cmsEnv.superadminEmail,
      name: cmsEnv.superadminName,
      role: "SUPERADMIN",
      passwordHash: hashPassword(cmsEnv.superadminPassword),
    },
  });

  if (!cmsEnv.adminEmail || !cmsEnv.adminPassword) {
    return;
  }

  if (cmsEnv.adminEmail === cmsEnv.superadminEmail) {
    return;
  }

  const existingAdmin = await prisma.adminUser.findUnique({
    where: {
      email: cmsEnv.adminEmail,
    },
    include: {
      permissions: true,
    },
  });

  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email: cmsEnv.adminEmail,
        name: cmsEnv.adminName,
        role: "ADMIN",
        passwordHash: hashPassword(cmsEnv.adminPassword),
        permissions: {
          create: DEFAULT_ADMIN_PERMISSIONS.map((permission) => ({
            module: permission.module,
            action: permission.action,
          })),
        },
      },
    });
    return;
  }

  await prisma.adminUser.update({
    where: { id: existingAdmin.id },
    data: {
      name: cmsEnv.adminName,
      role: "ADMIN",
      passwordHash: hashPassword(cmsEnv.adminPassword),
    },
  });
}

export async function ensureCmsStorage(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
  await getRedisClient();
  await seedAdminUsers();
}

export async function getUsers(): Promise<StoredUser[]> {
  const users = await prisma.adminUser.findMany({
    include: {
      permissions: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return users.map((user) => buildStoredUser(user));
}

export async function getUsersPaged(params: { q?: string; page?: number; pageSize?: number }): Promise<PagedResult<StoredUser>> {
  const page = clampPage(params.page || 1);
  const pageSize = clampPageSize(params.pageSize || 20);
  const q = (params.q || "").trim();
  const qRole = q.toUpperCase() === "SUPERADMIN" || q.toUpperCase() === "ADMIN"
    ? (q.toUpperCase() as "SUPERADMIN" | "ADMIN")
    : null;
  const where: Prisma.AdminUserWhereInput | undefined = q
    ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        ...(qRole ? [{ role: qRole }] : []),
      ],
    }
    : undefined;

  const [total, rows] = await Promise.all([
    prisma.adminUser.count({ where }),
    prisma.adminUser.findMany({
      where,
      include: { permissions: true },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return toPagedResult(rows.map((user) => buildStoredUser(user)), total, page, pageSize);
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const user = await prisma.adminUser.findUnique({
    where: {
      email,
    },
    include: {
      permissions: true,
    },
  });

  return user ? buildStoredUser(user) : null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const user = await prisma.adminUser.findUnique({
    where: {
      id,
    },
    include: {
      permissions: true,
    },
  });

  return user ? buildStoredUser(user) : null;
}

export async function updateUserPermissions(userId: string, permissions: string[]): Promise<StoredUser> {
  const target = await prisma.adminUser.findUnique({
    where: { id: userId },
    include: { permissions: true },
  });

  if (!target) {
    throw new Error("User not found.");
  }

  if (target.role === "SUPERADMIN") {
    throw new Error("Superadmin permissions cannot be edited.");
  }

  const normalized = Array.from(new Set(
    permissions
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.includes(":")),
  ));

  await prisma.$transaction(async (transaction) => {
    await transaction.permissionAssignment.deleteMany({
      where: { userId: target.id },
    });

    if (normalized.length > 0) {
      await transaction.permissionAssignment.createMany({
        data: normalized.map((entry) => {
          const [module, action] = entry.split(":");
          return {
            userId: target.id,
            module: module.trim(),
            action: (action || "").trim(),
          };
        }).filter((entry) => entry.module && entry.action),
      });
    }
  });

  const updated = await getUserById(target.id);
  if (!updated) {
    throw new Error("Failed to reload updated user.");
  }

  return updated;
}

export async function updateUserTwoFactorState(
  userId: string,
  values: Partial<Pick<StoredUser, "twoFactorEnabled" | "twoFactorSecret" | "twoFactorPendingSecret">>,
): Promise<void> {
  await prisma.adminUser.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: values.twoFactorEnabled,
      twoFactorSecret: values.twoFactorSecret,
      twoFactorPendingSecret: values.twoFactorPendingSecret,
    },
  });
}

export async function appendAuditLog(entry: AuditLogEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      id: entry.id,
      createdAt: new Date(entry.createdAt),
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      actorRole: entry.actorRole || undefined,
      action: entry.action,
      module: entry.module,
      target: entry.target,
      result: entry.result,
      requestId: entry.requestId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      details: toInputJson(asObject(entry.details, {})),
    },
  });
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    actorRole: row.actorRole,
    action: row.action,
    module: row.module,
    target: row.target,
    result: row.result as AuditLogEntry["result"],
    requestId: row.requestId,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    details: asObject<Record<string, unknown>>(row.details, {}),
  }));
}

export async function getAuditLogPaged(params: {
  q?: string;
  module?: string;
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AuditLogEntry>> {
  const page = clampPage(params.page || 1);
  const pageSize = clampPageSize(params.pageSize || 20);
  const q = (params.q || "").trim();
  const module = (params.module || "").trim();
  const action = (params.action || "").trim();
  const actorId = (params.actorId || "").trim();
  const dateFrom = (params.dateFrom || "").trim();
  const dateTo = (params.dateTo || "").trim();

  const where: any = { AND: [] };

  if (q) {
    where.AND.push({
      OR: [
        { actorEmail: { contains: q, mode: "insensitive" as const } },
        { action: { contains: q, mode: "insensitive" as const } },
        { module: { contains: q, mode: "insensitive" as const } },
        { target: { contains: q, mode: "insensitive" as const } },
        { result: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  if (module) {
    where.AND.push({ module: { equals: module } });
  }

  if (action) {
    where.AND.push({ action: { equals: action } });
  }

  if (actorId) {
    where.AND.push({ actorId: { equals: actorId } });
  }

  if (dateFrom || dateTo) {
    const createdAt: any = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) {
        createdAt.gte = from;
      }
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) {
        createdAt.lte = to;
      }
    }
    if (Object.keys(createdAt).length > 0) {
      where.AND.push({ createdAt });
    }
  }

  if (where.AND.length === 0) {
    delete where.AND;
  }

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return toPagedResult(rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    actorRole: row.actorRole,
    action: row.action,
    module: row.module,
    target: row.target,
    result: row.result as AuditLogEntry["result"],
    requestId: row.requestId,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    details: asObject<Record<string, unknown>>(row.details, {}),
  })), total, page, pageSize);
}

export async function getAdsDraftPlacementsPaged(params: {
  q?: string;
  provider?: string;
  environment?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AdPlacement>> {
  const page = clampPage(params.page || 1);
  const pageSize = clampPageSize(params.pageSize || 20);
  const q = (params.q || "").trim();

  const andFilters: Array<Record<string, unknown>> = [];
  if (q) {
    andFilters.push({
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { slotId: { contains: q, mode: "insensitive" as const } },
        { provider: { contains: q, mode: "insensitive" as const } },
        { notes: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }
  if (params.provider) {
    andFilters.push({ provider: params.provider });
  }
  if (params.environment) {
    andFilters.push({ environment: params.environment });
  }
  if (typeof params.enabled === "boolean") {
    andFilters.push({ enabled: params.enabled });
  }

  const where = andFilters.length > 0 ? { AND: andFilters } : undefined;

  const [total, rows] = await Promise.all([
    prisma.adPlacementDraft.count({ where }),
    prisma.adPlacementDraft.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return toPagedResult(rows.map((row) => mapAdPlacement(row)), total, page, pageSize);
}

export async function getFaqDraftPaged(params: { q?: string; page?: number; pageSize?: number }): Promise<PagedResult<FaqEntry>> {
  const page = clampPage(params.page || 1);
  const pageSize = clampPageSize(params.pageSize || 20);
  const q = (params.q || "").trim();
  const where = q
    ? {
      OR: [
        { question: { contains: q, mode: "insensitive" as const } },
        { answer: { contains: q, mode: "insensitive" as const } },
      ],
    }
    : undefined;

  const [total, rows] = await Promise.all([
    prisma.faqEntryDraft.count({ where }),
    prisma.faqEntryDraft.findMany({
      where,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return toPagedResult(rows.map((entry) => ({
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
  })), total, page, pageSize);
}

export async function getGuidesDraftPaged(params: { q?: string; page?: number; pageSize?: number }): Promise<PagedResult<GuideEntry>> {
  const page = clampPage(params.page || 1);
  const pageSize = clampPageSize(params.pageSize || 20);
  const q = (params.q || "").trim();
  const baseWhere = {
    NOT: {
      slug: {
        in: Array.from(REMOVED_GUIDE_SLUGS),
      },
    },
  };

  const where = q
    ? {
      AND: [
        baseWhere,
        {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
          ],
        },
      ],
    }
    : baseWhere;

  const [total, rows] = await Promise.all([
    prisma.guideDraft.count({ where }),
    prisma.guideDraft.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return toPagedResult(rows.map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    excerpt: entry.excerpt,
    category: entry.category,
    body: entry.body,
  })), total, page, pageSize);
}

export async function getReleaseLog(params: { q?: string; dateFrom?: string; dateTo?: string } = {}): Promise<ReleaseRecord[]> {
  const q = (params.q || "").trim();
  const normalizedVersionQuery = q.replace(/^v/i, "").trim();
  const parsedVersion = Number.parseInt(normalizedVersionQuery, 10);
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : null;
  const dateTo = params.dateTo ? new Date(params.dateTo) : null;
  const hasDateFrom = dateFrom instanceof Date && !Number.isNaN(dateFrom.getTime());
  const hasDateTo = dateTo instanceof Date && !Number.isNaN(dateTo.getTime());

  const andFilters: Array<Record<string, unknown>> = [];
  if (q) {
    andFilters.push({
      OR: [
        Number.isFinite(parsedVersion) ? { version: parsedVersion } : undefined,
        { actorEmail: { contains: q, mode: "insensitive" as const } },
      ].filter(Boolean),
    });
  }
  if (hasDateFrom || hasDateTo) {
    andFilters.push({
      publishedAt: {
        ...(hasDateFrom ? { gte: dateFrom as Date } : {}),
        ...(hasDateTo ? { lte: dateTo as Date } : {}),
      },
    });
  }
  const where = andFilters.length > 0 ? { AND: andFilters } : undefined;

  const releases = await prisma.cmsRelease.findMany({
    where,
    orderBy: {
      version: "desc",
    },
    take: 50,
  });

  return releases.map((release) => ({
    id: release.id,
    version: release.version,
    publishedAt: release.publishedAt.toISOString(),
    actorId: release.actorId,
    actorEmail: release.actorEmail,
  }));
}

export async function getDraftConfig(): Promise<RuntimeSiteConfigDocument> {
  const [seoDraft, integrations, adPlacements, adsTxtDraft, latestRelease] = await Promise.all([
    prisma.seoConfigDraft.findUnique({ where: { id: SEO_ID } }),
    prisma.integrationDraft.findMany({ orderBy: { id: "asc" } }),
    prisma.adPlacementDraft.findMany({ orderBy: { id: "asc" } }),
    prisma.adsTxtDraft.findUnique({ where: { id: ADS_TXT_ID } }),
    getLatestReleaseRecord(),
  ]);
  const stored = readStoredRuntimeConfigData(seoDraft?.data);

  return buildRuntimeState({
    version: seoDraft?.version || latestRelease?.version || 1,
    updatedAt: getLatestTimestamp([seoDraft?.updatedAt, adsTxtDraft?.updatedAt, ...integrations.map((entry) => entry.updatedAt), ...adPlacements.map((entry) => entry.updatedAt)]),
    publishedAt: latestRelease?.publishedAt.toISOString() || null,
    seo: stored.seo,
    ads: stored.ads,
    integrations: integrations.map(mapIntegration),
    adPlacements: adPlacements.map(mapAdPlacement),
    adsTxtLines: asStringArray(adsTxtDraft?.lines),
  });
}

export async function getPublishedConfig(): Promise<RuntimeSiteConfigDocument> {
  const cached = await getCachedJson<RuntimeSiteConfigDocument>("runtime-config");
  if (cached) {
    return runtimeSiteConfigSchema.parse(cached);
  }

  const [seoPublished, integrations, adPlacements, adsTxtPublished, latestRelease] = await Promise.all([
    prisma.seoConfigPublished.findUnique({ where: { id: SEO_ID } }),
    prisma.integrationPublished.findMany({ orderBy: { id: "asc" } }),
    prisma.adPlacementPublished.findMany({ orderBy: { id: "asc" } }),
    prisma.adsTxtPublished.findUnique({ where: { id: ADS_TXT_ID } }),
    getLatestReleaseRecord(),
  ]);
  const stored = readStoredRuntimeConfigData(seoPublished?.data);

  const state = buildRuntimeState({
    version: seoPublished?.version || latestRelease?.version || 1,
    updatedAt: getLatestTimestamp([seoPublished?.updatedAt, adsTxtPublished?.updatedAt, ...integrations.map((entry) => entry.updatedAt), ...adPlacements.map((entry) => entry.updatedAt)]),
    publishedAt: latestRelease?.publishedAt.toISOString() || null,
    seo: stored.seo,
    ads: stored.ads,
    integrations: integrations.map(mapIntegration),
    adPlacements: adPlacements.map(mapAdPlacement),
    adsTxtLines: asStringArray(adsTxtPublished?.lines),
  });

  await setCachedJson("runtime-config", state, CACHE_TTL_SECONDS);
  return state;
}

async function getSiteDraftRows() {
  return Promise.all([
    prisma.siteShellDraft.findUnique({ where: { id: SITE_SHELL_ID } }),
    prisma.homepageDraft.findUnique({ where: { id: HOMEPAGE_ID } }),
    prisma.toolContentDraft.findUnique({ where: { id: TOOL_CONTENT_ID } }),
    getLatestReleaseRecord(),
  ]);
}

export async function getDraftSiteContent(): Promise<SiteContentState> {
  const [siteShell, homepage, toolContent, latestRelease] = await getSiteDraftRows();

  return buildSiteState({
    version: Math.max(siteShell?.version || 1, homepage?.version || 1, toolContent?.version || 1),
    updatedAt: getLatestTimestamp([siteShell?.updatedAt, homepage?.updatedAt, toolContent?.updatedAt]),
    publishedAt: latestRelease?.publishedAt.toISOString() || null,
    siteShell: siteShell?.data,
    homepage: homepage?.data,
    toolContent: toolContent?.data,
  });
}

export async function getPublishedSiteContent(): Promise<SiteContentState> {
  const cached = await getCachedJson<SiteContentState>("site-content");
  if (cached) {
    return siteContentStateSchema.parse(cached);
  }

  const [siteShell, homepage, toolContent, latestRelease] = await Promise.all([
    prisma.siteShellPublished.findUnique({ where: { id: SITE_SHELL_ID } }),
    prisma.homepagePublished.findUnique({ where: { id: HOMEPAGE_ID } }),
    prisma.toolContentPublished.findUnique({ where: { id: TOOL_CONTENT_ID } }),
    getLatestReleaseRecord(),
  ]);

  const state = buildSiteState({
    version: Math.max(siteShell?.version || 1, homepage?.version || 1, toolContent?.version || 1),
    updatedAt: getLatestTimestamp([siteShell?.updatedAt, homepage?.updatedAt, toolContent?.updatedAt]),
    publishedAt: latestRelease?.publishedAt.toISOString() || null,
    siteShell: siteShell?.data,
    homepage: homepage?.data,
    toolContent: toolContent?.data,
  });

  await setCachedJson("site-content", state, CACHE_TTL_SECONDS);
  return state;
}

export async function saveDraftSiteContent(siteContent: SiteContentState["site"]): Promise<SiteContentState> {
  const currentVersion = (await getLatestReleaseRecord())?.version || 1;
  const site = asObject<Record<string, unknown>>(siteContent, {});

  await prisma.$transaction([
    prisma.siteShellDraft.upsert({
      where: { id: SITE_SHELL_ID },
      update: {
        data: toInputJson({
          branding: asObject(site.branding, {}),
          contact: asObject(site.contact, {}),
          organization: asObject(site.organization, {}),
          system: asObject(site.system, {}),
          ui: asObject(site.ui, {}),
          navigation: asObject(site.navigation, {}),
          footer: asObject(site.footer, {}),
        }),
      },
      create: {
        id: SITE_SHELL_ID,
        version: currentVersion,
        data: toInputJson({
          branding: asObject(site.branding, {}),
          contact: asObject(site.contact, {}),
          organization: asObject(site.organization, {}),
          system: asObject(site.system, {}),
          ui: asObject(site.ui, {}),
          navigation: asObject(site.navigation, {}),
          footer: asObject(site.footer, {}),
        }),
      },
    }),
    prisma.homepageDraft.upsert({
      where: { id: HOMEPAGE_ID },
      update: { data: toInputJson(asObject(site.home, {})) },
      create: { id: HOMEPAGE_ID, version: currentVersion, data: toInputJson(asObject(site.home, {})) },
    }),
    prisma.toolContentDraft.upsert({
      where: { id: TOOL_CONTENT_ID },
      update: { data: toInputJson(asObject(site.tools, {})) },
      create: { id: TOOL_CONTENT_ID, version: currentVersion, data: toInputJson(asObject(site.tools, {})) },
    }),
  ]);

  return getDraftSiteContent();
}

export async function updateDraftSiteShell(siteShell: Partial<SiteContentState["site"]>): Promise<SiteContentState> {
  const current = await getDraftSiteContent();
  const nextSite = {
    ...current.site,
    ...siteShell,
  };

  return saveDraftSiteContent(nextSite);
}

export async function updateDraftHomepage(home: SiteContentState["site"]["home"]): Promise<SiteContentState> {
  const current = await getDraftSiteContent();
  return saveDraftSiteContent({
    ...current.site,
    home,
  });
}

export async function updateDraftTools(tools: SiteContentState["site"]["tools"]): Promise<SiteContentState> {
  const current = await getDraftSiteContent();
  return saveDraftSiteContent({
    ...current.site,
    tools,
  });
}

async function mapLegalPages(mode: "draft" | "published"): Promise<Record<string, LegalPageDocument>> {
  const pages = mode === "draft"
    ? await prisma.legalPageDraft.findMany({
      include: {
        sections: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        slug: "asc",
      },
    })
    : await prisma.legalPagePublished.findMany({
      include: {
        sections: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        slug: "asc",
      },
    });

  return Object.fromEntries(
    pages.map((page) => [
      page.slug,
      {
        slug: page.slug,
        eyebrow: page.eyebrow || undefined,
        title: page.title,
        description: page.description,
        body: sectionBodyToPlainText(page.sections),
        updatedAt: page.updatedAt.toISOString(),
        sections: page.sections.map((section) => ({
          id: section.id,
          heading: section.heading,
          body: section.body,
        })),
        cta: page.ctaTitle && page.ctaDescription && page.ctaLabel && page.ctaHref
          ? {
            title: page.ctaTitle,
            description: page.ctaDescription,
            label: page.ctaLabel,
            href: page.ctaHref,
          }
          : null,
      },
    ]),
  );
}

async function getContentLibraryRows(mode: "draft" | "published") {
  if (mode === "draft") {
    return Promise.all([
      mapLegalPages("draft"),
      prisma.faqEntryDraft.findMany({ orderBy: { order: "asc" } }),
      prisma.guideDraft.findMany({ orderBy: { title: "asc" } }),
      getLatestReleaseRecord(),
    ]);
  }

  return Promise.all([
    mapLegalPages("published"),
    prisma.faqEntryPublished.findMany({ orderBy: { order: "asc" } }),
    prisma.guidePublished.findMany({ orderBy: { title: "asc" } }),
    getLatestReleaseRecord(),
  ]);
}

export async function getDraftContentLibrary(): Promise<ContentLibraryState> {
  const [legalPages, faqRows, guideRows, latestRelease] = await getContentLibraryRows("draft");

  return buildContentLibraryState({
    version: latestRelease?.version || 1,
    updatedAt: getLatestTimestamp([
      ...Object.values(legalPages).map((page) => page.updatedAt ? new Date(page.updatedAt) : null),
      ...faqRows.map((entry) => entry.updatedAt),
      ...guideRows.map((entry) => entry.updatedAt),
    ]),
    publishedAt: latestRelease?.publishedAt.toISOString() || null,
    legalPages,
    faq: faqRows.map((entry) => ({
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
    })),
    guides: guideRows
      .filter((entry) => !isRemovedGuideSlug(entry.slug))
      .map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        excerpt: entry.excerpt,
        category: entry.category,
        body: entry.body,
      })),
  });
}

export async function getPublishedContentLibrary(): Promise<ContentLibraryState> {
  const cached = await getCachedJson<ContentLibraryState>("content-library");
  if (cached) {
    return contentLibraryStateSchema.parse(cached);
  }

  const [legalPages, faqRows, guideRows, latestRelease] = await getContentLibraryRows("published");

  const state = buildContentLibraryState({
    version: latestRelease?.version || 1,
    updatedAt: getLatestTimestamp([
      ...Object.values(legalPages).map((page) => page.updatedAt ? new Date(page.updatedAt) : null),
      ...faqRows.map((entry) => entry.updatedAt),
      ...guideRows.map((entry) => entry.updatedAt),
    ]),
    publishedAt: latestRelease?.publishedAt.toISOString() || null,
    legalPages,
    faq: faqRows.map((entry) => ({
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
    })),
    guides: guideRows
      .filter((entry) => !isRemovedGuideSlug(entry.slug))
      .map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        excerpt: entry.excerpt,
        category: entry.category,
        body: entry.body,
      })),
  });

  await setCachedJson("content-library", state, CACHE_TTL_SECONDS);
  return state;
}

export async function saveDraftContentLibrary(
  contentLibrary: Omit<ContentLibraryState, "version" | "updatedAt" | "publishedAt">,
): Promise<ContentLibraryState> {
  await prisma.$transaction(async (transaction) => {
    await transaction.legalPageSectionDraft.deleteMany({});
    await transaction.legalPageDraft.deleteMany({});

    for (const entry of Object.values(contentLibrary.legalPages)) {
      const page = sanitizeLegalPage(entry);
      await transaction.legalPageDraft.create({
        data: {
          id: page.slug,
          slug: page.slug,
          eyebrow: page.eyebrow || null,
          title: page.title,
          description: page.description,
          ctaTitle: page.cta?.title || null,
          ctaDescription: page.cta?.description || null,
          ctaLabel: page.cta?.label || null,
          ctaHref: page.cta?.href || null,
          sections: {
            create: createSectionsFromPage(page).map((section) => ({
              heading: section.heading,
              body: section.body,
              order: section.order,
            })),
          },
        },
      });
    }

    await transaction.faqEntryDraft.deleteMany({});
    const faqEntries = contentLibrary.faq.map(sanitizeFaqEntry).filter((entry) => entry.id && entry.question && entry.answer);
    if (faqEntries.length > 0) {
      await transaction.faqEntryDraft.createMany({
        data: faqEntries.map((entry, index) => ({
          id: entry.id,
          question: entry.question,
          answer: entry.answer,
          order: index,
        })),
      });
    }

    await transaction.guideDraft.deleteMany({});
    const guides = contentLibrary.guides
      .map(sanitizeGuideEntry)
      .filter((entry) => !isRemovedGuideSlug(entry.slug) && entry.id && entry.slug && entry.title && entry.excerpt && entry.category && entry.body);
    if (guides.length > 0) {
      await transaction.guideDraft.createMany({
        data: guides.map((entry) => ({
          id: entry.id,
          slug: entry.slug,
          title: entry.title,
          excerpt: entry.excerpt,
          category: entry.category,
          body: entry.body,
        })),
      });
    }
  });

  return getDraftContentLibrary();
}

export async function saveDraftConfig(config: RuntimeSiteConfigDocument): Promise<RuntimeSiteConfigDocument> {
  await prisma.$transaction(async (transaction) => {
    const currentVersion = (await transaction.seoConfigDraft.findUnique({ where: { id: SEO_ID } }))?.version || 1;

    await transaction.seoConfigDraft.upsert({
      where: { id: SEO_ID },
      update: {
        data: toInputJson({
          seo: asObject(config.seo, {}),
          ads: asObject(config.ads, {}),
        }),
      },
      create: {
        id: SEO_ID,
        version: currentVersion,
        data: toInputJson({
          seo: asObject(config.seo, {}),
          ads: asObject(config.ads, {}),
        }),
      },
    });

    await transaction.integrationDraft.deleteMany({});
    if (config.integrations.length > 0) {
      await transaction.integrationDraft.createMany({
        data: config.integrations.map((entry) => ({
          id: entry.id,
          kind: entry.kind,
          enabled: entry.enabled,
          scope: entry.scope,
          environment: entry.environment,
          notes: entry.notes,
          lastPublishedAt: entry.lastPublishedAt ? new Date(entry.lastPublishedAt) : null,
          config: toInputJson(asObject(entry.config, {})),
        })),
      });
    }

    await transaction.adPlacementDraft.deleteMany({});
    if (config.adPlacements.length > 0) {
      await transaction.adPlacementDraft.createMany({
        data: config.adPlacements.map((entry) => ({
          id: entry.id,
          name: entry.name,
          provider: entry.provider,
          enabled: entry.enabled,
          slotId: entry.slotId,
          scopes: entry.scopes,
          categories: entry.categories,
          environment: entry.environment,
          notes: entry.notes,
          lastPublishedAt: entry.lastPublishedAt ? new Date(entry.lastPublishedAt) : null,
          config: toInputJson(asObject(entry.config, {})),
        })),
      });
    }

    await transaction.adsTxtDraft.upsert({
      where: { id: ADS_TXT_ID },
      update: { lines: toInputJson(config.adsTxtLines, DEFAULT_EMPTY_ARRAY) },
      create: { id: ADS_TXT_ID, version: currentVersion, lines: toInputJson(config.adsTxtLines, DEFAULT_EMPTY_ARRAY) },
    });
  });

  return getDraftConfig();
}

export async function updateDraftSeo(seo: RuntimeSiteConfigDocument["seo"]): Promise<RuntimeSiteConfigDocument> {
  const current = await getDraftConfig();
  return saveDraftConfig({
    ...current,
    seo,
  });
}

export async function updateDraftIntegrations(integrations: RuntimeSiteConfigDocument["integrations"]): Promise<RuntimeSiteConfigDocument> {
  const current = await getDraftConfig();
  return saveDraftConfig({
    ...current,
    integrations,
  });
}

export async function updateDraftAds(
  adPlacements: RuntimeSiteConfigDocument["adPlacements"],
  adsTxtLines: RuntimeSiteConfigDocument["adsTxtLines"],
  blueprintEnabled?: boolean,
): Promise<RuntimeSiteConfigDocument> {
  const current = await getDraftConfig();
  return saveDraftConfig({
    ...current,
    ads: {
      ...current.ads,
      blueprint: {
        ...current.ads.blueprint,
        enabled: typeof blueprintEnabled === "boolean" ? blueprintEnabled : current.ads.blueprint.enabled,
      },
    },
    adPlacements,
    adsTxtLines,
  });
}

export async function publishAllDraftContent(actorId: string, actorEmail: string): Promise<ReleaseRecord> {
  const lockToken = await acquireRedisLock(PUBLISH_LOCK_KEY, 30);
  if (!lockToken) {
    throw new Error("A publish is already in progress.");
  }

  try {
    const latestRelease = await getLatestReleaseRecord();
    const nextVersion = (latestRelease?.version || 0) + 1;
    const publishedAt = new Date();

    const release = await prisma.$transaction(async (transaction) => {
      const createdRelease = await transaction.cmsRelease.create({
        data: {
          version: nextVersion,
          publishedAt,
          actorId,
          actorEmail,
        },
      });

      const [siteShellDraft, homepageDraft, toolContentDraft, seoDraft, integrations, adPlacements, adsTxtDraft, legalPages, faqEntries, guides] = await Promise.all([
        transaction.siteShellDraft.findUnique({ where: { id: SITE_SHELL_ID } }),
        transaction.homepageDraft.findUnique({ where: { id: HOMEPAGE_ID } }),
        transaction.toolContentDraft.findUnique({ where: { id: TOOL_CONTENT_ID } }),
        transaction.seoConfigDraft.findUnique({ where: { id: SEO_ID } }),
        transaction.integrationDraft.findMany({ orderBy: { id: "asc" } }),
        transaction.adPlacementDraft.findMany({ orderBy: { id: "asc" } }),
        transaction.adsTxtDraft.findUnique({ where: { id: ADS_TXT_ID } }),
        transaction.legalPageDraft.findMany({
          include: {
            sections: {
              orderBy: {
                order: "asc",
              },
            },
          },
        }),
        transaction.faqEntryDraft.findMany({ orderBy: { order: "asc" } }),
        transaction.guideDraft.findMany({ orderBy: { title: "asc" } }),
      ]);

      if (siteShellDraft) {
        await transaction.siteShellPublished.upsert({
          where: { id: SITE_SHELL_ID },
          update: {
            version: nextVersion,
            data: toInputJson(asObject(siteShellDraft.data, {})),
            publishedAt,
            releaseId: createdRelease.id,
          },
          create: {
            id: SITE_SHELL_ID,
            version: nextVersion,
            data: toInputJson(asObject(siteShellDraft.data, {})),
            publishedAt,
            releaseId: createdRelease.id,
          },
        });
      } else {
        await transaction.siteShellPublished.deleteMany({ where: { id: SITE_SHELL_ID } });
      }

      if (homepageDraft) {
        await transaction.homepagePublished.upsert({
          where: { id: HOMEPAGE_ID },
          update: {
            version: nextVersion,
            data: toInputJson(asObject(homepageDraft.data, {})),
            publishedAt,
            releaseId: createdRelease.id,
          },
          create: {
            id: HOMEPAGE_ID,
            version: nextVersion,
            data: toInputJson(asObject(homepageDraft.data, {})),
            publishedAt,
            releaseId: createdRelease.id,
          },
        });
      } else {
        await transaction.homepagePublished.deleteMany({ where: { id: HOMEPAGE_ID } });
      }

      if (toolContentDraft) {
        await transaction.toolContentPublished.upsert({
          where: { id: TOOL_CONTENT_ID },
          update: {
            version: nextVersion,
            data: toInputJson(asObject(toolContentDraft.data, {})),
            publishedAt,
            releaseId: createdRelease.id,
          },
          create: {
            id: TOOL_CONTENT_ID,
            version: nextVersion,
            data: toInputJson(asObject(toolContentDraft.data, {})),
            publishedAt,
            releaseId: createdRelease.id,
          },
        });
      } else {
        await transaction.toolContentPublished.deleteMany({ where: { id: TOOL_CONTENT_ID } });
      }

      if (seoDraft) {
        await transaction.seoConfigPublished.upsert({
          where: { id: SEO_ID },
          update: {
            version: nextVersion,
            data: toInputJson(asObject(seoDraft.data, {})),
            publishedAt,
            releaseId: createdRelease.id,
          },
          create: {
            id: SEO_ID,
            version: nextVersion,
            data: toInputJson(asObject(seoDraft.data, {})),
            publishedAt,
            releaseId: createdRelease.id,
          },
        });
      } else {
        await transaction.seoConfigPublished.deleteMany({ where: { id: SEO_ID } });
      }

      if (adsTxtDraft) {
        await transaction.adsTxtPublished.upsert({
          where: { id: ADS_TXT_ID },
          update: {
            version: nextVersion,
            lines: toInputJson(asStringArray(adsTxtDraft.lines), DEFAULT_EMPTY_ARRAY),
            publishedAt,
            releaseId: createdRelease.id,
          },
          create: {
            id: ADS_TXT_ID,
            version: nextVersion,
            lines: toInputJson(asStringArray(adsTxtDraft.lines), DEFAULT_EMPTY_ARRAY),
            publishedAt,
            releaseId: createdRelease.id,
          },
        });
      } else {
        await transaction.adsTxtPublished.deleteMany({ where: { id: ADS_TXT_ID } });
      }

      await transaction.integrationPublished.deleteMany({});
      if (integrations.length > 0) {
        await transaction.integrationPublished.createMany({
          data: integrations.map((entry) => ({
            id: entry.id,
            kind: entry.kind,
            enabled: entry.enabled,
            scope: entry.scope,
            environment: entry.environment,
            notes: entry.notes,
            lastPublishedAt: publishedAt,
            config: toInputJson(asObject(entry.config, {})),
            publishedAt,
            releaseId: createdRelease.id,
          })),
        });
      }

      await transaction.adPlacementPublished.deleteMany({});
      if (adPlacements.length > 0) {
        await transaction.adPlacementPublished.createMany({
          data: adPlacements.map((entry) => ({
            id: entry.id,
            name: entry.name,
            provider: entry.provider,
            enabled: entry.enabled,
            slotId: entry.slotId,
            scopes: entry.scopes,
            categories: entry.categories,
            environment: entry.environment,
            notes: entry.notes,
            lastPublishedAt: publishedAt,
            config: toInputJson(asObject(entry.config, {})),
            publishedAt,
            releaseId: createdRelease.id,
          })),
        });
      }

      await transaction.legalPageSectionPublished.deleteMany({});
      await transaction.legalPagePublished.deleteMany({});
      for (const page of legalPages) {
        await transaction.legalPagePublished.create({
          data: {
            id: page.id,
            slug: page.slug,
            eyebrow: page.eyebrow,
            title: page.title,
            description: page.description,
            ctaTitle: page.ctaTitle,
            ctaDescription: page.ctaDescription,
            ctaLabel: page.ctaLabel,
            ctaHref: page.ctaHref,
            publishedAt,
            releaseId: createdRelease.id,
          },
        });

        if (page.sections.length > 0) {
          await transaction.legalPageSectionPublished.createMany({
            data: page.sections.map((section) => ({
              pageId: page.id,
              heading: section.heading,
              body: section.body,
              order: section.order,
              publishedAt,
              releaseId: createdRelease.id,
            })),
          });
        }
      }

      await transaction.faqEntryPublished.deleteMany({});
      if (faqEntries.length > 0) {
        await transaction.faqEntryPublished.createMany({
          data: faqEntries.map((entry) => ({
            id: entry.id,
            question: entry.question,
            answer: entry.answer,
            order: entry.order,
            publishedAt,
            releaseId: createdRelease.id,
          })),
        });
      }

      await transaction.guidePublished.deleteMany({});
      if (guides.length > 0) {
        await transaction.guidePublished.createMany({
          data: guides.map((entry) => ({
            id: entry.id,
            slug: entry.slug,
            title: entry.title,
            excerpt: entry.excerpt,
            category: entry.category,
            body: entry.body,
            publishedAt,
            releaseId: createdRelease.id,
          })),
        });
      }

      if (siteShellDraft) {
        await transaction.siteShellDraft.update({ where: { id: SITE_SHELL_ID }, data: { version: nextVersion } });
      }
      if (homepageDraft) {
        await transaction.homepageDraft.update({ where: { id: HOMEPAGE_ID }, data: { version: nextVersion } });
      }
      if (toolContentDraft) {
        await transaction.toolContentDraft.update({ where: { id: TOOL_CONTENT_ID }, data: { version: nextVersion } });
      }
      if (seoDraft) {
        await transaction.seoConfigDraft.update({ where: { id: SEO_ID }, data: { version: nextVersion } });
      }
      if (adsTxtDraft) {
        await transaction.adsTxtDraft.update({ where: { id: ADS_TXT_ID }, data: { version: nextVersion } });
      }

      await Promise.all([
        ...integrations.map((entry) =>
          transaction.integrationDraft.update({
            where: { id: entry.id },
            data: { lastPublishedAt: publishedAt },
          })
        ),
        ...adPlacements.map((entry) =>
          transaction.adPlacementDraft.update({
            where: { id: entry.id },
            data: { lastPublishedAt: publishedAt },
          })
        ),
      ]);

      return createdRelease;
    });

    await clearPublishedCache();

    try {
      await revalidatePublicSite();
      await markReleaseRevalidationResult(release.id, true, "Frontend revalidation completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown revalidation error";
      await markReleaseRevalidationResult(release.id, false, message);
      await enqueueRevalidation(release.id);
    }

    try {
      await syncFallbacksToFrontend();
    } catch (error) {
      console.warn("[Storage] Fallback sync failure (continuing):", error);
    }

    return {
      id: release.id,
      version: release.version,
      publishedAt: release.publishedAt.toISOString(),
      actorId: release.actorId,
      actorEmail: release.actorEmail,
    };
  } finally {
    await releaseRedisLock(PUBLISH_LOCK_KEY, lockToken);
  }
}

export async function markReleaseRevalidationResult(releaseId: string, ok: boolean, note: string): Promise<void> {
  await prisma.cmsRelease.update({
    where: { id: releaseId },
    data: {
      frontendRevalidatedAt: new Date(),
      frontendRevalidateOk: ok,
      frontendRevalidateNote: note,
    },
  });
}

export async function refreshRuntimeCaches(options?: { clearCmsCache?: boolean; revalidateFrontend?: boolean }) {
  const shouldClearCmsCache = options?.clearCmsCache !== false;
  const shouldRevalidateFrontend = options?.revalidateFrontend !== false;

  let frontendRevalidateOk: boolean | null = null;
  let frontendRevalidateNote = "Frontend revalidation was skipped.";

  if (shouldClearCmsCache) {
    await clearPublishedCache();
  }

  if (shouldRevalidateFrontend) {
    try {
      await revalidatePublicSite();
      frontendRevalidateOk = true;
      frontendRevalidateNote = "Frontend cache revalidation completed.";
    } catch (error) {
      frontendRevalidateOk = false;
      frontendRevalidateNote = error instanceof Error ? error.message : "Frontend revalidation failed.";
    }
  }

  return {
    clearedCmsCache: shouldClearCmsCache,
    revalidatedFrontend: shouldRevalidateFrontend,
    frontendRevalidateOk,
    frontendRevalidateNote,
    refreshedAt: new Date().toISOString(),
  };
}

export async function getCmsSystemStatus() {
  const [latestRelease] = await Promise.all([getLatestReleaseRecord()]);
  const redis = await getRedisClient();
  const redisPing = await redis.ping();

  return {
    database: "ok",
    redis: redisPing === "PONG" ? "ok" : "degraded",
    lastRelease: latestRelease
      ? {
        id: latestRelease.id,
        version: latestRelease.version,
        publishedAt: latestRelease.publishedAt.toISOString(),
        frontendRevalidatedAt: latestRelease.frontendRevalidatedAt?.toISOString() || null,
        frontendRevalidateOk: latestRelease.frontendRevalidateOk,
        frontendRevalidateNote: latestRelease.frontendRevalidateNote,
      }
      : null,
  };
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
  return `{${entries.join(",")}}`;
}

export async function hasPublishableDraftChanges(): Promise<boolean> {
  const [
    draftRuntime,
    publishedRuntime,
    draftSiteContent,
    publishedSiteContent,
    draftContentLibrary,
    publishedContentLibrary,
  ] = await Promise.all([
    getDraftConfig(),
    getPublishedConfig(),
    getDraftSiteContent(),
    getPublishedSiteContent(),
    getDraftContentLibrary(),
    getPublishedContentLibrary(),
  ]);

  const runtimeChanged = stableStringify({
    seo: draftRuntime.seo,
    ads: draftRuntime.ads,
    integrations: draftRuntime.integrations,
    adPlacements: draftRuntime.adPlacements,
    adsTxtLines: draftRuntime.adsTxtLines,
  }) !== stableStringify({
    seo: publishedRuntime.seo,
    ads: publishedRuntime.ads,
    integrations: publishedRuntime.integrations,
    adPlacements: publishedRuntime.adPlacements,
    adsTxtLines: publishedRuntime.adsTxtLines,
  });

  if (runtimeChanged) {
    return true;
  }

  const siteContentChanged = stableStringify(draftSiteContent.site) !== stableStringify(publishedSiteContent.site);
  if (siteContentChanged) {
    return true;
  }

  return stableStringify({
    legalPages: draftContentLibrary.legalPages,
    faq: draftContentLibrary.faq,
    guides: draftContentLibrary.guides,
  }) !== stableStringify({
    legalPages: publishedContentLibrary.legalPages,
    faq: publishedContentLibrary.faq,
    guides: publishedContentLibrary.guides,
  });
}

export async function getPublishReadiness(): Promise<PublishReadinessState> {
  let hasChanges = false;
  try {
    hasChanges = await hasPublishableDraftChanges();
  } catch {
    hasChanges = false;
  }

  const checks: PublishReadinessState["checks"] = [];

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      id: "database",
      label: "Database",
      ok: true,
      message: "Database connection is healthy.",
    });
  } catch (error) {
    checks.push({
      id: "database",
      label: "Database",
      ok: false,
      message: error instanceof Error ? error.message : "Database check failed.",
    });
  }

  try {
    const redis = await getRedisClient();
    const ping = await redis.ping();
    if (ping !== "PONG") {
      throw new Error(`Unexpected Redis ping response: ${ping}`);
    }
    checks.push({
      id: "redis",
      label: "Redis",
      ok: true,
      message: "Redis connection is healthy.",
    });
  } catch (error) {
    checks.push({
      id: "redis",
      label: "Redis",
      ok: false,
      message: error instanceof Error ? error.message : "Redis check failed.",
    });
  }

  try {
    await checkPublicSiteRevalidateHealth();
    checks.push({
      id: "frontend_revalidate",
      label: "Frontend revalidate endpoint",
      ok: true,
      message: "Frontend endpoint is reachable.",
    });
  } catch (error) {
    checks.push({
      id: "frontend_revalidate",
      label: "Frontend revalidate endpoint",
      ok: false,
      message: error instanceof Error ? error.message : "Frontend endpoint check failed.",
    });
  }

  const canPublish = hasChanges && checks.every((check) => check.ok);

  return {
    hasChanges,
    canPublish,
    checks,
  };
}
