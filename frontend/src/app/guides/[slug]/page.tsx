import DocumentPageView from "@/views/DocumentPageView";
import { getGuideMetadata, getRequiredGuide } from "@/lib/published-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return getGuideMetadata(slug);
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getRequiredGuide(slug);

  return (
    <DocumentPageView
      adCategories={["guides", slug]}
      adScope="guide"
      adSlotPrefix="guide"
      eyebrow="Guide"
      title={guide.title}
      description={guide.excerpt}
      body={guide.body}
      backHref="/guides"
      backLabel="Back to guides"
    />
  );
}
