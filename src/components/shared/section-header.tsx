"use client";

import { CheckCircle2 } from "lucide-react";

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
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-red-50 text-red-600 border-red-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    pending: "bg-blue-50 text-blue-600 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${map[variant]}`}>
      <CheckCircle2 size={10} className="shrink-0" />
      {label}
    </span>
  );
}

export function sv(s: string): "success" | "danger" | "neutral" | "pending" {
  if (s === "Active" || s === "Successful" || s === "Delivered") return "success";
  if (s === "Inactive" || s === "Failed") return "danger";
  if (s === "Pending") return "pending";
  return "neutral";
}

export function Avatar({ initials, size = "md", className }: { initials: string; size?: "sm" | "md"; className?: string }) {
  const pal = ["bg-[#EFF8FF] text-[#02B2FF]", "bg-violet-50 text-violet-600", "bg-emerald-50 text-emerald-600", "bg-amber-50 text-amber-600", "bg-rose-50 text-rose-600"];
  const c = className || pal[initials.charCodeAt(0) % pal.length];
  const s = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return <div className={`${s} rounded-full ${c} flex items-center justify-center font-bold shrink-0`}>{initials}</div>;
}

export function ChartFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const periods = ["daily", "weekly", "monthly", "yearly"];
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-0.5">
      {periods.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${value === o ? "bg-white text-[#02B2FF] shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{o}</button>
      ))}
    </div>
  );
}
