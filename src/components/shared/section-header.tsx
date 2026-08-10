"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { resolveUrl } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function SectionHeader({ title, sub, action, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {action || children}
    </div>
  );
}

export function StatusBadge({ label, variant }: { label: string; variant: "success" | "danger" | "neutral" | "warn" | "pending" }) {
  const map = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    danger: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    neutral: "bg-muted text-muted-foreground border-border",
    warn: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    pending: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${map[variant]}`}>
      <CheckCircle2 size={10} className="shrink-0" />
      {label}
    </span>
  );
}

export function sv(s: string): "success" | "danger" | "neutral" | "pending" {
  if (["Active", "Successful", "Delivered", "Completed", "completed"].includes(s)) return "success";
  if (["Inactive", "Failed", "failed"].includes(s)) return "danger";
  if (["Pending", "pending"].includes(s)) return "pending";
  return "neutral";
}

export function Avatar({
  src,
  initials,
  size = "md",
  className,
  onClick,
}: {
  src?: string | null;
  initials: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const pal = [
    "bg-[#EFF8FF] text-[#02B2FF] dark:bg-[#02B2FF]/15 dark:text-[#02B2FF]",
    "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  ];
  const charCode = (initials || "L").charCodeAt(0) || 0;
  const c = className || pal[charCode % pal.length];
  const sizeMap: Record<string, string> = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-12 h-12 text-sm",
    xl: "w-14 h-14 text-base",
  };
  const s = sizeMap[size] || sizeMap.md;
  const resolved = resolveUrl(src);

  if (resolved && !imgError) {
    return (
      <img
        src={resolved}
        alt={initials || "Avatar"}
        onError={() => setImgError(true)}
        onClick={onClick}
        className={`${s} rounded-full object-cover shrink-0 ${
          onClick ? "cursor-pointer hover:opacity-85 hover:scale-105 transition-all" : ""
        } ${className || ""}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${s} rounded-full ${c} flex items-center justify-center font-bold shrink-0 ${
        onClick ? "cursor-pointer hover:opacity-85 transition-opacity" : ""
      }`}
    >
      {initials}
    </div>
  );
}

export function ChartFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const periods = ["daily", "weekly", "monthly", "yearly"];
  return (
    <div className="flex gap-1 bg-muted dark:bg-white/10 rounded-lg p-0.5">
      {periods.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${value === o ? "bg-background dark:bg-white/15 text-[#02B2FF] shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{o}</button>
      ))}
    </div>
  );
}
