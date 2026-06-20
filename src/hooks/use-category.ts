"use client";

import { useDevSession } from "./use-dev-session";
import {
  getCategoryCapabilities,
  hasApprovalQueue,
  isPageVisibleForCategory,
  type Category,
  type CategoryCapabilities,
} from "@/lib/access/category";

/**
 * Hook for category-based feature/page existence.
 * Resolved from the current station_admin's fixed category.
 * Pure lookup — no business logic embedded.
 *
 * Usage:
 *   const cat = useCategory();
 *   cat.hasApprovalQueue   → boolean
 *   cat.isPageVisible("messages") → boolean
 *   cat.labels.stationType → string
 */
export function useCategory() {
  const { category } = useDevSession();
  const caps = getCategoryCapabilities(category);

  return {
    category,
    ...caps,
    isPageVisible: (page: string) => isPageVisibleForCategory(category, page),
  };
}
