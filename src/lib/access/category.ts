/**
 * Category Capability Config
 *
 * Maps category → which extra pages/steps/features exist.
 * Category is fixed at the station_admin level and cascades down to
 * media_station, presenter under that station_admin.
 *
 * Categories: "radio" | "tv" | "channels"
 *
 * Key difference:
 *   RADIO    → direct publish flow, no approval step
 *   TV       → adds an approval queue (content must be ACCEPTED before output)
 *   CHANNELS → temporarily reuses RADIO flow/UI (placeholder)
 */

export type Category = "radio" | "tv" | "channels";

export interface CategoryCapabilities {
  /** Whether this category has an approval queue before publishing */
  hasApprovalQueue: boolean;
  /** Whether this category shows the "Channels" sub-section */
  hasChannels: boolean;
  /** Extra pages that exist for this category */
  extraPages: string[];
  /** Pages that are hidden for this category */
  hiddenPages: string[];
  /** Label overrides for copy/UI text */
  labels: {
    stationType: string;
    publishAction: string;
    approvalStep?: string;
  };
}

export const CATEGORY_CAPABILITIES: Record<Category, CategoryCapabilities> = {
  radio: {
    hasApprovalQueue: false,
    hasChannels: false,
    extraPages: [],
    hiddenPages: ["approval-queue"],
    labels: {
      stationType: "Radio Station",
      publishAction: "Publish",
    },
  },
  tv: {
    hasApprovalQueue: true,
    hasChannels: false,
    extraPages: ["approval-queue"],
    hiddenPages: [],
    labels: {
      stationType: "TV Station",
      publishAction: "Submit for Approval",
      approvalStep: "Content must be accepted before it goes to output",
    },
  },
  channels: {
    // Channels temporarily aliases radio's flow
    hasApprovalQueue: false,
    hasChannels: false,
    extraPages: [],
    hiddenPages: ["approval-queue"],
    labels: {
      stationType: "Channel",
      publishAction: "Publish",
    },
  },
};

/**
 * Returns capabilities for a given category.
 * "channels" aliases "radio" at the capability level — structure is ready
 * for real channels-specific screens later without touching radio code.
 */
export function getCategoryCapabilities(category: Category): CategoryCapabilities {
  if (category === "channels") {
    // Channels uses radio's flow as placeholder
    return {
      ...CATEGORY_CAPABILITIES.radio,
      labels: CATEGORY_CAPABILITIES.channels.labels,
    };
  }
  return CATEGORY_CAPABILITIES[category];
}

export function hasApprovalQueue(category: Category): boolean {
  return getCategoryCapabilities(category).hasApprovalQueue;
}

export function isPageVisibleForCategory(category: Category, page: string): boolean {
  const caps = getCategoryCapabilities(category);
  if (caps.hiddenPages.includes(page)) return false;
  if (caps.extraPages.includes(page)) return true;
  return true; // default: visible
}
