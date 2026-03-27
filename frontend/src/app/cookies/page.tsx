import DocumentPageView from "@/views/DocumentPageView";
import { getResolvedContactEmail } from "@/app/site";
import { getLegalPageMetadata, getRequiredLegalPage } from "@/lib/published-content";

export async function generateMetadata() {
  return getLegalPageMetadata("cookies");
}

export default async function CookiesPage() {
  const [page, supportEmail] = await Promise.all([
    getRequiredLegalPage("cookies"),
    getResolvedContactEmail(),
  ]);

  return (
    <DocumentPageView
      eyebrow={page.eyebrow || "Cookies"}
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
