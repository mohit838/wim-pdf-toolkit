import type { Metadata, MetadataRoute } from "next";
import { toolIconKeys, type ToolIconKey } from "@/components/tool-icons";
import {
  getRuntimeContentLibrary as readRuntimeContentLibrary,
  getRuntimeSiteConfig as readRuntimeSiteConfig,
  getRuntimeSiteContent as readRuntimeSiteContent,
  type ContentLibraryState,
  type FaqEntry,
  type GuideEntry,
  type LegalPageDocument,
} from "@/lib/cms-runtime";
import { selectedPublicSiteOrigin } from "@/lib/public-env";
import fallbackLegalPagesConfig from "./legal-pages-fallback.json";
import fallbackGuidesConfig from "./guides-fallback.json";
import rawSeoConfig from "./seo.json";
import rawSiteConfig from "./site.json";

const FIXED_LEGAL_SLUGS = new Set(["about", "contact", "privacy", "terms", "cookies", "ad-disclosure"]);

function normalizeSiteUrl(value: string | undefined): string {
  const fallback = rawSeoConfig.site.fallbackSiteUrl;
  const candidate = value?.trim() || fallback;

  try {
    const url = new URL(candidate);
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T;
  }

  if (isPlainObject(base)) {
    const merged: Record<string, unknown> = { ...base };

    if (!isPlainObject(override)) {
      return merged as T;
    }

    for (const [key, overrideValue] of Object.entries(override)) {
      const baseValue = merged[key];

      if (Array.isArray(baseValue)) {
        merged[key] = Array.isArray(overrideValue) ? overrideValue : baseValue;
        continue;
      }

      if (isPlainObject(baseValue)) {
        merged[key] = deepMerge(baseValue, overrideValue);
        continue;
      }

      if (overrideValue !== undefined) {
        merged[key] = overrideValue;
      }
    }

    return merged as T;
  }

  return (override ?? base) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

type RawSeoConfig = typeof rawSeoConfig;
type RawSiteConfig = typeof rawSiteConfig;

export type ToolId = keyof RawSiteConfig["tools"];
export type SeoPageKey = keyof RawSeoConfig["pages"];
export type SeoPage = RawSeoConfig["pages"][SeoPageKey];
export type ToolStatus = "ready" | "coming-soon";
export type IconKey = ToolIconKey;

export interface ToolCardUiCopy {
  readyLabel: string;
  soonLabel: string;
  openLabel: string;
  comingSoonLabel: string;
}

export interface LoadingScreenCopy {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
}

export interface ErrorScreenCopy {
  eyebrow: string;
  title: string;
  description: string;
  redirectLabel: string;
  retryLabel: string;
  supportActionLabel: string;
  emailLabel: string;
}

export interface SupportScreenCopy {
  eyebrow: string;
  title: string;
  description: string;
  emailLabel: string;
  emailActionLabel: string;
  homeActionLabel: string;
}

export interface FileDropzoneUiCopy {
  dropzoneTitle: string;
  dropzoneSubtitle: string;
  dropzoneHint: string;
  listTitle: string;
  removeFileLabel: string;
  countSingular: string;
  countPlural: string;
}

export interface ToolPageActionCopy {
  primaryLabel?: string;
  busyLabel: string;
  clearLabel?: string;
  downloadLabel?: string;
  downloadPrefix?: string;
}

export interface ToolFileInputCopy {
  label?: string;
  placeholder?: string;
  hint?: string;
  dropzoneTitle?: string;
  dropzoneSubtitle?: string;
  dropzoneHint?: string;
  listTitle?: string;
  removeFileLabel?: string;
  countSingular?: string;
  countPlural?: string;
  selectedCountLabel?: string;
}

export interface ToolPageSummaryCopy {
  totalSizeLabel?: string;
}

export interface ToolStatusPanelCopy {
  title: string;
  filesSelectedLabel: string;
  workflowLabel: string;
  workflowSteps: string[];
}

export interface RotationFieldCopy {
  label: string;
}

export interface PagesFieldCopy {
  label: string;
  hint?: string;
  placeholder?: string;
}

export interface PasswordFieldCopy {
  label: string;
  placeholder: string;
}

export interface RangeSectionCopy {
  label: string;
  addLabel: string;
  removeLabel: string;
  partPrefix: string;
  toLabel: string;
}

export interface SelectionSectionCopy {
  label: string;
  selectedSuffix: string;
  selectAllLabel: string;
  clearLabel: string;
  actionPrefix: string;
  actionUnitSingular: string;
  actionUnitPlural: string;
}

export interface OrderSectionCopy {
  label: string;
  resetLabel: string;
  reverseLabel: string;
  helperText: string;
  currentOrderLabel: string;
  moveEarlierLabel: string;
  moveLaterLabel: string;
}

export interface WatermarkSectionCopy {
  textLabel: string;
  textPlaceholder: string;
  fontSizeLabel: string;
  opacityLabel: string;
  angleLabel: string;
}

export interface ImageListCopy {
  itemLabelSingular: string;
  itemLabelPlural: string;
}

export interface ToolPageCopy {
  eyebrow: string;
  title: string;
  description: string;
  fileInput?: ToolFileInputCopy;
  actions: ToolPageActionCopy;
  summary?: ToolPageSummaryCopy;
  statusPanel?: ToolStatusPanelCopy;
  rotationField?: RotationFieldCopy;
  pagesField?: PagesFieldCopy;
  passwordField?: PasswordFieldCopy;
  rangeSection?: RangeSectionCopy;
  selectionSection?: SelectionSectionCopy;
  orderSection?: OrderSectionCopy;
  watermarkSection?: WatermarkSectionCopy;
  imageList?: ImageListCopy;
}

export interface HeroToolCopy {
  eyebrow: string;
  title: string;
  description: string;
  accentColor: string;
  glow: string;
}

export interface SiteToolConfig {
  path: string;
  seoPageKey: SeoPageKey;
  iconKey: IconKey;
  status: ToolStatus;
  nav: {
    label: string;
    description: string;
  };
  homeCard: {
    title: string;
    description: string;
  };
  footerLabel?: string;
  heroCard?: HeroToolCopy;
  page: ToolPageCopy;
}

interface SiteConfig {
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
    loading: LoadingScreenCopy;
    error: ErrorScreenCopy;
    support: SupportScreenCopy;
  };
  ui: {
    backButtonLabel: string;
    backButtonAriaLabel: string;
    fileDropzone: FileDropzoneUiCopy;
    toolCard: ToolCardUiCopy;
  };
  navigation: {
    homeLabel: string;
    groups: Array<{
      id: string;
      label: string;
      toolIds: ToolId[];
    }>;
  };
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
      toolIds: ToolId[];
    };
    sections: Array<{
      id: string;
      eyebrow: string;
      accent: string;
      titleTail?: string;
      description: string;
      toolIds: ToolId[];
    }>;
  };
  tools: Record<ToolId, SiteToolConfig>;
  footer: {
    eyebrow: string;
    headline: string;
    description: string;
    sections: Array<{
      title: string;
      toolIds: ToolId[];
    }>;
    support: {
      title: string;
      description: string;
      contactLabel: string;
    };
    bottomNote: string;
  };
}

