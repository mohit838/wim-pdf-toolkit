import ContactPageView from "@/views/ContactPageView";
import { getResolvedContactEmail } from "@/app/site";
import { getLegalPageMetadata, getRequiredLegalPage } from "@/lib/published-content";

export async function generateMetadata() {
  return getLegalPageMetadata("contact");
}

export default async function ContactPage() {
  const [page, supportEmail] = await Promise.all([
    getRequiredLegalPage("contact"),
    getResolvedContactEmail(),
  ]);

  return (
    <ContactPageView
      eyebrow={page.eyebrow || "Contact"}
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
