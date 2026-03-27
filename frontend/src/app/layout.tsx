import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import AnalyticsTags from "@/components/AnalyticsTags";
import RuntimeHeadTags from "@/components/RuntimeHeadTags";
import { getRuntimeSiteConfig } from "@/lib/cms-runtime";
import Providers from "./providers";
import {
  buildAbsoluteUrl,
  buildRobotsMetadata,
  getResolvedContactEmail,
  getResolvedSiteBranding,
  getResolvedSiteConfig,
  metadataAssetsConfig,
  metadataBase,
  siteCategory,
  siteLanguage,
  siteLocale,
  siteUrl,
  structuredDataConfig,
} from "./site";
import "../index.css";

export async function generateMetadata(): Promise<Metadata> {
  const [runtimeConfig, branding, contactEmail] = await Promise.all([
    getRuntimeSiteConfig(),
    getResolvedSiteBranding(),
    getResolvedContactEmail(),
  ]);
  const runtimeSiteConfig = runtimeConfig.seo.site;
  const runtimeSocialConfig = runtimeConfig.seo.social;
  const runtimeRobotsConfig = runtimeConfig.seo.robots;

  return {
    metadataBase,
    title: {
      default: runtimeSiteConfig.defaultTitle,
      template: runtimeSiteConfig.titleTemplate,
    },
    description: runtimeSiteConfig.description,
    applicationName: branding.name,
    keywords: runtimeSiteConfig.keywords,
    alternates: {
      canonical: "/",
    },
    authors: [{ name: branding.authorName, url: `mailto:${contactEmail}` }],
    creator: branding.authorName,
    publisher: branding.legalName,
    manifest: metadataAssetsConfig.manifestPath,
    icons: metadataAssetsConfig.icons,
    openGraph: {
      title: branding.name,
      description: runtimeSiteConfig.description,
      siteName: branding.name,
      type: "website",
      locale: siteLocale,
      url: "/",
      images: [
        {
          url: runtimeSocialConfig.openGraphImagePath,
          alt: runtimeSocialConfig.imageAlt,
        },
      ],
    },
    twitter: {
      card: runtimeSocialConfig.twitterCard as "summary" | "summary_large_image" | "player" | "app",
      title: branding.name,
      description: runtimeSiteConfig.description,
      images: [runtimeSocialConfig.twitterImagePath],
      site: runtimeSocialConfig.twitterSite,
      creator: runtimeSocialConfig.twitterCreator,
    },
    robots: buildRobotsMetadata(runtimeRobotsConfig.index, runtimeRobotsConfig.follow),
    category: runtimeSiteConfig.category || siteCategory,
  };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  const [runtimeConfig, siteConfig] = await Promise.all([
    getRuntimeSiteConfig(),
    getResolvedSiteConfig(),
  ]);
  const runtimeSiteDescription = runtimeConfig.seo.site.description;
  const organizationId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;
  const branding = siteConfig.branding;
  const contactEmail = siteConfig.contact.email;
  const organizationProfiles = siteConfig.organization.profiles.filter(Boolean);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: branding.name,
    url: siteUrl,
    email: `mailto:${contactEmail}`,
    logo: buildAbsoluteUrl("/icon.svg"),
    ...(organizationProfiles.length > 0 ? { sameAs: organizationProfiles } : {}),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    name: branding.name,
    url: siteUrl,
    description: runtimeSiteDescription,
    inLanguage: siteLanguage,
    publisher: {
      "@id": organizationId,
    },
  };

  const applicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: branding.name,
    applicationCategory: structuredDataConfig.applicationCategory,
    operatingSystem: structuredDataConfig.operatingSystem,
    offers: {
      "@type": "Offer",
      price: structuredDataConfig.price,
      priceCurrency: structuredDataConfig.priceCurrency,
    },
    url: siteUrl,
    description: runtimeSiteDescription,
    publisher: {
      "@id": organizationId,
    },
  };

  return (
    <html lang={siteLanguage}>
      <head>
        <RuntimeHeadTags />
      </head>
      <body suppressHydrationWarning>
        <AnalyticsTags />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
