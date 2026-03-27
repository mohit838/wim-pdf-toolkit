import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import MainLayout from "@/layouts/MainLayout";
import type { GuideEntry } from "@/lib/cms-runtime";

interface GuidesPageViewProps {
  title: string;
  description: string;
  guides: GuideEntry[];
}

function groupByCategory(guides: GuideEntry[]): Array<{ category: string; items: GuideEntry[] }> {
  const map = new Map<string, GuideEntry[]>();

  for (const guide of guides) {
    const key = guide.category?.trim() || "General";
    const bucket = map.get(key) || [];
    bucket.push(guide);
    map.set(key, bucket);
  }

  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

export default function GuidesPageView({
  title,
  description,
  guides,
}: GuidesPageViewProps) {
  const featured = guides[0] || null;
  const grouped = groupByCategory(guides);

  return (
    <MainLayout>
      <section className="app-shell content-page-shell guide-index-shell relative">
        <AdSlot
          slotId="guides_index_before_title"
          scope="guide"
          categories={["guides"]}
          className="mb-6"
        />

        <div className="content-page-header animate-fade-in-up">
          <p>Guides</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {featured ? (
          <article className="glass-card content-page-panel guide-featured-panel animate-fade-in-up-delay-1">
            <div className="content-guide-card">
              <p className="content-guide-category">Featured guide</p>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="guide-featured-actions">
                <Link href={`/guides/${featured.slug}`} className="btn-accent text-xs px-3 py-1.5">
                  Read featured guide
                </Link>
                <Link href="#guides-sections" className="btn-secondary text-sm">
                  Browse all categories
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        <div className="guide-sections mt-8 space-y-8 animate-fade-in-up-delay-1" id="guides-sections">
          {grouped.map((group) => (
            <section key={group.category} className="guide-category-section">
              <div className="content-page-header guide-section-header">
                <p>Guide category</p>
                <h2>{group.category}</h2>
              </div>
              <div className="content-card-grid guide-cards-grid">
                {group.items.map((guide) => (
                  <article className="glass-card content-page-panel" key={guide.id}>
                    <div className="content-guide-card">
                      <p className="content-guide-category">{guide.category}</p>
                      <h3>{guide.title}</h3>
                      <p>{guide.excerpt}</p>
                      <Link href={`/guides/${guide.slug}`} className="btn-accent text-xs px-3 py-1.5">
                        Read guide
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <AdSlot
          slotId="guides_index_after_grid"
          scope="guide"
          categories={["guides"]}
          className="mt-6"
        />
      </section>
    </MainLayout>
  );
}
