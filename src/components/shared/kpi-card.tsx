"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import React from "react";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: { val: string; up: boolean } | string;
  trendUp?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  iconBg: string;
  selected?: boolean;
  onClick?: () => void;
}

function renderIcon(icon: unknown): React.ReactNode {
  if (icon === null || icon === undefined) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === "function") {
    const Icon = icon as React.ComponentType<{ size?: number; className?: string }>;
    return <Icon size={16} />;
  }
  return null;
}

export function KpiCard({ label, value, sub, trend, trendUp, icon, iconBg, selected, onClick }: KpiCardProps) {
  const trendObj =
    typeof trend === "string"
      ? { val: trend, up: trendUp ?? !trend.startsWith("-") }
      : trend;

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-shadow ${
        onClick ? "cursor-pointer" : ""
      } ${selected ? "border-[#02B2FF] ring-1 ring-[#02B2FF]/20" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{label}</span>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg} dark:bg-white/10`}>{renderIcon(icon)}</div>
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-bold text-foreground font-mono leading-tight truncate">{value}</div>
        {sub && <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{sub}</div>}
      </div>
      {trendObj && (
        <div className={`flex items-center gap-1 text-[11px] sm:text-xs font-semibold ${trendObj.up ? "text-emerald-600" : "text-red-500"}`}>
          {trendObj.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trendObj.val}
        </div>
      )}
    </div>
  );
}
