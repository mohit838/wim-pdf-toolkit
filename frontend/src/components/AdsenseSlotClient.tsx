"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdsenseSlotClientProps {
  publisherId: string;
  adSlot: string;
  format?: string;
  fullWidthResponsive?: boolean;
}

export default function AdsenseSlotClient({
  publisherId,
  adSlot,
  format = "auto",
  fullWidthResponsive = true,
}: AdsenseSlotClientProps) {
  useEffect(() => {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore client-side adsense boot errors so the UI never breaks.
    }
  }, [adSlot, publisherId]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", width: "100%", maxWidth: "100%" }}
      data-ad-client={publisherId}
      data-ad-slot={adSlot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
    />
  );
}
