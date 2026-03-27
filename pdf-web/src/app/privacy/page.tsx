import DocumentPageView from "@/views/DocumentPageView";
import { getResolvedContactEmail } from "@/app/site";
import { getLegalPageMetadata, getRequiredLegalPage } from "@/lib/published-content";

export async function generateMetadata() {
  return getLegalPageMetadata("privacy");
}

export default async function PrivacyPage() {
  const [page, supportEmail] = await Promise.all([
    getRequiredLegalPage("privacy"),
    getResolvedContactEmail(),
  ]);

  return (
    <DocumentPageView
      eyebrow={page.eyebrow || "Privacy"}
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
