export type RuntimeEnvironment = "all" | "dev" | "prod";
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
export type AdProvider =
  | "adsense_display"
  | "adsense_in_article"
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
export type AdminRole = "SUPERADMIN" | "ADMIN";
export type JsonObject = Record<string, unknown>;

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

export interface RuntimeAdsConfig {
  blueprint: {
    enabled: boolean;
  };
}

export interface RuntimeSiteConfigDocument {
  version: number;
  updatedAt: string;
  publishedAt: string | null;
  seo: JsonObject;
  ads: RuntimeAdsConfig;
  integrations: RuntimeIntegration[];
  adPlacements: AdPlacement[];
  adsTxtLines: string[];
}

export type SiteContentDocument = JsonObject;

export interface SiteContentState {
  version: number;
  updatedAt: string;
  publishedAt: string | null;
  site: SiteContentDocument;
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

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  passwordHash: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  twoFactorPendingSecret: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  twoFactorEnabled: boolean;
}

export interface SessionPayload extends SessionUser {
  exp: number;
}

export interface ReleaseRecord {
  id: string;
  version: number;
  publishedAt: string;
  actorId: string;
  actorEmail: string;
}

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: AdminRole | null;
  action: string;
  module: string;
  target: string;
  result: "success" | "failure";
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
}

export interface CmsModuleSummaryItem {
  id: string;
  title: string;
  status: "live" | "seeded" | "planned";
  description: string;
  entityCount?: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface VisitorEvent {
  id: string;
  createdAt: string;
  path: string;
  referrer: string | null;
  timezone: string | null;
  deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  browser: string;
  os: string;
  country: string | null;
  city: string | null;
  ipHash: string | null;
  userAgent: string | null;
}

export interface AnalyticsSummary {
  totalVisits: number;
  topPaths: Array<{ path: string; count: number }>;
  deviceBreakdown: Array<{ label: string; count: number }>;
  browserBreakdown: Array<{ label: string; count: number }>;
  countryBreakdown: Array<{ label: string; count: number }>;
  hourlyBreakdown: Array<{ hour: string; count: number }>;
  recentVisits: VisitorEvent[];
}
