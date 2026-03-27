import { z } from "zod";

const runtimeEnvironmentSchema = z.enum(["all", "dev", "prod"]);
const integrationScopeSchema = z.enum([
  "all_public_routes",
  "home_only",
  "guide_only",
  "faq_only",
  "legal_only",
  "tool_pages",
]);
const adScopeSchema = z.enum(["home", "guide", "faq", "legal", "tool_page", "support", "footer"]);

export const runtimeIntegrationSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "google_analytics_ga4",
    "google_tag_manager",
    "google_search_console",
    "bing_webmaster",
    "microsoft_clarity",
    "meta_pixel",
    "adsense",
    "google_ad_manager",
    "custom_third_party_script",
    "custom_verification_meta",
  ]),
  enabled: z.boolean(),
  scope: integrationScopeSchema,
  environment: runtimeEnvironmentSchema,
  notes: z.string(),
  lastPublishedAt: z.iso.datetime().nullable(),
  config: z.record(z.string(), z.union([z.string(), z.boolean()])),
});

export const adPlacementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.enum(["adsense_display", "adsense_in_article", "custom_banner", "custom_card", "placeholder"]),
  enabled: z.boolean(),
  slotId: z.string().min(1),
  scopes: z.array(adScopeSchema).min(1),
  categories: z.array(z.string()),
  environment: runtimeEnvironmentSchema,
  notes: z.string(),
  lastPublishedAt: z.iso.datetime().nullable(),
  config: z.record(z.string(), z.union([z.string(), z.boolean()])),
});

export const runtimeAdsConfigSchema = z.object({
  blueprint: z.object({
    enabled: z.boolean(),
  }),
});

export const runtimeSiteConfigSchema = z.object({
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable(),
  seo: z.record(z.string(), z.unknown()),
  ads: runtimeAdsConfigSchema,
  integrations: z.array(runtimeIntegrationSchema),
  adPlacements: z.array(adPlacementSchema),
  adsTxtLines: z.array(z.string()),
});

const siteContentDocumentSchema = z.record(z.string(), z.unknown());

export const siteContentStateSchema = z.object({
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable(),
  site: siteContentDocumentSchema,
});

const legalPageSchema = z.object({
  slug: z.string().min(1),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  description: z.string(),
  body: z.string(),
  updatedAt: z.iso.datetime().optional(),
  sections: z.array(z.object({
    id: z.string().min(1),
    heading: z.string().min(1),
    body: z.string(),
  })).optional(),
  cta: z.object({
    title: z.string(),
    description: z.string(),
    label: z.string(),
    href: z.string(),
  }).nullable().optional(),
});

const faqEntrySchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
});

const guideEntrySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.string().min(1),
  body: z.string().min(1),
});

export const contentLibraryStateSchema = z.object({
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable(),
  legalPages: z.record(z.string(), legalPageSchema),
  faq: z.array(faqEntrySchema),
  guides: z.array(guideEntrySchema),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  twoFactorCode: z.string().trim().optional(),
});

export const updateDraftSchema = z.object({
  config: runtimeSiteConfigSchema,
});

export const updateSiteContentDraftSchema = z.object({
  site: siteContentDocumentSchema,
});

export const updateSiteShellDraftSchema = z.object({
  branding: z.record(z.string(), z.unknown()),
  contact: z.record(z.string(), z.unknown()),
  organization: z.record(z.string(), z.unknown()),
  system: z.record(z.string(), z.unknown()),
  ui: z.record(z.string(), z.unknown()),
  navigation: z.record(z.string(), z.unknown()),
  footer: z.record(z.string(), z.unknown()),
});

export const updateHomepageDraftSchema = z.object({
  home: z.record(z.string(), z.unknown()),
});

export const updateHomepageHeroDraftSchema = z.object({
  hero: z.record(z.string(), z.unknown()),
});

export const updateToolsDraftSchema = z.object({
  tools: z.record(z.string(), z.unknown()),
});

export const updateSeoDraftSchema = z.object({
  seo: z.record(z.string(), z.unknown()),
});

export const updateIntegrationsDraftSchema = z.object({
  integrations: z.array(runtimeIntegrationSchema),
});

export const updateAdsDraftSchema = z.object({
  adPlacements: z.array(adPlacementSchema),
  adsTxtLines: z.array(z.string()),
  blueprintEnabled: z.boolean().optional(),
});

export const updateContentLibraryDraftSchema = z.object({
  legalPages: z.record(z.string(), legalPageSchema),
  faq: z.array(faqEntrySchema),
  guides: z.array(guideEntrySchema),
});