const seoPageKeys = new Set<string>(Object.keys(rawSeoConfig.pages));
const validIconKeys = new Set<string>(toolIconKeys);

function validateSiteConfig(config: SiteConfig): SiteConfig {
  const toolIds = Object.keys(config.tools) as ToolId[];
  const toolIdSet = new Set<string>(toolIds);
  const seenPaths = new Set<string>();

  const assertToolIds = (scope: string, ids: ToolId[]) => {
    for (const toolId of ids) {
      assert(toolIdSet.has(toolId), `Unknown toolId "${toolId}" in ${scope}.`);
    }
  };

  for (const [toolId, tool] of Object.entries(config.tools) as Array<[ToolId, SiteToolConfig]>) {
    assert(tool.path.startsWith("/"), `Tool "${toolId}" must use an absolute path.`);
    assert(!seenPaths.has(tool.path), `Duplicate tool path "${tool.path}" found in site.json.`);
    seenPaths.add(tool.path);
    assert(validIconKeys.has(tool.iconKey), `Unknown iconKey "${tool.iconKey}" for tool "${toolId}".`);
    assert(seoPageKeys.has(tool.seoPageKey), `Unknown seoPageKey "${tool.seoPageKey}" for tool "${toolId}".`);
  }

  for (const group of config.navigation.groups) {
    assertToolIds(`navigation group "${group.id}"`, group.toolIds);
  }

  assertToolIds("home quickStart", config.home.quickStart.toolIds);
  for (const toolId of config.home.quickStart.toolIds) {
    assert(config.tools[toolId].heroCard, `Tool "${toolId}" needs heroCard copy for home.quickStart.`);
  }

  for (const section of config.home.sections) {
    assertToolIds(`home section "${section.id}"`, section.toolIds);
  }

  for (const section of config.footer.sections) {
    assertToolIds(`footer section "${section.title}"`, section.toolIds);
  }

  return config;
}

