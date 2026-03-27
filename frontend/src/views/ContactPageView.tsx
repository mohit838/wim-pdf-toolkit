import Link from "next/link";
import sanitizeHtml from "sanitize-html";
import ContactFormCard from "@/components/ContactFormCard";
import MainLayout from "@/layouts/MainLayout";

interface ContentSection {
  id: string;
  heading: string;
  body: string;
}

interface ContactPageViewProps {
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
  supportEmail: string;
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

function buildSections(title: string, body: string, sections: ContentSection[] | undefined): ContentSection[] {
  if (sections && sections.length > 0) {
    return sections;
  }

  return [
    {
      id: "overview",
      heading: title,
      body,
    },
  ];
}

export default function ContactPageView({
  eyebrow,
  title,
  description,
  body,
  updatedAt,
  sections,
  cta,
  supportEmail,
}: ContactPageViewProps) {
  const contactSections = buildSections(title, body, sections);
  const updatedLabel = formatUpdatedAt(updatedAt);

  return (
    <MainLayout>
      <section className="app-shell content-page-shell contact-page-shell relative">
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

        <div className="contact-page-layout animate-fade-in-up-delay-1 grid gap-4 xl:gap-6 lg:grid-cols-12">
          <div className="contact-page-main-column lg:col-span-8">
            <ContactFormCard supportEmail={supportEmail} />

            <div className="glass-card contact-content-card">
              <div className="content-rich-text">
                {contactSections.map((section) => (
                  <section className="content-rich-section" id={section.id} key={section.id}>
                    <h2>{section.heading}</h2>
                    <div
                      className="content-rich-html"
                      dangerouslySetInnerHTML={{ __html: sanitizeRichText(section.body) }}
                    />
                  </section>
                ))}
              </div>
            </div>
          </div>

          <div className="contact-page-side-columns grid gap-4 xl:gap-6 lg:col-span-4 grid-cols-1">
            <aside className="glass-card contact-page-sidebar contact-page-sidebar-direct">
              <div className="contact-sidebar-block">
                <p>Direct support</p>
                <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                <span>
                  Use email when you need to share a longer report, policy question, or partnership request outside
                  the form.
                </span>
              </div>
            </aside>

            <aside className="glass-card contact-page-sidebar contact-page-sidebar-info">
              <div className="contact-sidebar-block">
                <p>Helpful details</p>
                <ul>
                  <li>Which tool or page you were using</li>
                  <li>What happened before the issue appeared</li>
                  <li>Approximate time and device/browser used</li>
                  <li>Any business or advertising context if relevant</li>
                </ul>
              </div>

              {cta ? (
                <div className="contact-sidebar-block contact-sidebar-cta">
                  <p>{cta.title}</p>
                  <span>{cta.description}</span>
                  <Link className="btn-secondary" href={cta.href}>
                    {cta.label}
                  </Link>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
