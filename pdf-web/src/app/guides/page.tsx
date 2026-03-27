import GuidesPageView from "@/views/GuidesPageView";
import { getGuidesIndexMetadata, getPublishedGuides } from "@/lib/published-content";

export async function generateMetadata() {
  return getGuidesIndexMetadata();
}

export default async function GuidesPage() {
  const guides = await getPublishedGuides();

  return (
    <GuidesPageView
      title="Guides and help articles"
      description="Browse CMS-managed articles that explain common PDF tasks and give the site more trust and support depth."
      guides={guides}
    />
  );
}
