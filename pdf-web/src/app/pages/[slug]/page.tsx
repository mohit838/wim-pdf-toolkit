import { buildContentMetadata, getResolvedContactEmail } from "@/app/site";
import { getRequiredLegalPage } from "@/lib/published-content";
import DocumentPageView from "@/views/DocumentPageView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const page = await getRequiredLegalPage(resolved.slug);

  return buildContentMetadata({
    title: page.title,
    description: page.description,
    path: `/pages/${page.slug}`,
    keywords: [page.title],
  });
}

export default async function CustomContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const [page, supportEmail] = await Promise.all([
    getRequiredLegalPage(resolved.slug),
    getResolvedContactEmail(),
  ]);

  return (
    <DocumentPageView
      eyebrow={page.eyebrow || "Page"}
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
