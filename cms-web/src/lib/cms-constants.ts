import type {
  AdProvider,
  AdScope,
  IntegrationKind,
  IntegrationScope,
  RuntimeEnvironment,
} from "./cms-types";

export const TOOL_OPTIONS = [
  { id: "merge", label: "Merge PDF" },
  { id: "split", label: "Split PDF" },
  { id: "rotate", label: "Rotate PDF" },
  { id: "extract", label: "Extract Pages" },
  { id: "watermark", label: "Watermark PDF" },
  { id: "rearrange", label: "Rearrange Pages" },
  { id: "imageToPdf", label: "Image to PDF" },
  { id: "compress", label: "Compress PDF" },
  { id: "protect", label: "Protect PDF" },
  { id: "unlock", label: "Unlock PDF" },
  { id: "docxToPdf", label: "DOCX to PDF" },
  { id: "pdfToDocx", label: "PDF to DOCX" },
  { id: "pdfToJpg", label: "PDF to JPG" },
  { id: "pdfToText", label: "PDF to Text" },
  { id: "removeMetadata", label: "Remove Metadata" },
  { id: "addPageNumbers", label: "Add Page Numbers" },
  { id: "repair", label: "Repair PDF" },
] as const;

export const REQUIRED_LEGAL_SLUGS = ["about", "contact", "privacy", "terms", "cookies", "ad-disclosure"] as const;

export const INTEGRATION_KIND_OPTIONS: Array<{ value: IntegrationKind; label: string }> = [
  { value: "google_analytics_ga4", label: "Google Analytics 4" },
  { value: "google_tag_manager", label: "Google Tag Manager" },
  { value: "google_search_console", label: "Google Search Console" },
  { value: "bing_webmaster", label: "Bing Webmaster" },
  { value: "microsoft_clarity", label: "Microsoft Clarity" },
  { value: "meta_pixel", label: "Meta Pixel" },
  { value: "adsense", label: "Google AdSense" },
  { value: "google_ad_manager", label: "Google Ad Manager" },
  { value: "custom_third_party_script", label: "Custom third-party script" },
  { value: "custom_verification_meta", label: "Custom verification meta" },
];

export const INTEGRATION_SCOPE_OPTIONS: Array<{ value: IntegrationScope; label: string }> = [
  { value: "all_public_routes", label: "All public routes" },
  { value: "home_only", label: "Homepage only" },
  { value: "guide_only", label: "Guide pages only" },
  { value: "faq_only", label: "FAQ only" },
  { value: "legal_only", label: "Legal pages only" },
  { value: "tool_pages", label: "Tool pages only" },
];

export const ENVIRONMENT_OPTIONS: Array<{ value: RuntimeEnvironment; label: string }> = [
  { value: "all", label: "All environments" },
  { value: "dev", label: "Development only" },
  { value: "prod", label: "Production only" },
];

export const AD_PROVIDER_OPTIONS: Array<{ value: AdProvider; label: string }> = [
  { value: "adsense_display", label: "AdSense display" },
  { value: "adsense_in_article", label: "AdSense in-article" },
  { value: "google_ad_manager", label: "Google Ad Manager" },
  { value: "custom_banner", label: "Custom banner" },
  { value: "custom_card", label: "Custom card" },
  { value: "placeholder", label: "Placeholder only" },
];

export const AD_SCOPE_OPTIONS: Array<{ value: AdScope; label: string }> = [
  { value: "home", label: "Homepage" },
  { value: "guide", label: "Guide pages" },
  { value: "faq", label: "FAQ pages" },
  { value: "legal", label: "Legal pages" },
  { value: "tool_page", label: "Tool pages" },
  { value: "support", label: "Support pages" },
  { value: "footer", label: "Footer" },
];

