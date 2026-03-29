import rawSeoConfig from "@/app/seo.json";
import rawSiteConfig from "@/app/site.json";
import { sanitize } from "payload-sanitizer";
import { appMode, selectedCmsApiInternalOrigin } from "./server-env";

export type IntegrationScope =
  | "all_public_routes"
  | "home_only"
  | "guide_only"
  | "faq_only"
  | "legal_only"
  | "tool_pages";
export type IntegrationKind =
  | "google_analytics_ga4"
  | "google_tag_manager"
  | "google_search_console"
  | "bing_webmaster"
  | "microsoft_clarity"
  | "meta_pixel"
  | "adsense"
  | "google_ad_manager"
  | "custom_third_party_script"
  | "custom_verification_meta";
export type RuntimeEnvironment = "all" | "dev" | "prod";
export type AdProvider =
  | "adsense_display"
  | "adsense_in_article"
  | "google_ad_manager"
  | "custom_banner"
  | "custom_card"
  | "placeholder";
export type AdScope =
  | "home"
  | "guide"
  | "faq"
  | "legal"
  | "tool_page"
  | "support"
  | "footer";

export interface RuntimeIntegration {
  id: string;
  kind: IntegrationKind;
  enabled: boolean;
  scope: IntegrationScope;
  environment: RuntimeEnvironment;
  notes: string;
  lastPublishedAt: string | null;
  config: Record<string, string | boolean>;
}

export interface AdPlacement {
  id: string;
  name: string;
  provider: AdProvider;
  enabled: boolean;
  slotId: string;
  scopes: AdScope[];
  categories: string[];
  environment: RuntimeEnvironment;
  notes: string;
  lastPublishedAt: string | null;
  config: Record<string, string | boolean>;
}

export interface RuntimeSiteConfigDocument {
  version: number;
  updatedAt: string;
  publishedAt: string | null;
  seo: typeof rawSeoConfig;
  ads: {
    blueprint: {
      enabled: boolean;
    };
  };
  integrations: RuntimeIntegration[];
  adPlacements: AdPlacement[];
  adsTxtLines: string[];
}

export interface SiteContentState {
  version: number;
  updatedAt: string;
  publishedAt: string | null;
  site: typeof rawSiteConfig;
}