export const seoConfig = rawSeoConfig;
export const siteConfig = validateSiteConfig(rawSiteConfig as SiteConfig);
const fallbackLegalPages = fallbackLegalPagesConfig as Record<string, LegalPageDocument>;
const fallbackGuides = fallbackGuidesConfig as GuideEntry[];
const REMOVED_GUIDE_SLUGS = new Set(["cms-sync-check"]);

function isRemovedGuideSlug(slug: string): boolean {
  return REMOVED_GUIDE_SLUGS.has(slug.trim().toLowerCase());
}

export const siteName = siteConfig.branding.name;
export const siteShortName = siteConfig.branding.shortName;
export const siteLegalName = siteConfig.branding.legalName;
export const authorName = siteConfig.branding.authorName;
export const contactEmail = siteConfig.contact.email;
export const organizationProfiles = siteConfig.organization.profiles.filter(Boolean);

export const siteDefaultTitle = seoConfig.site.defaultTitle;
export const siteTitleTemplate = seoConfig.site.titleTemplate;
export const siteDescription = seoConfig.site.description;
export const siteKeywords = seoConfig.site.keywords;
export const siteCategory = seoConfig.site.category;
export const siteLanguage = seoConfig.site.language;
export const siteLocale = seoConfig.site.locale;
export const metadataAssetsConfig = seoConfig.metadata;
export const manifestConfig = seoConfig.manifest;
export const robotsConfig = seoConfig.robots;
export const socialConfig = seoConfig.social;
export const structuredDataConfig = seoConfig.structuredData;
export const sitePages = seoConfig.pages;
export const supportPath = seoConfig.pages.support.path;
export const twitterCardType = socialConfig.twitterCard as "summary" | "summary_large_image" | "player" | "app";

const googleBotRobotsInfo = {
  index: robotsConfig.googleBot.index,
  follow: robotsConfig.googleBot.follow,
  "max-image-preview": robotsConfig.googleBot["max-image-preview"] as "none" | "large" | "standard",
  "max-snippet": robotsConfig.googleBot["max-snippet"],
  "max-video-preview": robotsConfig.googleBot["max-video-preview"],
};

export const defaultRobotsMetadata: NonNullable<Metadata["robots"]> = {
  index: robotsConfig.index,
  follow: robotsConfig.follow,
  googleBot: googleBotRobotsInfo,
};

export function buildRobotsMetadata(index: boolean, follow: boolean): NonNullable<Metadata["robots"]> {
  return {
    index,
    follow,
    googleBot: {
      ...googleBotRobotsInfo,
      index,
      follow,
    },
  };
}

export const navigationConfig = siteConfig.navigation;
export const homeConfig = siteConfig.home;
export const footerConfig = siteConfig.footer;
export const systemConfig = siteConfig.system;
export const siteUiConfig = siteConfig.ui;
export const homeLabel = siteConfig.navigation.homeLabel;
export const toolCardUi = siteConfig.ui.toolCard;
export const backButtonLabel = siteConfig.ui.backButtonLabel;
export const backButtonAriaLabel = siteConfig.ui.backButtonAriaLabel;
export const fileDropzoneUi = siteConfig.ui.fileDropzone;

export const siteUrl = normalizeSiteUrl(selectedPublicSiteOrigin);
export const metadataBase = parseUrl(siteUrl);

export async function getRuntimeSiteConfig() {
  return readRuntimeSiteConfig();
}

export async function getResolvedSiteConfig(): Promise<SiteConfig> {
  const runtimeSiteContent = await readRuntimeSiteContent();
  try {
    return validateSiteConfig(deepMerge(siteConfig, runtimeSiteContent.site) as SiteConfig);
  } catch {
    return siteConfig;
  }
}

