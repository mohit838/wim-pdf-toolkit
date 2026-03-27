import { notFound } from "next/navigation";
import {
  buildContentMetadata,
  getResolvedFaqEntries,
  getResolvedGuide,
  getResolvedGuides,
  getResolvedLegalPage,
} from "@/app/site";

export async function getRequiredLegalPage(slug: string) {
  const page = await getResolvedLegalPage(slug);
  if (!page) {
    notFound();
  }

  return page;
}

export async function getLegalPageMetadata(slug: string) {
  const page = await getRequiredLegalPage(slug);
  return buildContentMetadata({
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
    keywords: [page.title],
  });
}

export async function getFaqPageMetadata() {
  return buildContentMetadata({
    title: "Frequently Asked Questions",
    description: "Answers to common questions about PDF Toolkit and its online PDF tools.",
    path: "/faq",
    keywords: ["PDF Toolkit FAQ", "PDF tool questions"],
  });
}

export async function getGuidesIndexMetadata() {
  return buildContentMetadata({
    title: "PDF Guides and Help Articles",
    description: "Browse step-by-step PDF Toolkit guides for merging, compressing, protecting, and converting files.",
    path: "/guides",
    keywords: ["PDF guides", "PDF Toolkit help", "how to merge PDF"],
  });
}

export async function getRequiredGuide(slug: string) {
  const guide = await getResolvedGuide(slug);
  if (!guide) {
    notFound();
  }

  return guide;
}

export async function getGuideMetadata(slug: string) {
  const guide = await getRequiredGuide(slug);
  return buildContentMetadata({
    title: guide.title,
    description: guide.excerpt,
    path: `/guides/${guide.slug}`,
    keywords: [guide.category, guide.title],
  });
}

export async function getPublishedFaqEntries() {
  return getResolvedFaqEntries();
}

export async function getPublishedGuides() {
  return getResolvedGuides();
}
