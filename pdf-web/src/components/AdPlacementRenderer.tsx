import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { AdPlacement } from "@/lib/cms-runtime";
import { getSlotBlueprint } from "@/lib/ad-blueprint";
import AdsenseSlotClient from "./AdsenseSlotClient";

interface AdPlacementRendererProps {
  placement: AdPlacement | null;
  className?: string;
  title?: ReactNode;
}

function isSeededDemoPlacement(placement: AdPlacement): boolean {
  const haystack = [
    placement.name,
    String(placement.config.title || ""),
    String(placement.config.headline || ""),
    String(placement.config.description || ""),
    String(placement.config.body || ""),
  ].join(" ").toLowerCase();

  return haystack.includes("demo ad") || haystack.includes("seeded test ad");
}

export function hasRenderableAdPlacement(placement: AdPlacement | null): boolean {
  if (!placement || !placement.enabled) {
    return false;
  }

  if (isSeededDemoPlacement(placement)) {
    return false;
  }

  if (placement.provider.startsWith("adsense")) {
    const publisherId = String(placement.config.publisherId || "").trim();
    const adSlot = String(placement.config.adSlot || "").trim();
    return publisherId.startsWith("ca-pub-") && adSlot.length >= 6 && adSlot.length <= 20 && !Number.isNaN(Number(adSlot));
  }

  if (placement.provider === "custom_banner" || placement.provider === "custom_card") {
    const href = String(placement.config.href || "").trim();
    return Boolean(href);
  }

  return false;
}

export default function AdPlacementRenderer({
  placement,
  className,
  title,
}: AdPlacementRendererProps) {
  if (!hasRenderableAdPlacement(placement)) {
    return null;
  }
  const activePlacement = placement as AdPlacement;

  const wrapperClassName = className ? `cms-ad-slot ${className}` : "cms-ad-slot";

  if (activePlacement.provider.startsWith("adsense")) {
    const publisherId = String(activePlacement.config.publisherId || "").trim();
    const adSlot = String(activePlacement.config.adSlot || "").trim();
    if (!publisherId.startsWith("ca-pub-") || adSlot.length < 6 || adSlot.length > 20 || Number.isNaN(Number(adSlot))) {
      return null;
    }
    const profile = getSlotBlueprint(activePlacement.slotId);
    const reservedStyle = {
      "--ad-h-mobile": `${profile.mobile.height}px`,
      "--ad-h-tablet": `${profile.tablet.height}px`,
      "--ad-h-desktop": `${profile.desktop.height}px`,
    } as CSSProperties;

    return (
      <div className={wrapperClassName}>
        {title ? <div className="cms-ad-slot-label">{title}</div> : null}
        <div className="runtime-ad-card runtime-ad-card-adsense" style={reservedStyle}>
          <AdsenseSlotClient
            publisherId={publisherId}
            adSlot={adSlot}
            format={String(activePlacement.config.format || "auto")}
            fullWidthResponsive={Boolean(activePlacement.config.fullWidthResponsive ?? true)}
          />
        </div>
      </div>
    );
  }

  if (activePlacement.provider === "placeholder") {
    const titleText = String(activePlacement.config.title || activePlacement.name || "Ad placement").trim();
    const descriptionText = String(
      activePlacement.config.description || "This slot is reserved for a future ad or sponsor message.",
    ).trim();

    return (
      <div className={wrapperClassName}>
        {title ? <div className="cms-ad-slot-label">{title}</div> : null}
        <div className="runtime-ad-card runtime-ad-card-placeholder">
          <p className="runtime-ad-card-badge">Reserved placement</p>
          <p className="runtime-ad-card-title">{titleText}</p>
          <p className="runtime-ad-card-description">{descriptionText}</p>
        </div>
      </div>
    );
  }

  const href = String(activePlacement.config.href || "").trim();
  const ctaLabel = String(activePlacement.config.ctaLabel || activePlacement.config.linkLabel || "Learn more");
  const titleText = String(activePlacement.config.title || activePlacement.config.headline || activePlacement.name);
  const descriptionText = String(activePlacement.config.description || activePlacement.config.body || "");

  if (!href) {
    return null;
  }

  return (
    <div className={wrapperClassName}>
      {title ? <div className="cms-ad-slot-label">{title}</div> : null}
      <Link
        href={href}
        className="runtime-ad-card runtime-ad-card-custom"
        target="_blank"
        rel="noreferrer"
      >
        <div>
          <p className="runtime-ad-card-badge">Sponsor</p>
          <p className="runtime-ad-card-title">{titleText}</p>
          {descriptionText ? <p className="runtime-ad-card-description">{descriptionText}</p> : null}
        </div>
        <span className="runtime-ad-card-cta">{ctaLabel}</span>
      </Link>
    </div>
  );
}
