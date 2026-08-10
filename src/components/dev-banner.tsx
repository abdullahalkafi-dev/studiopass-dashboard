"use client";

import { type Category } from "@/lib/access/category";
import { DevRoleSwitcher } from "./dev-role-switcher";

export function DevBanner({
  category,
  onCategoryChange,
}: {
  category: Category;
  onCategoryChange: (category: Category) => void;
}) {
  return null;
}
