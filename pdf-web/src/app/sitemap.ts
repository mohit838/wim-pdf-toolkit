import type { MetadataRoute } from "next";
import { getSitemapEntries } from "./site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries();
}
