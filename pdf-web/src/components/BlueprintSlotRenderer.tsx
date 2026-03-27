"use client";

import type { ReactNode } from "react";
import AdBlueprintBox from "./AdBlueprintBox";

interface BlueprintSlotRendererProps {
  slotId: string;
  className?: string;
  title?: ReactNode;
}

export default function BlueprintSlotRenderer({ slotId, className, title }: BlueprintSlotRendererProps) {
  const wrapperClassName = className ? `cms-ad-slot ${className}` : "cms-ad-slot";

  return (
    <div className={wrapperClassName}>
      {title ? <div className="cms-ad-slot-label">{title}</div> : null}
      <AdBlueprintBox slotId={slotId} />
    </div>
  );
}
