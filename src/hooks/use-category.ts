"use client";

import { useAppSelector } from "@/store/hooks";
import {
  getCategoryCapabilities,
  isPageVisibleForCategory,
  type Category,
} from "@/lib/access/category";

export function useCategory() {
  const category = useAppSelector(
    (state) => (state.auth.user as any)?.category ?? "radio"
  ) as Category;
  const caps = getCategoryCapabilities(category);

  return {
    category,
    ...caps,
    isPageVisible: (page: string) => isPageVisibleForCategory(category, page),
  };
}
