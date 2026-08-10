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
      className={`bg-card rounded-xl border border-border p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow ${
        onClick ? "cursor-pointer" : ""
      } ${selected ? "border-[#02B2FF] ring-1 ring-[#02B2FF]/20" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} dark:bg-white/10`}>{renderIcon(icon)}</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      {trendObj && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendObj.up ? "text-emerald-600" : "text-red-500"}`}>
          {trendObj.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trendObj.val}
        </div>
      )}
    </div>
  );
}
