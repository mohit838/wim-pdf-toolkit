export type BlueprintBreakpoint = "desktop" | "tablet" | "mobile";

export interface BlueprintSize {
  width: number;
  height: number;
}

export interface SlotBlueprintProfile {
  desktop: BlueprintSize;
  tablet: BlueprintSize;
  mobile: BlueprintSize;
  fallback?: BlueprintSize[];
}

const LARGE_BANNER: SlotBlueprintProfile = {
  desktop: { width: 970, height: 250 },
  tablet: { width: 728, height: 90 },
  mobile: { width: 320, height: 100 },
};

const STANDARD_BANNER: SlotBlueprintProfile = {
  desktop: { width: 728, height: 90 },
  tablet: { width: 728, height: 90 },
  mobile: { width: 320, height: 100 },
};

const RAIL: SlotBlueprintProfile = {
  desktop: { width: 300, height: 600 },
  tablet: { width: 300, height: 250 },
  mobile: { width: 320, height: 100 },
  fallback: [{ width: 300, height: 250 }],
};

const HOME_RAIL_FIT: SlotBlueprintProfile = {
  desktop: { width: 300, height: 250 },
  tablet: { width: 300, height: 250 },
  mobile: { width: 320, height: 100 },
  fallback: [{ width: 336, height: 280 }],
};

export const SLOT_BLUEPRINTS: Record<string, SlotBlueprintProfile> = {
  home_between_1: LARGE_BANNER,
  home_between_2: LARGE_BANNER,
  home_mid: LARGE_BANNER,
  footer_promo: STANDARD_BANNER,

  home_before_title: LARGE_BANNER,
  home_after_title: STANDARD_BANNER,
  guides_index_before_title: STANDARD_BANNER,
  guides_index_after_grid: STANDARD_BANNER,
  faq_before_title: STANDARD_BANNER,
  faq_after_content: STANDARD_BANNER,
  legal_before_title: STANDARD_BANNER,
  legal_after_content: STANDARD_BANNER,
  tool_before_title: STANDARD_BANNER,
  tool_after_header: STANDARD_BANNER,
  tool_after_panel: STANDARD_BANNER,
  guide_before_title: STANDARD_BANNER,
  guide_after_content: STANDARD_BANNER,

  home_right_rail: HOME_RAIL_FIT,
  guide_sidebar: RAIL,
  legal_sidebar: RAIL,
};

export function getBlueprintBreakpoint(viewportWidth: number): BlueprintBreakpoint {
  if (viewportWidth >= 1280) {
    return "desktop";
  }

  if (viewportWidth >= 768) {
    return "tablet";
  }

  return "mobile";
}

export function getSlotBlueprint(slotId: string): SlotBlueprintProfile {
  return SLOT_BLUEPRINTS[slotId] || STANDARD_BANNER;
}

export function formatBlueprintSize(size: BlueprintSize): string {
  return `${size.width}x${size.height}`;
}
