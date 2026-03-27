import DocumentPageView from "@/views/DocumentPageView";
import { getResolvedContactEmail } from "@/app/site";
import { getLegalPageMetadata, getRequiredLegalPage } from "@/lib/published-content";

export async function generateMetadata() {
  return getLegalPageMetadata("terms");
}

export default async function TermsPage() {
  const [page, supportEmail] = await Promise.all([
    getRequiredLegalPage("terms"),
    getResolvedContactEmail(),
  ]);

  return (
    <DocumentPageView
      eyebrow={page.eyebrow || "Terms"}
      title={page.title}
      description={page.description}
      body={page.body}
      updatedAt={page.updatedAt}
      sections={page.sections}
      cta={page.cta}
      supportEmail={supportEmail}
    />
  );
}
