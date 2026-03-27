import type {
  AdsDraftState,
  ContentLibraryState,
  HomepageDraft,
  LegalPageDocument,
  RuntimeAdPlacement,
  RuntimeIntegration,
  SeoDraft,
  SiteShellDraft,
  ToolDraft,
  ToolDraftMap,
} from "./cms-types";
import { AD_SLOT_PRESETS, TOOL_OPTIONS } from "./cms-constants";

export function createId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${random}`;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => String(entry)).filter(Boolean);
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function splitLines(value: string): string[] {
  return uniqueStrings(value.split(/\n|,/).map((entry) => entry.trim()).filter(Boolean));
}

export function joinLines(values: string[]): string {
  return values.join("\n");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not published yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatLabel(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "#8b5cf6";
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function createEmptySiteShellDraft(): SiteShellDraft {
  return {
    branding: {
      name: "",
      shortName: "",
      legalName: "",
      authorName: "",
    },
    contact: {
      email: "",
    },
    organization: {
      profiles: [],
    },
    system: {},
    ui: {},
    navigation: {
      homeLabel: "Home",
      groups: [],
    },
    footer: {
      eyebrow: "",
      headline: "",
      description: "",
      sections: [],
      support: {
        title: "",
        description: "",
        contactLabel: "",
      },
      bottomNote: "",
    },
  };
}

export function createEmptyHomepageDraft(): HomepageDraft {
  return {
    home: {
      sectionCountSuffix: "tools",
      hero: {
        badgeCountSuffix: "Tools Ready",
        titleLead: "",
        titleHighlight: "",
        emphasisColor: "#8b5cf6",
        titleTail: "",
        description: "",
        pills: [],
        primaryActionPrefix: "Open",
        secondaryActionLabel: "Browse all tools",
        readyToolsSuffix: "",
      },
      quickStart: {
        eyebrow: "Quick start",
        title: "",
        countSuffix: "cards",
        actionLabel: "Open tool",
        toolIds: [],
      },
      sections: [],
    },
  };
}

export function createEmptyToolDraft(toolId: string): ToolDraft {
  const label = TOOL_OPTIONS.find((tool) => tool.id === toolId)?.label || formatLabel(toolId);

  return {
    path: `/${toolId}`,
    seoPageKey: toolId,
    iconKey: toolId,
    status: "ready",
    nav: {
      label,
      description: "",
    },
    homeCard: {
      title: label,
      description: "",
    },
    footerLabel: label,
    heroCard: {
      eyebrow: "Quick start",
      title: label,
      description: "",
      accentColor: "#8b5cf6",
      glow: "",
    },
    page: {
      eyebrow: "Tool",
      title: label,
      description: "",
    },
  };
}

export function createEmptySeoDraft(): SeoDraft {
  return {
    seo: {
      site: {
        defaultTitle: "",
        titleTemplate: "%s",
        description: "",
        keywords: [],
        category: "",
        language: "en",
        locale: "en_US",
      },
      pages: {},
    },
  };
}

export function createEmptyIntegration(): RuntimeIntegration {
  return {
    id: createId("integration"),
    kind: "google_analytics_ga4",
    enabled: true,
    scope: "all_public_routes",
    environment: "all",
    notes: "",
    lastPublishedAt: null,
    config: {
      measurementId: "",
    },
  };
}

export function createEmptyAdPlacement(): RuntimeAdPlacement {
  return {
    id: createId("ad"),
    name: "New placement",
    provider: "adsense_display",
    enabled: false,
    slotId: "home_before_title",
    scopes: ["home"],
    categories: ["homepage"],
    environment: "all",
    notes: "",
    lastPublishedAt: null,
    config: {
      publisherId: "",
      adSlot: "",
      format: "auto",
    },
  };
}

export function createEmptyLegalPage(slug: string): LegalPageDocument {
  return {
    slug,
    eyebrow: "Policy",
    title: formatLabel(slug),
    description: "",
    body: "",
    sections: [
      {
        id: createId("section"),
        heading: "Overview",
        body: "",
      },
    ],
    cta: {
      title: "",
      description: "",
      label: "",
      href: "",
    },
  };
}

export function createEmptyGuide() {
  return {
    id: createId("guide"),
    slug: "new-guide",
    title: "New guide",
    excerpt: "",
    category: "general",
    body: "",
  };
}

export function sanitizeSiteShellDraft(value: unknown): SiteShellDraft {
  const candidate = asRecord(value);
  const branding = asRecord(candidate.branding);
  const contact = asRecord(candidate.contact);
  const organization = asRecord(candidate.organization);
  const navigation = asRecord(candidate.navigation);
  const footer = asRecord(candidate.footer);
  const footerSupport = asRecord(footer.support);

  return {
    branding: {
      name: asString(branding.name),
      shortName: asString(branding.shortName),
      legalName: asString(branding.legalName),
      authorName: asString(branding.authorName),
    },
    contact: {
      email: asString(contact.email),
    },
    organization: {
      profiles: asStringArray(organization.profiles),
    },
    system: asRecord(candidate.system),
    ui: asRecord(candidate.ui),
    navigation: {
      homeLabel: asString(navigation.homeLabel, "Home"),
      groups: Array.isArray(navigation.groups)
        ? navigation.groups.map((group) => {
          const item = asRecord(group);
          return {
            id: asString(item.id, createId("nav")),
            label: asString(item.label),
            toolIds: asStringArray(item.toolIds),
          };
        })
        : [],
    },
    footer: {
      eyebrow: asString(footer.eyebrow),
      headline: asString(footer.headline),
      description: asString(footer.description),
      sections: Array.isArray(footer.sections)
        ? footer.sections.map((section) => {
          const item = asRecord(section);
          return {
            id: asString(item.id, createId("footer")),
            title: asString(item.title),
            toolIds: asStringArray(item.toolIds),
          };
        })
        : [],
      support: {
        title: asString(footerSupport.title),
        description: asString(footerSupport.description),
        contactLabel: asString(footerSupport.contactLabel),
      },
      bottomNote: asString(footer.bottomNote),
    },
  };
}

export function sanitizeHomepageDraft(value: unknown): HomepageDraft {
  const candidate = asRecord(value);
  const home = asRecord(candidate.home);
  const hero = asRecord(home.hero);
  const quickStart = asRecord(home.quickStart);

  return {
    home: {
      sectionCountSuffix: asString(home.sectionCountSuffix, "tools"),
      hero: {
        badgeCountSuffix: asString(hero.badgeCountSuffix, "Tools Ready"),
        titleLead: asString(hero.titleLead),
        titleHighlight: asString(hero.titleHighlight),
        emphasisColor: normalizeHexColor(asString(hero.emphasisColor, "#8b5cf6")),
        titleTail: asString(hero.titleTail),
        description: asString(hero.description),
        pills: asStringArray(hero.pills),
        primaryActionPrefix: asString(hero.primaryActionPrefix, "Open"),
        secondaryActionLabel: asString(hero.secondaryActionLabel, "Browse all tools"),
        readyToolsSuffix: asString(hero.readyToolsSuffix),
      },
      quickStart: {
        eyebrow: asString(quickStart.eyebrow, "Quick start"),
        title: asString(quickStart.title),
        countSuffix: asString(quickStart.countSuffix, "cards"),
        actionLabel: asString(quickStart.actionLabel, "Open tool"),
        toolIds: asStringArray(quickStart.toolIds),
      },
      sections: Array.isArray(home.sections)
        ? home.sections.map((section) => {
          const item = asRecord(section);
          return {
            id: asString(item.id, createId("section")),
            eyebrow: asString(item.eyebrow),
            accent: asString(item.accent),
            titleTail: asString(item.titleTail),
            description: asString(item.description),
            toolIds: asStringArray(item.toolIds),
          };
        })
        : [],
    },
  };
}

export function sanitizeToolsDraft(value: unknown): ToolDraftMap {
  const candidate = asRecord(value);
  const result: ToolDraftMap = {};
  for (const tool of TOOL_OPTIONS) {
    const item = asRecord(candidate[tool.id]);
    const nav = asRecord(item.nav);
    const homeCard = asRecord(item.homeCard);
    const heroCard = asRecord(item.heroCard);
    const page = asRecord(item.page);
    result[tool.id] = {
      path: asString(item.path, `/${tool.id}`),
      seoPageKey: asString(item.seoPageKey, tool.id),
      iconKey: asString(item.iconKey, tool.id),
      status: asString(item.status, "ready") as ToolDraft["status"],
      nav: {
        label: asString(nav.label, tool.label),
        description: asString(nav.description),
      },
      homeCard: {
        title: asString(homeCard.title, tool.label),
        description: asString(homeCard.description),
      },
      footerLabel: asString(item.footerLabel, tool.label),
      heroCard: {
        eyebrow: asString(heroCard.eyebrow, "Quick start"),
        title: asString(heroCard.title, tool.label),
        description: asString(heroCard.description),
        accentColor: normalizeHexColor(asString(heroCard.accentColor, "#8b5cf6")),
        glow: asString(heroCard.glow),
      },
      page: {
        eyebrow: asString(page.eyebrow, "Tool"),
        title: asString(page.title, tool.label),
        description: asString(page.description),
      },
    };
  }
  return result;
}

export function sanitizeSeoDraft(value: unknown): SeoDraft {
  const candidate = asRecord(value);
  const seo = asRecord(candidate.seo);
  const site = asRecord(seo.site);
  const pages = asRecord(seo.pages);

  return {
    seo: {
      site: {
        defaultTitle: asString(site.defaultTitle),
        titleTemplate: asString(site.titleTemplate, "%s"),
        description: asString(site.description),
        keywords: asStringArray(site.keywords),
        category: asString(site.category),
        language: asString(site.language, "en"),
        locale: asString(site.locale, "en_US"),
      },
      pages: Object.fromEntries(
        Object.entries(pages).map(([key, rawValue]) => {
          const entry = asRecord(rawValue);
          return [
            key,
            {
              title: asString(entry.title),
              description: asString(entry.description),
              path: asString(entry.path, `/${key}`),
              keywords: asStringArray(entry.keywords),
              index: asBoolean(entry.index, true),
              follow: asBoolean(entry.follow, true),
              priority: asNumber(entry.priority, 0.7),
              changeFrequency: asString(entry.changeFrequency, "weekly"),
            },
          ];
        }),
      ),
    },
  };
}

export function sanitizeIntegrations(value: unknown): RuntimeIntegration[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const item = asRecord(entry);
    return {
      id: asString(item.id, createId("integration")),
      kind: asString(item.kind, "google_analytics_ga4") as RuntimeIntegration["kind"],
      enabled: asBoolean(item.enabled, true),
      scope: asString(item.scope, "all_public_routes") as RuntimeIntegration["scope"],
      environment: asString(item.environment, "all") as RuntimeIntegration["environment"],
      notes: asString(item.notes),
      lastPublishedAt: asString(item.lastPublishedAt) || null,
      config: Object.fromEntries(
        Object.entries(asRecord(item.config)).map(([key, rawValue]) => [key, typeof rawValue === "boolean" ? rawValue : String(rawValue)]),
      ),
    };
  });
}

export function sanitizeAdsDraft(value: unknown): AdsDraftState {
  const candidate = asRecord(value);
  const placements = Array.isArray(candidate.adPlacements) ? candidate.adPlacements : [];
  const adsCandidate = asRecord(candidate.ads);
  const blueprintCandidate = asRecord(adsCandidate.blueprint);
  const rawBlueprintEnabled = candidate.blueprintEnabled;
  const defaultBlueprintEnabled = process.env.NODE_ENV !== "production";

  return {
    adPlacements: placements.map((entry) => {
      const item = asRecord(entry);
      const rawProvider = asString(item.provider, "adsense_display");
      const normalizedProvider = rawProvider === "custom_embed" ? "custom_card" : rawProvider;
      const normalizedScopes = asStringArray(item.scopes);
      return {
        id: asString(item.id, createId("ad")),
        name: asString(item.name, "New placement"),
        provider: normalizedProvider as RuntimeAdPlacement["provider"],
        enabled: asBoolean(item.enabled, false),
        slotId: asString(item.slotId, "home_before_title"),
        scopes: (normalizedScopes.length > 0 ? normalizedScopes : ["home"]) as RuntimeAdPlacement["scopes"],
        categories: asStringArray(item.categories),
        environment: asString(item.environment, "all") as RuntimeAdPlacement["environment"],
        notes: asString(item.notes),
        lastPublishedAt: asString(item.lastPublishedAt) || null,
        config: Object.fromEntries(
          Object.entries(asRecord(item.config)).map(([key, rawValue]) => [key, typeof rawValue === "boolean" ? rawValue : String(rawValue)]),
        ),
      };
    }),
    adsTxtLines: asStringArray(candidate.adsTxtLines),
    blueprintEnabled: typeof rawBlueprintEnabled === "boolean"
      ? rawBlueprintEnabled
      : asBoolean(blueprintCandidate.enabled, defaultBlueprintEnabled),
  };
}

export function sanitizeContentLibrary(value: unknown): ContentLibraryState {
  const candidate = asRecord(value);
  const legalPages = asRecord(candidate.legalPages);

  return {
    version: asNumber(candidate.version, 1),
    updatedAt: asString(candidate.updatedAt, new Date().toISOString()),
    publishedAt: asString(candidate.publishedAt) || null,
    legalPages: Object.fromEntries(
      Object.entries(legalPages).map(([slug, rawPage]) => {
        const page = asRecord(rawPage);
        const cta = asRecord(page.cta);
        return [
          slug,
          {
            slug,
            eyebrow: asString(page.eyebrow),
            title: asString(page.title, formatLabel(slug)),
            description: asString(page.description),
            body: asString(page.body),
            updatedAt: asString(page.updatedAt),
            sections: Array.isArray(page.sections)
              ? page.sections.map((section) => {
                const item = asRecord(section);
                return {
                  id: asString(item.id, createId("section")),
                  heading: asString(item.heading, "Overview"),
                  body: asString(item.body),
                };
              })
              : [],
            cta: Object.keys(cta).length > 0
              ? {
                title: asString(cta.title),
                description: asString(cta.description),
                label: asString(cta.label),
                href: asString(cta.href),
              }
              : null,
          },
        ];
      }),
    ),
    faq: Array.isArray(candidate.faq)
      ? candidate.faq.map((entry) => {
        const item = asRecord(entry);
        return {
          id: asString(item.id, createId("faq")),
          question: asString(item.question),
          answer: asString(item.answer),
        };
      })
      : [],
    guides: Array.isArray(candidate.guides)
      ? candidate.guides.map((entry) => {
        const item = asRecord(entry);
        return {
          id: asString(item.id, createId("guide")),
          slug: asString(item.slug, "new-guide"),
          title: asString(item.title, "New guide"),
          excerpt: asString(item.excerpt),
          category: asString(item.category, "general"),
          body: asString(item.body),
        };
      })
      : [],
  };
}

export function getAdPreset(slotId: string) {
  return AD_SLOT_PRESETS.find((item) => item.id === slotId) || null;
}
