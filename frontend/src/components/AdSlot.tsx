import type { ReactNode } from "react";
import { isAdBlueprintModeEnabled, resolveRuntimeAdPlacement, type AdScope } from "@/lib/cms-runtime";
import AdPlacementRenderer, { hasRenderableAdPlacement } from "./AdPlacementRenderer";
import BlueprintSlotRenderer from "./BlueprintSlotRenderer";

interface AdSlotProps {
  slotId: string;
  scope: AdScope;
  categories?: string[];
  className?: string;
  title?: ReactNode;
}

export default async function AdSlot({
  slotId,
  scope,
  categories = [],
  className,
  title,
}: AdSlotProps) {
  const [placement, blueprintEnabled] = await Promise.all([
    resolveRuntimeAdPlacement(slotId, scope, categories),
    isAdBlueprintModeEnabled(),
  ]);

  if (hasRenderableAdPlacement(placement)) {
    return <AdPlacementRenderer placement={placement} className={className} title={title} />;
  }

  if (blueprintEnabled) {
    return <BlueprintSlotRenderer slotId={slotId} className={className} title={title} />;
  }

  return null;
}
