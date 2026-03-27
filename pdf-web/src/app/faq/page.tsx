import FaqPageView from "@/views/FaqPageView";
import { getFaqPageMetadata, getPublishedFaqEntries } from "@/lib/published-content";

export async function generateMetadata() {
  return getFaqPageMetadata();
}

export default async function FaqPage() {
  const entries = await getPublishedFaqEntries();

  return (
    <FaqPageView
      title="Frequently Asked Questions"
      description="Common answers about how the PDF tools work, what to expect from processing, and where to get help."
      entries={entries}
    />
  );
}