export interface LegalPageDocument {
  slug: string;
  eyebrow?: string;
  title: string;
  description: string;
  body: string;
  updatedAt?: string;
  sections?: Array<{
    id: string;
    heading: string;
    body: string;
  }>;
  cta?: {
    title: string;
    description: string;
    label: string;
    href: string;
  } | null;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface GuideEntry {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  body: string;
}

export interface ContentLibraryState {
  version: number;
  updatedAt: string;
  publishedAt: string | null;
  legalPages: Record<string, LegalPageDocument>;
  faq: FaqEntry[];
  guides: GuideEntry[];
}

export const CMS_RUNTIME_CONFIG_TAG = "cms-runtime-config";
export const CMS_SITE_CONTENT_TAG = "cms-site-content";
export const CMS_CONTENT_LIBRARY_TAG = "cms-content-library";

const RUNTIME_FETCH_TIMEOUT_MS = 3000;
const FALLBACK_TIMESTAMP = "1970-01-01T00:00:00.000Z";

const fallbackRuntimeConfig: RuntimeSiteConfigDocument = {
  version: 1,
  updatedAt: FALLBACK_TIMESTAMP,
  publishedAt: null,
  seo: rawSeoConfig,
  ads: {
    blueprint: {
      enabled: appMode === "dev",
    },
  },
  integrations: [],
  adPlacements: [],
  adsTxtLines: [],
};

const fallbackSiteContent: SiteContentState = {
  version: 1,
  updatedAt: FALLBACK_TIMESTAMP,
  publishedAt: null,
  site: rawSiteConfig,
};

const fallbackContentLibrary: ContentLibraryState = {
  version: 1,
  updatedAt: FALLBACK_TIMESTAMP,
  publishedAt: null,
  legalPages: {},
  faq: [],
  guides: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function mergeSeoConfig(value: unknown): typeof rawSeoConfig {
  const candidate = asRecord(value);
  const metadata = asRecord(candidate.metadata);
  const metadataIcons = asRecord(metadata.icons);
  const robots = asRecord(candidate.robots);
  const social = asRecord(candidate.social);
  const structuredData = asRecord(candidate.structuredData);

  return {
    ...fallbackRuntimeConfig.seo,
    ...candidate,
    site: {
      ...fallbackRuntimeConfig.seo.site,
      ...asRecord(candidate.site),
    },
    metadata: {
      ...fallbackRuntimeConfig.seo.metadata,
      ...metadata,
      icons: {
        ...fallbackRuntimeConfig.seo.metadata.icons,
        ...metadataIcons,
      },
    },
    robots: {
      ...fallbackRuntimeConfig.seo.robots,
      ...robots,
      googleBot: {
        ...fallbackRuntimeConfig.seo.robots.googleBot,
        ...asRecord(robots.googleBot),
      },
    },
    manifest: {
      ...fallbackRuntimeConfig.seo.manifest,
      ...asRecord(candidate.manifest),
    },
    social: {
      ...fallbackRuntimeConfig.seo.social,
      ...social,
    },
    structuredData: {
      ...fallbackRuntimeConfig.seo.structuredData,
      ...structuredData,
    },
    pages: {
      ...fallbackRuntimeConfig.seo.pages,
      ...asRecord(candidate.pages),
    },
  };
}

function normalizeRuntimeConfig(value: unknown): RuntimeSiteConfigDocument {
  if (!value || typeof value !== "object") {
    return fallbackRuntimeConfig;
  }

  const candidate = value as Partial<RuntimeSiteConfigDocument>;

  return {
    version: typeof candidate.version === "number" ? candidate.version : fallbackRuntimeConfig.version,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : fallbackRuntimeConfig.updatedAt,
    publishedAt: typeof candidate.publishedAt === "string" ? candidate.publishedAt : null,
    seo: mergeSeoConfig(candidate.seo),
    ads: {
      blueprint: {
        enabled: typeof asRecord(asRecord(candidate.ads).blueprint).enabled === "boolean"
          ? Boolean(asRecord(asRecord(candidate.ads).blueprint).enabled)
          : fallbackRuntimeConfig.ads.blueprint.enabled,
      },
    },
    integrations: Array.isArray(candidate.integrations) ? candidate.integrations : fallbackRuntimeConfig.integrations,
    adPlacements: Array.isArray(candidate.adPlacements) ? candidate.adPlacements : fallbackRuntimeConfig.adPlacements,
    adsTxtLines: Array.isArray(candidate.adsTxtLines) ? candidate.adsTxtLines : fallbackRuntimeConfig.adsTxtLines,
  };
}

function normalizeSiteContent(value: unknown): SiteContentState {
  if (!value || typeof value !== "object") {
    return fallbackSiteContent;
  }

  const candidate = value as Partial<SiteContentState>;

  return {
    version: typeof candidate.version === "number" ? candidate.version : fallbackSiteContent.version,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : fallbackSiteContent.updatedAt,
    publishedAt: typeof candidate.publishedAt === "string" ? candidate.publishedAt : null,
    site: candidate.site && typeof candidate.site === "object" && Object.keys(candidate.site).length > 0
      ? candidate.site
      : fallbackSiteContent.site,
  };
}

function normalizeContentLibrary(value: unknown): ContentLibraryState {
  if (!value || typeof value !== "object") {
    return fallbackContentLibrary;
  }

  const candidate = value as Partial<ContentLibraryState>;

  return {
    version: typeof candidate.version === "number" ? candidate.version : fallbackContentLibrary.version,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : fallbackContentLibrary.updatedAt,
    publishedAt: typeof candidate.publishedAt === "string" ? candidate.publishedAt : null,
    legalPages: candidate.legalPages && typeof candidate.legalPages === "object"
      ? candidate.legalPages
      : fallbackContentLibrary.legalPages,
    faq: Array.isArray(candidate.faq) ? candidate.faq : fallbackContentLibrary.faq,
    guides: Array.isArray(candidate.guides) ? candidate.guides : fallbackContentLibrary.guides,
  };
}

function integrationScopeMatches(targetScope: IntegrationScope, routeScope: string): boolean {
  if (targetScope === "all_public_routes") {
    return true;
  }

  const normalizedTarget = targetScope.replace(/_only$/, "");
  return normalizedTarget === routeScope;
}

function environmentMatches(environment: RuntimeEnvironment): boolean {
  return environment === "all" || environment === appMode;
}

async function fetchCmsPayload(path: string, tags: string[]): Promise<unknown> {
  const response = await fetch(selectedCmsApiInternalOrigin + path, {
    next: {
      revalidate: 60,
      tags,
    },
    signal: AbortSignal.timeout(RUNTIME_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error("Unexpected CMS status " + response.status);
  }

  const payload = await response.json();
  return sanitize(payload.data, {
    drop: ["undefined", "null", "nan"],
    trimStrings: true,
    cleanArrays: true,
  });
}

async function readFallbackDiskSnapshot<T>(filename: string): Promise<T | null> {
  const isServer = typeof window === "undefined";
  if (!isServer) return null;

  try {
    const { join } = await import("node:path");
    const { readFile } = await import("node:fs/promises");
    const { existsSync } = await import("node:fs");

    const filePath = join(process.cwd(), "src", "lib", "cms-fallbacks", filename);
    if (!existsSync(filePath)) return null;
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`[CMS] Could not read disk fallback for ${filename}:`, error);
    return null;
  }
}

async function fetchRuntimeConfig(): Promise<RuntimeSiteConfigDocument> {
  try {
    return normalizeRuntimeConfig(await fetchCmsPayload("/published/v1/site-runtime-config", [CMS_RUNTIME_CONFIG_TAG]));
  } catch (error) {
    const diskFallback = await readFallbackDiskSnapshot<RuntimeSiteConfigDocument>("runtime-config.json");
    if (diskFallback) {
      console.info("[CMS] Using disk fallback for runtime-config");
      return normalizeRuntimeConfig(diskFallback);
    }
    console.warn("[CMS] Using build-time fallback for runtime-config");
    return fallbackRuntimeConfig;
  }
}

export async function getRuntimeSiteConfig(): Promise<RuntimeSiteConfigDocument> {
  return fetchRuntimeConfig();
}

async function fetchSiteContent(): Promise<SiteContentState> {
  try {
    return normalizeSiteContent(await fetchCmsPayload("/published/v1/site-content", [CMS_SITE_CONTENT_TAG]));
  } catch {
    const diskFallback = await readFallbackDiskSnapshot<SiteContentState>("site-content.json");
    if (diskFallback) {
      console.info("[CMS] Using disk fallback for site-content");
      return normalizeSiteContent(diskFallback);
    }
    console.warn("[CMS] Using build-time fallback for site-content");
    return fallbackSiteContent;
  }
}

export async function getRuntimeSiteContent(): Promise<SiteContentState> {
  return fetchSiteContent();
}

async function fetchContentLibrary(): Promise<ContentLibraryState> {
  try {
    return normalizeContentLibrary(await fetchCmsPayload("/published/v1/content-library", [CMS_CONTENT_LIBRARY_TAG]));
  } catch {
    const diskFallback = await readFallbackDiskSnapshot<ContentLibraryState>("content-library.json");
    if (diskFallback) {
      console.info("[CMS] Using disk fallback for content-library");
      return normalizeContentLibrary(diskFallback);
    }
    console.warn("[CMS] Using build-time fallback for content-library");
    return fallbackContentLibrary;
  }
}

export async function getRuntimeContentLibrary(): Promise<ContentLibraryState> {
  return fetchContentLibrary();
}

export async function getRuntimeIntegrations(routeScope = "all_public_routes"): Promise<RuntimeIntegration[]> {
  const runtimeConfig = await getRuntimeSiteConfig();
  return runtimeConfig.integrations.filter((integration) => (
    integration.enabled &&
    environmentMatches(integration.environment) &&
    integrationScopeMatches(integration.scope, routeScope)
  ));
}

export async function getRuntimeAdsTxtLines(): Promise<string[]> {
  const runtimeConfig = await getRuntimeSiteConfig();
  return runtimeConfig.adsTxtLines;
}

export async function isAdBlueprintModeEnabled(): Promise<boolean> {
  const runtimeConfig = await getRuntimeSiteConfig();
  return runtimeConfig.ads.blueprint.enabled;
}

export async function resolveRuntimeAdPlacement(
  slotId: string,
  scope: AdScope,
  categories: string[] = [],
): Promise<AdPlacement | null> {
  const runtimeConfig = await getRuntimeSiteConfig();
  return runtimeConfig.adPlacements.find((placement) => {
    if (!placement.enabled || placement.slotId !== slotId || !environmentMatches(placement.environment)) {
      return false;
    }

    if (!placement.scopes.includes(scope)) {
      return false;
    }

    if (placement.categories.length === 0) {
      return true;
    }

    if (categories.length === 0) {
      return true;
    }

    return categories.some((category) => placement.categories.includes(category));
  }) || null;
}
