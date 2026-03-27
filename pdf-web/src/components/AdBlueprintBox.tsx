"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatBlueprintSize,
  getBlueprintBreakpoint,
  getSlotBlueprint,
} from "@/lib/ad-blueprint";

interface AdBlueprintBoxProps {
  slotId: string;
}

export default function AdBlueprintBox({ slotId }: AdBlueprintBoxProps) {
  const [viewportWidth, setViewportWidth] = useState<number>(1280);
  const profile = useMemo(() => getSlotBlueprint(slotId), [slotId]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const activeBreakpoint = getBlueprintBreakpoint(viewportWidth);
  const activeSize = profile[activeBreakpoint];

  return (
    <div className="runtime-ad-blueprint-stage" suppressHydrationWarning>
      <div
        className="runtime-ad-blueprint-shell"
        style={{
          width: `min(100%, ${activeSize.width}px)`,
          maxWidth: `${activeSize.width}px`,
          aspectRatio: `${activeSize.width} / ${activeSize.height}`,
        }}
      >
        <div className="runtime-ad-blueprint-core">
          {slotId} • {formatBlueprintSize(activeSize)}
        </div>
      </div>
    </div>
  );
}
