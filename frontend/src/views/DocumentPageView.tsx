import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import AdSlot from "@/components/AdSlot";
import type { AdScope } from "@/lib/cms-runtime";
import MainLayout from "@/layouts/MainLayout";

interface ContentSection {
  id: string;
  heading: string;
  body: string;
}

interface DocumentPageViewProps {
  eyebrow: string;
  title: string;
  description: string;
  body: string;
  updatedAt?: string;
  sections?: ContentSection[];
  cta?: {
    title: string;
    description: string;
    label: string;
    href: string;
  } | null;
  supportEmail?: string;
  backHref?: string;
  backLabel?: string;
  adScope?: AdScope;
  adCategories?: string[];
  adSlotPrefix?: string;
}

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeRichText(value: string): string {
  return sanitizeHtml(value, {
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
  }).trim();
}

function toPlainText(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/\s+/g, " ").trim();
}

function formatRichBody(value: string): string {
  if (!value.trim()) {
    return "";
  }

  if (/<[a-z][\s\S]*>/i.test(value)) {
    return sanitizeRichText(value);
  }

  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function formatUpdatedAt(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function buildFallbackSections(title: string, body: string): ContentSection[] {
  if (/<[a-z][\s\S]*>/i.test(body)) {
    return [
      {
        id: "section-1",
        heading: title,
        body,
      },
    ];
  }

  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  return paragraphs.map((paragraph, index) => ({
    id: `section-${index + 1}`,
    heading: index === 0 ? title : `Section ${index + 1}`,
    body: paragraph,
  }));
}

function normalizeSectionId(value: string, index: number): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return cleaned || "section-" + (index + 1);
}

function normalizeSections(title: string, body: string, sections: ContentSection[] | undefined): ContentSection[] {
  if (!sections || sections.length === 0) {
    return buildFallbackSections(title, body);
  }

  const normalized = sections
    .map((section, index) => {
      const heading = toPlainText(section.heading || "") || `Section ${index + 1}`;
      const richBody = sanitizeRichText(section.body || "");
      const plainBody = toPlainText(richBody);

      return {
        id: normalizeSectionId(section.id || heading, index),
        heading,
        body: richBody,
        plainBody,
      };
    })
    .filter((section) => section.plainBody.length > 0);

  if (normalized.length === 0) {
    return buildFallbackSections(title, body);
  }

  const shortBodyCount = normalized.filter((section) => section.plainBody.length < 40).length;
  const looksFragmented = normalized.length >= 8 && shortBodyCount / normalized.length > 0.6;
  if (looksFragmented) {
    return buildFallbackSections(title, body);
  }

  return normalized.map(({ id, heading, body: sectionBody }) => ({
    id,
    heading,
    body: sectionBody,
  }));
}

export default function DocumentPageView({
  eyebrow,
  title,
  description,
  body,
  updatedAt,
  sections,
  cta,
  supportEmail,
  backHref,
  backLabel = "Back",
  adScope = "legal",
  adCategories = ["legal"],
  adSlotPrefix = "legal",
}: DocumentPageViewProps) {
  const articleSections = normalizeSections(title, body, sections);
  const updatedLabel = formatUpdatedAt(updatedAt);
  const showSidebar = articleSections.length >= 2 && articleSections.length <= 6;

  return (
    <MainLayout>
      <section className="app-shell content-page-shell relative">
        <AdSlot
          slotId={`${adSlotPrefix}_before_title`}
          scope={adScope}
          categories={adCategories}
          className="mb-6"
        />

        {backHref ? (
          <Link className="content-page-back-link" href={backHref}>
            {backLabel}
          </Link>
        ) : null}

        <div className="content-page-header animate-fade-in-up">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          {updatedLabel ? (
            <div className="content-page-meta">
              <span>Published from CMS</span>
              <span>Updated {updatedLabel}</span>
            </div>
          ) : null}
        </div>

        <div className="content-page-layout animate-fade-in-up-delay-1">
          {showSidebar ? (
            <aside className="glass-card content-page-sidebar">
              <p>On this page</p>
              <nav className="content-page-toc">
                {articleSections.map((section) => (
                  <a href={`#${section.id}`} key={section.id}>
                    {section.heading}
                  </a>
                ))}
              </nav>

              <AdSlot
                slotId={`${adSlotPrefix}_sidebar`}
                scope={adScope}
                categories={adCategories}
                className="mt-5"
              />
            </aside>
          ) : null}

          <article className="glass-card content-page-panel">
            {!showSidebar ? (
              <AdSlot
                slotId={`${adSlotPrefix}_sidebar`}
                scope={adScope}
                categories={adCategories}
                className="mb-5"
              />
            ) : null}

            <div className="content-rich-text">
              {articleSections.map((section) => (
                <section className="content-rich-section" key={section.id} id={section.id}>
                  <h2>{section.heading}</h2>
                  <div
                    className="content-rich-html"
                    dangerouslySetInnerHTML={{ __html: formatRichBody(section.body) }}
                  />
                </section>
              ))}
            </div>

            {cta || supportEmail ? (
              <div className="content-page-cta">
                <div>
                  <p>{cta?.title || "Need help with a policy or account question?"}</p>
                  <h3>{cta?.description || "Contact support if you need clarification before using a tool or sharing a document."}</h3>
                </div>
                <div className="content-page-cta-actions">
                  {cta ? (
                    <Link href={cta.href} className="btn-accent">
                      {cta.label}
                    </Link>
                  ) : null}
                  {supportEmail ? (
                    <a className="btn-secondary" href={`mailto:${supportEmail}`}>
                      Email support
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            <AdSlot
              slotId={`${adSlotPrefix}_after_content`}
              scope={adScope}
              categories={adCategories}
              className="mt-6"
            />
          </article>
        </div>
      </section>
    </MainLayout>
  );
}
