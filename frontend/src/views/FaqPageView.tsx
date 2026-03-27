import MainLayout from "@/layouts/MainLayout";
import AdSlot from "@/components/AdSlot";
import type { FaqEntry } from "@/lib/cms-runtime";

interface FaqPageViewProps {
  title: string;
  description: string;
  entries: FaqEntry[];
}

export default function FaqPageView({ title, description, entries }: FaqPageViewProps) {
  return (
    <MainLayout>
      <section className="app-shell content-page-shell relative">
        <AdSlot
          slotId="faq_before_title"
          scope="faq"
          categories={["faq"]}
          className="mb-6"
        />

        <div className="content-page-header animate-fade-in-up">
          <p>FAQ</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="content-stack animate-fade-in-up-delay-1">
          {entries.map((entry) => (
            <article className="glass-card content-page-panel" key={entry.id}>
              <div className="content-faq-item">
                <h2>{entry.question}</h2>
                <p>{entry.answer}</p>
              </div>
            </article>
          ))}
        </div>

        <AdSlot
          slotId="faq_after_content"
          scope="faq"
          categories={["faq"]}
          className="mt-6"
        />
      </section>
    </MainLayout>
  );
}
