"use client";

import { useEffect, useRef } from "react";

interface GAMSlotClientProps {
  unitPath: string;
  sizes: [number, number] | [number, number][] | string;
  slotId: string;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    googletag: any;
  }
}

export default function GAMSlotClient({
  unitPath,
  sizes,
  slotId,
  className,
  style,
}: GAMSlotClientProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.googletag = window.googletag || { cmd: [] };
    const { googletag } = window;

    googletag.cmd.push(() => {
      // Avoid duplicate definition if already defined or if ref already flipped
      if (initialized.current) return;

      const slot = googletag
        .defineSlot(unitPath, sizes, slotId)
        .addService(googletag.pubads());

      if (slot) {
        googletag.display(slotId);
        initialized.current = true;
      }
    });

    return () => {
      googletag.cmd.push(() => {
        const slots = googletag.pubads().getSlots();
        const slotToDestroy = slots.find((s: any) => s.getSlotElementId() === slotId);
        if (slotToDestroy) {
          googletag.destroySlots([slotToDestroy]);
          initialized.current = false;
        }
      });
    };
  }, [unitPath, sizes, slotId]);

  return (
    <div 
      id={slotId} 
      className={className} 
      style={{ minHeight: "1px", ...style }} 
    />
  );
}