export const AD_SLOT_PRESETS = [
  { id: "home_before_title", label: "Homepage post-hero primary", scope: "home", description: "Appears in the post-hero ad rail as the primary homepage banner." },
  { id: "home_after_title", label: "Homepage post-hero secondary", scope: "home", description: "Appears in the post-hero ad rail as the secondary homepage banner." },
  { id: "home_right_rail", label: "Homepage quick start rail", scope: "home", description: "Appears under the quick-start cards in the hero-right panel." },
  { id: "home_between_1", label: "Homepage between section 1 and 2", scope: "home", description: "Appears between the first and second tool sections." },
  { id: "home_between_2", label: "Homepage between section 2 and 3", scope: "home", description: "Appears between the second and third tool sections." },
  { id: "home_mid", label: "Homepage bottom banner", scope: "home", description: "Appears after the tool sections." },
  { id: "guide_before_title", label: "Guide before title", scope: "guide", description: "Appears above a guide article title." },
  { id: "guide_sidebar", label: "Guide sidebar", scope: "guide", description: "Appears beside a guide article." },
  { id: "guide_after_content", label: "Guide after content", scope: "guide", description: "Appears after a guide article." },
  { id: "guides_index_before_title", label: "Guide list before title", scope: "guide", description: "Appears above the guides index title." },
  { id: "guides_index_after_grid", label: "Guide list after grid", scope: "guide", description: "Appears after the guides grid." },
  { id: "legal_before_title", label: "Legal page before title", scope: "legal", description: "Appears above a legal page title." },
  { id: "legal_sidebar", label: "Legal page sidebar", scope: "legal", description: "Appears in the legal page sidebar." },
  { id: "legal_after_content", label: "Legal page after content", scope: "legal", description: "Appears after legal page content." },
  { id: "faq_before_title", label: "FAQ before title", scope: "faq", description: "Appears above the FAQ title." },
  { id: "faq_after_content", label: "FAQ after content", scope: "faq", description: "Appears after the FAQ entries." },
  { id: "tool_before_title", label: "Tool page before title", scope: "tool_page", description: "Appears above a tool page header." },
  { id: "tool_after_header", label: "Tool page after header", scope: "tool_page", description: "Appears below a tool page intro." },
  { id: "tool_after_panel", label: "Tool page after panel", scope: "tool_page", description: "Appears below a tool workflow panel." },
  { id: "footer_promo", label: "Footer promo", scope: "footer", description: "Appears at the top of the site footer." },
] as const;

export interface AdSlotSizeProfile {
  desktop: string;
  tablet: string;
  mobile: string;
  fallback?: string[];
}

export const AD_SLOT_SIZE_PROFILES: Record<string, AdSlotSizeProfile> = {
  home_before_title: { desktop: "970x250", tablet: "728x90", mobile: "320x100" },
  home_after_title: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  home_right_rail: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  home_between_1: { desktop: "970x250", tablet: "728x90", mobile: "320x100" },
  home_between_2: { desktop: "970x250", tablet: "728x90", mobile: "320x100" },
  home_mid: { desktop: "970x250", tablet: "728x90", mobile: "320x100" },
  guide_before_title: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  guide_sidebar: { desktop: "300x600", tablet: "300x250", mobile: "320x100", fallback: ["300x250"] },
  guide_after_content: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  guides_index_before_title: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  guides_index_after_grid: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  legal_before_title: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  legal_sidebar: { desktop: "300x600", tablet: "300x250", mobile: "320x100", fallback: ["300x250"] },
  legal_after_content: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  faq_before_title: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  faq_after_content: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  tool_before_title: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  tool_after_header: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  tool_after_panel: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
  footer_promo: { desktop: "728x90", tablet: "728x90", mobile: "320x100" },
};

export const AD_LAYOUT_GUIDE = [
  {
    id: "home",
    title: "Homepage",
    description: "Post-hero rail, section breaks, and bottom banner placements.",
    slots: ["home_before_title", "home_after_title", "home_right_rail", "home_between_1", "home_between_2", "home_mid"],
  },
  {
    id: "guides",
    title: "Guides",
    description: "Guide list page and guide detail page placements.",
    slots: ["guides_index_before_title", "guides_index_after_grid", "guide_before_title", "guide_sidebar", "guide_after_content"],
  },
  {
    id: "faq",
    title: "FAQ",
    description: "Placements around FAQ heading and content.",
    slots: ["faq_before_title", "faq_after_content"],
  },
  {
    id: "legal",
    title: "Legal Pages",
    description: "Placements around legal title/content and legal sidebar.",
    slots: ["legal_before_title", "legal_sidebar", "legal_after_content"],
  },
  {
    id: "tools",
    title: "Tool Pages",
    description: "Placements around each tool workflow page.",
    slots: ["tool_before_title", "tool_after_header", "tool_after_panel"],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Global footer promo placement.",
    slots: ["footer_promo"],
  },
] as const;