async function getResolvedToolConfig(toolId: ToolId): Promise<SiteToolConfig> {
  const siteConfig = await getResolvedSiteConfig();
  return siteConfig.tools[toolId];
}

async function getResolvedFooterSections(config?: SiteConfig): Promise<FooterSection[]> {
  const site = config || await getResolvedSiteConfig();
  return site.footer.sections.map((section) => ({
    title: section.title,
    links: section.toolIds.map((toolId) => {
      const tool = site.tools[toolId];

      return {
        label: tool.footerLabel || tool.nav.label,
        href: tool.path,
      };
    }),
  }));
}

export async function getResolvedSiteBranding() {
  const site = await getResolvedSiteConfig();
  return {
    name: site.branding.name,
    shortName: site.branding.shortName,
    legalName: site.branding.legalName,
    authorName: site.branding.authorName,
  };
}

export async function getResolvedContactEmail(): Promise<string> {
  const site = await getResolvedSiteConfig();
  return site.contact.email;
}

export async function getResolvedHomeLabel(): Promise<string> {
  const site = await getResolvedSiteConfig();
  return site.navigation.homeLabel;
}

export async function getResolvedBackButtonCopy() {
  const site = await getResolvedSiteConfig();
  return {
    label: site.ui.backButtonLabel,
    ariaLabel: site.ui.backButtonAriaLabel,
  };
}

export async function getResolvedToolCardUi(): Promise<ToolCardUiCopy> {
  const site = await getResolvedSiteConfig();
  return site.ui.toolCard;
}

export async function getResolvedNavGroups(): Promise<NavGroup[]> {
  const site = await getResolvedSiteConfig();
  return buildCoveredNavigationGroups(site).map((group) => ({
    id: group.id,
    label: group.label,
    items: group.toolIds.map((toolId) => {
      const tool = site.tools[toolId];

      return {
        id: toolId,
        label: tool.nav.label,
        description: tool.nav.description,
        to: tool.path,
        iconKey: tool.iconKey,
        status: tool.status,
      };
    }),
  }));
}

export async function getResolvedHomeQuickStart(): Promise<HomeHeroTool[]> {
  const site = await getResolvedSiteConfig();
  return site.home.quickStart.toolIds.slice(0, 4).map((toolId) => {
    const tool = site.tools[toolId];
    assert(tool.heroCard, `Tool "${toolId}" is missing heroCard copy.`);

    return {
      id: toolId,
      title: tool.heroCard.title,
      description: tool.heroCard.description,
      eyebrow: tool.heroCard.eyebrow,
      accentColor: tool.heroCard.accentColor,
      glow: tool.heroCard.glow,
      to: tool.path,
      iconKey: tool.iconKey,
      status: tool.status,
    };
  });
}

export async function getResolvedHomeSections(): Promise<HomeSection[]> {
  const site = await getResolvedSiteConfig();
  return buildCoveredHomeSections(site).map((section) => ({
    id: section.id,
    eyebrow: section.eyebrow,
    accent: section.accent,
    titleTail: section.titleTail,
    description: section.description,
    tools: section.toolIds.map((toolId) => {
      const tool = site.tools[toolId];

      return {
        id: toolId,
        title: tool.homeCard.title,
        description: tool.homeCard.description,
        to: tool.path,
        iconKey: tool.iconKey,
        status: tool.status,
      };
    }),
  }));
}

export async function getResolvedReadyToolCount(): Promise<number> {
  const site = await getResolvedSiteConfig();
  return (Object.keys(site.tools) as ToolId[]).filter((toolId) => site.tools[toolId].status === "ready").length;
}

export async function getResolvedHomeConfig(): Promise<SiteConfig["home"]> {
  const site = await getResolvedSiteConfig();
  return site.home;
}

export async function getResolvedFooterConfig(): Promise<SiteConfig["footer"]> {
  const site = await getResolvedSiteConfig();
  return site.footer;
}

export async function getResolvedFooterSectionsWithConfig() {
  const site = await getResolvedSiteConfig();
  return {
    footer: site.footer,
    sections: await getResolvedFooterSections(site),
  };
}

