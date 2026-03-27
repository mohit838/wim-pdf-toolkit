import type { PropsWithChildren } from "react";
import Link from "next/link";
import {
  getResolvedBackButtonCopy,
  getResolvedContactEmail,
  getResolvedFooterSectionsWithConfig,
  getResolvedFooterResourceLinks,
  getResolvedHomeLabel,
  getResolvedNavGroups,
  getResolvedSiteBranding,
} from "@/app/site";
import AdSlot from "@/components/AdSlot";
import BackButton from "../components/BackButton";
import BrandMark from "../components/BrandMark";
import Navbar from "../components/Navbar";

export default async function MainLayout({ children }: PropsWithChildren) {
  const currentYear = new Date().getFullYear();
  const [
    branding,
    contactEmail,
    homeLabel,
    navGroups,
    footerConfig,
    backButtonCopy,
    resourceLinks,
  ] = await Promise.all([
    getResolvedSiteBranding(),
    getResolvedContactEmail(),
    getResolvedHomeLabel(),
    getResolvedNavGroups(),
    getResolvedFooterSectionsWithConfig(),
    getResolvedBackButtonCopy(),
    getResolvedFooterResourceLinks(),
  ]);
  const footerSections = footerConfig.sections;
  const footerCopy = footerConfig.footer;
  const resourceColumnCount =
    resourceLinks.length >= 9 ? 3 : resourceLinks.length >= 5 ? 2 : 1;
  const linksPerResourceColumn =
    resourceColumnCount > 0 ? Math.ceil(resourceLinks.length / resourceColumnCount) : 0;
  const resourceLinkColumns = Array.from({ length: resourceColumnCount }, (_, index) =>
    resourceLinks.slice(index * linksPerResourceColumn, (index + 1) * linksPerResourceColumn),
  ).filter((column) => column.length > 0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "var(--bg-body)",
        color: "var(--text-primary)",
      }}
    >
      <Navbar navGroups={navGroups} homeLabel={homeLabel} siteName={branding.name} />
      <main className="flex-1">
        <BackButton label={backButtonCopy.label} ariaLabel={backButtonCopy.ariaLabel} />
        {children}
      </main>
      <footer
        suppressHydrationWarning
        className="mt-12"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background:
            "linear-gradient(180deg, rgba(9,13,24,0.72) 0%, rgba(7,11,21,0.95) 100%)",
        }}
      >
        <div className="app-shell py-8">
          <AdSlot
            slotId="footer_promo"
            scope="footer"
            categories={["footer"]}
            className="mb-6 mx-auto w-full max-w-[728px]"
          />

          <div className="mx-auto w-full max-w-[84rem]">
            <div className="grid items-start gap-8 lg:grid-cols-12">
              <section className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <BrandMark size={42} />
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {footerCopy.eyebrow}
                  </p>
                  <p
                    className="text-lg font-semibold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {branding.name}
                  </p>
                </div>
              </div>
              <p
                className="mt-5 text-xl font-semibold leading-8"
                style={{ color: "var(--text-primary)" }}
              >
                {footerCopy.headline}
              </p>
              <p
                className="mt-3 max-w-lg text-sm leading-7"
                style={{ color: "var(--text-secondary)" }}
              >
                {footerCopy.description}
              </p>
              </section>

              <div className="grid gap-6 sm:grid-cols-2 lg:col-span-5 xl:grid-cols-3">
                {footerSections.map((section) => (
                  <section key={section.title} className="min-w-0">
                <h2
                  className="text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {section.title}
                </h2>
                <div className="mt-4 flex flex-col gap-3">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-white"
                      style={{
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                    </div>
                  </section>
                ))}
              </div>

              <section className="lg:col-span-3 lg:pl-2">
              <h2
                className="text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--text-muted)" }}
              >
                {footerCopy.support.title}
              </h2>
              <p
                className="mt-3 max-w-md text-sm leading-7"
                style={{ color: "var(--text-secondary)" }}
              >
                {footerCopy.support.description}
              </p>
              <div
                className="mt-4 w-full max-w-md rounded-3xl p-5"
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {footerCopy.support.contactLabel}
                </p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-3 block text-base font-semibold leading-7 transition-colors duration-200 sm:text-lg"
                  style={{
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    wordBreak: "break-word",
                  }}
                >
                  {contactEmail}
                </a>
              </div>
              </section>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[84rem]">
            {resourceLinks.length ? (
              <div
                className="mt-7 border-t pt-5"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Trust and policy pages
                </p>
                <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                  {resourceLinkColumns.map((column, columnIndex) => (
                    <div key={`resource-column-${columnIndex}`} className="grid gap-2">
                      {column.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-sm transition-colors duration-200 hover:text-white"
                          style={{
                            color: "var(--text-secondary)",
                            textDecoration: "none",
                          }}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div
              className="mt-8 border-t pt-5 text-sm"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <p style={{ color: "var(--text-muted)" }}>
                © {currentYear} {branding.legalName}. {footerCopy.bottomNote}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
