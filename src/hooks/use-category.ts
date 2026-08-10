"use client";

import { useAppSelector } from "@/store/hooks";
import {
  getCategoryCapabilities,
  isPageVisibleForCategory,
  type Category,
} from "@/lib/access/category";

export function useCategory() {
  const rawCategory = useAppSelector(
    (state) => (state.auth.user as any)?.stationCategory || (state.auth.user as any)?.station?.category || "radio"
  );
  const category = (rawCategory === "channels" || rawCategory === "channel" ? "channel" : rawCategory) as Category;
  const caps = getCategoryCapabilities(category);

  return {
    category,
    ...caps,
    isPageVisible: (page: string) => isPageVisibleForCategory(category, page),
  };
}
