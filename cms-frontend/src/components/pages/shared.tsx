"use client";

import { Alert, Spin } from "antd";
import type { RuntimeAdPlacement } from "@/lib/cms-types";

export function LoadingPanel() {
  return (
    <div className="cms-loading-screen">
      <Spin size="large" />
    </div>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return <Alert title={message} showIcon type="error" />;
}

export function splitCategories(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getAdProviderFields(
  provider: RuntimeAdPlacement["provider"],
): Array<{ key: string; label: string; multiline?: boolean }> {
  switch (provider) {
    case "adsense_display":
    case "adsense_in_article":
      return [
        { key: "publisherId", label: "Publisher ID" },
        { key: "adSlot", label: "Ad slot" },
        { key: "format", label: "Format" },
      ];
    case "placeholder":
      return [
        { key: "title", label: "Title" },
        { key: "description", label: "Description", multiline: true },
      ];
    default:
      return [
        { key: "title", label: "Title" },
        { key: "description", label: "Description", multiline: true },
        { key: "href", label: "Target URL" },
        { key: "ctaLabel", label: "CTA label" },
      ];
  }
}
