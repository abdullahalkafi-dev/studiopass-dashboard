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
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Dev Mode
        </div>
        <DevRoleSwitcher
          category={category}
          onCategoryChange={onCategoryChange}
        />
      </div>
    </div>
  );
}
