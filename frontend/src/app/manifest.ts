import type { MetadataRoute } from "next";
import { getResolvedSiteBranding, getRuntimeSiteConfig } from "./site";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [runtimeConfig, branding] = await Promise.all([
    getRuntimeSiteConfig(),
    getResolvedSiteBranding(),
  ]);
  const manifestConfig = runtimeConfig.seo.manifest;
  const siteDescription = runtimeConfig.seo.site.description;

  return {
    name: branding.name,
    short_name: branding.shortName,
    description: siteDescription,
    start_url: manifestConfig.startUrl,
    display: manifestConfig.display as MetadataRoute.Manifest["display"],
    background_color: manifestConfig.backgroundColor,
    theme_color: manifestConfig.themeColor,
    icons: manifestConfig.icons,
  };
}
