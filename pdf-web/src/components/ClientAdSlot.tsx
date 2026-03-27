"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AdPlacement, AdScope } from "@/lib/cms-runtime";
import AdPlacementRenderer, { hasRenderableAdPlacement } from "./AdPlacementRenderer";
import BlueprintSlotRenderer from "./BlueprintSlotRenderer";

interface ClientAdSlotProps {
  slotId: string;
  scope: AdScope;
  categories?: string[];
  className?: string;
  title?: ReactNode;
}

export default function ClientAdSlot({
  slotId,
  scope,
  categories = [],
  className,
  title,
}: ClientAdSlotProps) {
  const [placement, setPlacement] = useState<AdPlacement | null>(null);
  const [blueprintEnabled, setBlueprintEnabled] = useState(false);
  const [resolved, setResolved] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      slotId,
      scope,
    });

    if (categories.length > 0) {
      params.set("categories", categories.join(","));
    }

    return params.toString();
  }, [categories, scope, slotId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlacement() {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 3500);
      try {
        const response = await fetch(`/api/runtime/ads/resolve?${queryString}`, {
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to resolve ad placement.");
        }

        const payload = await response.json() as {
          data?: {
            placement?: AdPlacement | null;
            blueprintEnabled?: boolean;
          };
        };

        if (!cancelled) {
          setPlacement(payload.data?.placement || null);
          setBlueprintEnabled(Boolean(payload.data?.blueprintEnabled));
        }
      } catch {
        if (!cancelled) {
          setPlacement(null);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled) {
          setResolved(true);
        }
      }
    }

    void loadPlacement();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  if (!resolved) {
    return null;
  }

  if (hasRenderableAdPlacement(placement)) {
    return <AdPlacementRenderer placement={placement} className={className} title={title} />;
  }

  if (blueprintEnabled) {
    return <BlueprintSlotRenderer slotId={slotId} className={className} title={title} />;
  }

  return null;
}
