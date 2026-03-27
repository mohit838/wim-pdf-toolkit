import { describe, expect, it } from "vitest";
import {
  buildMetadata,
  getFooterSections,
  getHomeQuickStart,
  getHomeSections,
  getNavGroups,
  getSitemapEntries,
  getToolConfig,
  getToolIds,
  getToolPageCopy,
} from "../app/site";

describe("site config selectors", () => {
  it("resolves navigation, home, and footer tool references", () => {
    const toolIdSet = new Set(getToolIds());

    for (const group of getNavGroups()) {
      for (const item of group.items) {
        expect(toolIdSet.has(item.id)).toBe(true);
        expect(item.to).toBe(getToolConfig(item.id).path);
      }
    }

    for (const tool of getHomeQuickStart()) {
      expect(toolIdSet.has(tool.id)).toBe(true);
      expect(tool.title).toBeTruthy();
      expect(tool.to).toBe(getToolConfig(tool.id).path);
    }

    for (const section of getHomeSections()) {
      expect(section.tools.length).toBeGreaterThan(0);
      for (const tool of section.tools) {
        expect(toolIdSet.has(tool.id)).toBe(true);
        expect(tool.to).toBe(getToolConfig(tool.id).path);
      }
    }

    for (const section of getFooterSections()) {
      expect(section.links.length).toBeGreaterThan(0);
      for (const link of section.links) {
        expect(link.href.startsWith("/")).toBe(true);
        expect(link.label).toBeTruthy();
      }
    }
  });

  it("provides page copy for simple and complex tools", () => {
    const rotate = getToolPageCopy("rotate");
    const merge = getToolPageCopy("merge");

    expect(rotate.fileInput?.label).toBeTruthy();
    expect(rotate.actions.primaryLabel).toBeTruthy();
    expect(merge.fileInput?.dropzoneTitle).toBeTruthy();
    expect(merge.statusPanel?.workflowSteps).toHaveLength(3);
  });

  it("keeps non-index pages out of the sitemap and metadata index", async () => {
    const sitemapEntries = await getSitemapEntries();
    const supportMetadata = await buildMetadata("support");

    expect(sitemapEntries.some((entry) => entry.url.endsWith("/support"))).toBe(false);
    expect(supportMetadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });
});
