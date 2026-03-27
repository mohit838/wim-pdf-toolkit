import type { MetadataRoute } from "next";
import { buildAbsoluteUrl, getRuntimeSiteConfig, siteUrl } from "./site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const runtimeConfig = await getRuntimeSiteConfig();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: buildAbsoluteUrl("/sitemap.xml"),
    host: runtimeConfig.seo.site.fallbackSiteUrl || siteUrl,
  };
}