export async function getResolvedToolPageCopy(toolId: ToolId): Promise<ToolPageCopy> {
  const tool = await getResolvedToolConfig(toolId);
  return tool.page;
}

export async function getResolvedContentLibrary(): Promise<ContentLibraryState> {
  const contentLibrary = await readRuntimeContentLibrary();
  return {
    ...contentLibrary,
    legalPages: {
      ...fallbackLegalPages,
      ...contentLibrary.legalPages,
    },
    guides: (contentLibrary.guides.length > 0 ? contentLibrary.guides : fallbackGuides)
      .filter((guide) => !isRemovedGuideSlug(guide.slug)),
  };
}

export async function getResolvedLegalPage(slug: string): Promise<LegalPageDocument | null> {
  const contentLibrary = await getResolvedContentLibrary();
  return contentLibrary.legalPages[slug] || null;
}

export async function getResolvedFaqEntries(): Promise<FaqEntry[]> {
  const contentLibrary = await getResolvedContentLibrary();
  return contentLibrary.faq;
}

export async function getResolvedGuides(): Promise<GuideEntry[]> {
  const contentLibrary = await getResolvedContentLibrary();
  return contentLibrary.guides;
}

export async function getResolvedGuide(slug: string): Promise<GuideEntry | null> {
  const guides = await getResolvedGuides();
  const normalizedSlug = slug.trim().toLowerCase();
  if (isRemovedGuideSlug(normalizedSlug)) {
    return null;
  }

  return guides.find((guide) => guide.slug.trim().toLowerCase() === normalizedSlug) || null;
}

export async function getResolvedFooterResourceLinks(): Promise<Array<{ label: string; href: string }>> {
  const contentLibrary = await getResolvedContentLibrary();
  const links: Array<{ label: string; href: string }> = [];

  const pushLegalLink = (slug: string) => {
    const page = contentLibrary.legalPages[slug];
    if (page) {
      links.push({
        label: page.title,
        href: `/${slug}`,
      });
    }
  };

  pushLegalLink("about");
  pushLegalLink("contact");
  pushLegalLink("privacy");
  pushLegalLink("terms");
  pushLegalLink("cookies");
  pushLegalLink("ad-disclosure");

  if (contentLibrary.faq.length > 0) {
    links.push({
      label: "FAQ",
      href: "/faq",
    });
  }

  if (contentLibrary.guides.length > 0) {
    links.push({
      label: "Guides",
      href: "/guides",
    });
  }

  for (const page of Object.values(contentLibrary.legalPages)) {
    if (FIXED_LEGAL_SLUGS.has(page.slug)) {
      continue;
    }

    links.push({
      label: page.title,
      href: `/pages/${page.slug}`,
    });
  }

  return links;
}

function buildKeywordList(pageKeywords: readonly string[] = []): string[] {
  return Array.from(new Set([...siteKeywords, ...pageKeywords]));
}

export interface ResolvedTool extends SiteToolConfig {
  id: ToolId;
}

