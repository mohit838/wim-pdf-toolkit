export type CmsModuleStatus = "live" | "seeded" | "planned";
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
  | "ezoic"
  | "mediavine"
  | "adthrive"
  | "monetizemore"
  | "setupad"
  | "custom_third_party_script"
  | "custom_verification_meta";
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

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface CmsSystemStatus {
  database: string;
  redis: string;
  lastRelease: ReleaseRecord | null;
}

export interface PublishReadiness {
  hasChanges: boolean;
  canPublish: boolean;
  checks: Array<{
    id: "database" | "redis" | "frontend_revalidate";
    label: string;
    ok: boolean;
    message: string;
  }>;
}

export interface CacheRefreshResult {
  clearedCmsCache: boolean;
  revalidatedFrontend: boolean;
  frontendRevalidateOk: boolean | null;
  frontendRevalidateNote: string;
  refreshedAt: string;
}

export interface ModuleSummaryItem {
  id: string;
  title: string;
  status: CmsModuleStatus;
  description: string;
  entityCount?: number;
}

export interface ReleaseRecord {
  id: string;
  version: number;
  publishedAt: string;
  actorEmail?: string;
  frontendRevalidatedAt?: string | null;
  frontendRevalidateOk?: boolean | null;
  frontendRevalidateNote?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  action: string;
  module: string;
  target: string;
  result: string;
  actorEmail: string | null;
  actorId: string | null;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface PermissionCatalog {
  modules: string[];
  actions: string[];
}

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

export interface RuntimeAdPlacement {
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

export interface SiteShellDraft {
  branding: {
    name: string;
    shortName: string;
    legalName: string;
    authorName: string;
  };
  contact: {
    email: string;
  };
  organization: {
    profiles: string[];
  };
  system: {
    customHeadHtml?: string;
    customBodyHtml?: string;
  };
  ui: Record<string, unknown>;
  navigation: {
    homeLabel: string;
    groups: Array<{
      id: string;
      label: string;
      toolIds: string[];
    }>;
  };
  footer: {
    eyebrow: string;
    headline: string;
    description: string;
    sections: Array<{
      id: string;
      title: string;
      toolIds: string[];
    }>;
    support: {
      title: string;
      description: string;
      contactLabel: string;
    };
    bottomNote: string;
  };
}

export interface HomepageDraft {
  home: {
    sectionCountSuffix: string;
    hero: {
      badgeCountSuffix: string;
      titleLead: string;
      titleHighlight: string;
      emphasisColor?: string;
      titleTail: string;
      description: string;
      pills: string[];
      primaryActionPrefix: string;
      secondaryActionLabel: string;
      readyToolsSuffix: string;
    };
    quickStart: {
      eyebrow: string;
      title: string;
      countSuffix: string;
      actionLabel: string;
      toolIds: string[];
    };
    sections: Array<{
      id: string;
      eyebrow: string;
      accent: string;
      titleTail?: string;
      description: string;
      toolIds: string[];
    }>;
  };
}

export interface HomepageHeroDraft {
  hero: HomepageDraft["home"]["hero"];
}

export interface ToolDraft {
  path: string;
  seoPageKey: string;
  iconKey: string;
  status: "ready" | "coming-soon";
  nav: {
    label: string;
    description: string;
  };
  homeCard: {
    title: string;
    description: string;
  };
  footerLabel?: string;
  heroCard?: {
    eyebrow: string;
    title: string;
    description: string;
    accentColor: string;
    glow: string;
  };
  page: {
    eyebrow: string;
    title: string;
    description: string;
  };
}

export type ToolDraftMap = Record<string, ToolDraft>;

export interface SeoPageDraft {
  title: string;
  description: string;
  path: string;
  keywords: string[];
  index: boolean;
  follow: boolean;
  priority: number;
  changeFrequency: string;
}

export interface SeoDraft {
  seo: {
    site: {
      defaultTitle: string;
      titleTemplate: string;
      description: string;
      keywords: string[];
      category: string;
      language: string;
      locale: string;
      [key: string]: unknown;
    };
    pages: Record<string, SeoPageDraft>;
    [key: string]: unknown;
  };
}

export interface AdsDraftState {
  adPlacements: RuntimeAdPlacement[];
  adsTxtLines: string[];
  blueprintEnabled: boolean;
}

export interface LegalPageSection {
  id: string;
  heading: string;
  body: string;
}

export interface LegalPageDocument {
  slug: string;
  eyebrow?: string;
  title: string;
  description: string;
  body: string;
  updatedAt?: string;
  sections?: LegalPageSection[];
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

export interface RuntimeSiteConfigDocument {
  version: number;
  updatedAt: string;
  publishedAt: string | null;
  seo: Record<string, unknown>;
  ads: {
    blueprint: {
      enabled: boolean;
    };
  };
  integrations: RuntimeIntegration[];
  adPlacements: RuntimeAdPlacement[];
  adsTxtLines: string[];
}
