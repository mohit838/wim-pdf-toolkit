import DocumentPageView from "@/views/DocumentPageView";
import { getResolvedContactEmail } from "@/app/site";
import { getLegalPageMetadata, getRequiredLegalPage } from "@/lib/published-content";

export async function generateMetadata() {
  return getLegalPageMetadata("about");
}

export default async function AboutPage() {
  const [page, supportEmail] = await Promise.all([
    getRequiredLegalPage("about"),
    getResolvedContactEmail(),
  ]);

  return (
    <DocumentPageView
      eyebrow={page.eyebrow || "About"}
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