export interface NavItem {
  id: ToolId;
  label: string;
  description: string;
  to: string;
  iconKey: IconKey;
  status: ToolStatus;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export interface HomeSectionTool {
  id: ToolId;
  title: string;
  description: string;
  to: string;
  iconKey: IconKey;
  status: ToolStatus;
}

export interface HomeHeroTool extends HomeSectionTool, HeroToolCopy {}

export interface HomeSection {
  id: string;
  eyebrow: string;
  accent: string;
  titleTail?: string;
  description: string;
  tools: HomeSectionTool[];
}

export interface FooterSection {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

function dedupeToolIds(ids: ToolId[]): ToolId[] {
  return Array.from(new Set(ids));
}

function getPreferredNavGroupId(toolId: ToolId): string {
  if (toolId === "protect" || toolId === "unlock" || toolId === "removeMetadata") {
    return "security";
  }
  if (toolId === "docxToPdf" || toolId === "pdfToDocx" || toolId === "pdfToJpg" || toolId === "pdfToText") {
    return "conversions";
  }
  return "pdf-tools";
}

function getPreferredHomeSectionId(toolId: ToolId): string {
  if (toolId === "protect" || toolId === "unlock" || toolId === "removeMetadata") {
    return "security-tools";
  }
  if (toolId === "docxToPdf" || toolId === "pdfToDocx" || toolId === "pdfToJpg" || toolId === "pdfToText") {
    return "conversion-tools";
  }
  return "core-tools";
}

function buildCoveredNavigationGroups(site: SiteConfig): SiteConfig["navigation"]["groups"] {
  const groups = site.navigation.groups.map((group) => ({
    ...group,
    toolIds: dedupeToolIds(group.toolIds),
  }));
  const allToolIds = Object.keys(site.tools) as ToolId[];
  const existing = new Set(groups.flatMap((group) => group.toolIds));

  for (const toolId of allToolIds) {
    if (existing.has(toolId)) {
      continue;
    }

    const preferredGroup = groups.find((group) => group.id === getPreferredNavGroupId(toolId));
    if (preferredGroup) {
      preferredGroup.toolIds.push(toolId);
      existing.add(toolId);
      continue;
    }

    if (groups[0]) {
      groups[0].toolIds.push(toolId);
      existing.add(toolId);
    }
  }

  return groups;
}

function buildCoveredHomeSections(site: SiteConfig): SiteConfig["home"]["sections"] {
  const sections = site.home.sections.map((section) => ({
    ...section,
    toolIds: dedupeToolIds(section.toolIds),
  }));
  const allToolIds = Object.keys(site.tools) as ToolId[];
  const existing = new Set(sections.flatMap((section) => section.toolIds));

  for (const toolId of allToolIds) {
    if (existing.has(toolId)) {
      continue;
    }

    const preferredSection = sections.find((section) => section.id === getPreferredHomeSectionId(toolId));
    if (preferredSection) {
      preferredSection.toolIds.push(toolId);
      existing.add(toolId);
      continue;
    }

    if (sections[0]) {
      sections[0].toolIds.push(toolId);
      existing.add(toolId);
    }
  }

  return sections;
}

export function getToolIds(): ToolId[] {
  return Object.keys(siteConfig.tools) as ToolId[];
}

export function getToolConfig(toolId: ToolId): SiteToolConfig {
  return siteConfig.tools[toolId];
}

export function getResolvedTool(toolId: ToolId): ResolvedTool {
  return {
    id: toolId,
    ...getToolConfig(toolId),
  };
}

export function getToolPageCopy(toolId: ToolId): ToolPageCopy {
  return getToolConfig(toolId).page;
}

export function getReadyToolCount(): number {
  return getToolIds().filter((toolId) => getToolConfig(toolId).status === "ready").length;
}

export function getNavGroups(): NavGroup[] {
  return buildCoveredNavigationGroups(siteConfig).map((group) => ({
    id: group.id,
    label: group.label,
    items: group.toolIds.map((toolId) => {
      const tool = getToolConfig(toolId);

      return {
        id: toolId,
        label: tool.nav.label,
        description: tool.nav.description,
        to: tool.path,
        iconKey: tool.iconKey,
        status: tool.status,
      };
    }),
  }));
}

export function getHomeQuickStart(): HomeHeroTool[] {
  return homeConfig.quickStart.toolIds.slice(0, 4).map((toolId) => {
    const tool = getToolConfig(toolId);
    assert(tool.heroCard, `Tool "${toolId}" is missing heroCard copy.`);

    return {
      id: toolId,
      title: tool.heroCard.title,
      description: tool.heroCard.description,
      eyebrow: tool.heroCard.eyebrow,
      accentColor: tool.heroCard.accentColor,
      glow: tool.heroCard.glow,
      to: tool.path,
      iconKey: tool.iconKey,
      status: tool.status,
    };
  });
}

export function getHomeSections(): HomeSection[] {
  return buildCoveredHomeSections(siteConfig).map((section) => ({
    id: section.id,
    eyebrow: section.eyebrow,
    accent: section.accent,
    titleTail: section.titleTail,
    description: section.description,
    tools: section.toolIds.map((toolId) => {
      const tool = getToolConfig(toolId);

      return {
        id: toolId,
        title: tool.homeCard.title,
        description: tool.homeCard.description,
        to: tool.path,
        iconKey: tool.iconKey,
        status: tool.status,
      };
    }),
  }));
}

export function getFooterSections(): FooterSection[] {
  return footerConfig.sections.map((section) => ({
    title: section.title,
    links: section.toolIds.map((toolId) => {
      const tool = getToolConfig(toolId);

      return {
        label: tool.footerLabel || tool.nav.label,
        href: tool.path,
      };
    }),
  }));
}

export async function getPageSeo(pageKey: SeoPageKey): Promise<SeoPage> {
  const runtimeConfig = await readRuntimeSiteConfig();
  return runtimeConfig.seo.pages[pageKey] || sitePages[pageKey];
}

export function buildAbsoluteUrl(path: string): string {
  return new URL(path, `${siteUrl}/`).toString();
}

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const [runtimeConfig, contentLibrary] = await Promise.all([
    readRuntimeSiteConfig(),
    readRuntimeContentLibrary(),
  ]);
  const runtimePages = runtimeConfig.seo.pages;
  const lastModified = new Date();
  const runtimeEntries = Object.values(runtimePages)
    .filter((page) => page.index)
    .map((page) => ({
      url: buildAbsoluteUrl(page.path),
      lastModified,
      changeFrequency: page.changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: page.priority,
    }));

