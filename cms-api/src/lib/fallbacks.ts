import fs from "node:fs/promises";
import path from "node:path";
import {
  getPublishedConfig,
  getPublishedContentLibrary,
  getPublishedSiteContent,
} from "./storage";

/**
 * Synchronizes the current published CMS state to static JSON files in the frontend's source tree.
 * This provides a robust fallback mechanism if the database or Redis is unavailable at runtime.
 */
export async function syncFallbacksToFrontend(): Promise<{ 
  success: boolean; 
  files: string[]; 
  error?: string; 
}> {
  try {
    const [runtimeConfig, siteContent, contentLibrary] = await Promise.all([
      getPublishedConfig(),
      getPublishedSiteContent(),
      getPublishedContentLibrary(),
    ]);

    // Path resolution: cms-api/src/lib -> pdf-web/src/lib/cms-fallbacks
    const fallbackDir = path.resolve(process.cwd(), "..", "pdf-web", "src", "lib", "cms-fallbacks");
    
    // Ensure directory exists
    await fs.mkdir(fallbackDir, { recursive: true });

    const targets = [
      { name: "runtime-config.json", data: runtimeConfig },
      { name: "site-content.json", data: siteContent },
      { name: "content-library.json", data: contentLibrary },
    ];

    const writtenFiles: string[] = [];

    for (const target of targets) {
      const filePath = path.join(fallbackDir, target.name);
      await fs.writeFile(filePath, JSON.stringify(target.data, null, 2), "utf8");
      writtenFiles.push(target.name);
    }

    return {
      success: true,
      files: writtenFiles,
    };
  } catch (error) {
    console.error("[FallbackSync] Failed to sync fallbacks:", error);
    return {
      success: false,
      files: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