  const legalEntries = Object.values(contentLibrary.legalPages).map((page) => ({
    url: buildAbsoluteUrl(FIXED_LEGAL_SLUGS.has(page.slug) ? `/${page.slug}` : `/pages/${page.slug}`),
    lastModified,
    changeFrequency: "monthly" as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: 0.6,
  }));

  const faqEntries = contentLibrary.faq.length > 0
    ? [{
      url: buildAbsoluteUrl("/faq"),
      lastModified,
      changeFrequency: "weekly" as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: 0.7,
    }]
    : [];

  const guideEntries = contentLibrary.guides.map((guide) => ({
    url: buildAbsoluteUrl(`/guides/${guide.slug}`),
    lastModified,
    changeFrequency: "monthly" as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: 0.72,
  }));

  return [...runtimeEntries, ...legalEntries, ...faqEntries, ...guideEntries];
}

export async function buildMetadata(pageKey: SeoPageKey): Promise<Metadata> {
  const runtimeConfig = await getRuntimeSiteConfig();
  const branding = await getResolvedSiteBranding();
  const page = await getPageSeo(pageKey);
  const canonical = page.path || "/";
  const index = page.index;
  const follow = page.follow;
  const runtimeSocialConfig = runtimeConfig.seo.social || socialConfig;
  const runtimeSiteCategory = runtimeConfig.seo.site?.category || siteCategory;

  return {
    title: page.path === "/" ? { absolute: page.title } : page.title,
    description: page.description,
    keywords: buildKeywordList(page.keywords),
    category: runtimeSiteCategory,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: branding.name,
      type: "website",
      locale: siteLocale,
      images: [
        {
          url: runtimeSocialConfig.openGraphImagePath,
          alt: runtimeSocialConfig.imageAlt,
        },
      ],
    },
    twitter: {
      card: twitterCardType,
      title: page.title,
      description: page.description,
      images: [runtimeSocialConfig.twitterImagePath],
      site: runtimeSocialConfig.twitterSite,
      creator: runtimeSocialConfig.twitterCreator,
    },
    robots: buildRobotsMetadata(index, follow),
  };
}

export async function buildContentMetadata({
  title,
  description,
  path,
  keywords = [],
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Promise<Metadata> {
  const [runtimeConfig, branding] = await Promise.all([
    getRuntimeSiteConfig(),
    getResolvedSiteBranding(),
  ]);
  const runtimeSocialConfig = runtimeConfig.seo.social || socialConfig;
  const runtimeSiteCategory = runtimeConfig.seo.site?.category || siteCategory;

  return {
    title,
    description,
    keywords: buildKeywordList(keywords),
    category: runtimeSiteCategory,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: branding.name,
      type: "article",
      locale: siteLocale,
      images: [
        {
          url: runtimeSocialConfig.openGraphImagePath,
          alt: runtimeSocialConfig.imageAlt,
        },
      ],
    },
    twitter: {
      card: twitterCardType,
      title,
      description,
      images: [runtimeSocialConfig.twitterImagePath],
      site: runtimeSocialConfig.twitterSite,
      creator: runtimeSocialConfig.twitterCreator,
    },
    robots: defaultRobotsMetadata,
  };
}
