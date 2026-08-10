"use client";

import Link from "next/link";
import { ArrowLeft, MessageSquare, Phone, Loader2 } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetStatementByIdQuery } from "@/features/statement/statementApi";
import { formatDateTime } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { useRole } from "@/contexts/role-context";
import { getFieldVisibility } from "@/lib/access/permissions";

export default function StatementDetailContent({ id }: { id: string }) {
  const timezone = useTimezone();
  const role = useRole();
  const { data, isLoading, error } = useGetStatementByIdQuery(id);
  const stmt = data?.data;

  const showStationRef = getFieldVisibility(role, "listener_statements", "stationRef") === "visible";
  const showStation = getFieldVisibility(role, "listener_statements", "mediaStation") === "visible";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/listener-statement" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Listener Statement
        </Link>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#02B2FF]" />
        </div>
      </div>
    );
  }

  if (error || !stmt) {
    return (
      <div className="space-y-6">
        <Link href="/listener-statement" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Listener Statement
        </Link>
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-foreground">Statement not found</p>
          <p className="text-xs text-muted-foreground mt-1">The statement you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const isMsg = stmt.type === "Message";
  const created = stmt.createdAt ? formatDateTime(stmt.createdAt, timezone) : "—";

  return (
    <div className="space-y-6">
      <Link href="/listener-statement" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Listener Statement
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Statement Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Reference: {stmt.ticket}</p>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMsg ? "bg-[#02B2FF]/10" : "bg-violet-100"}`}>
          {isMsg ? <MessageSquare size={18} className="text-[#02B2FF]" /> : <Phone size={18} className="text-violet-500" />}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-emerald-700">{stmt.type} — {stmt.showName || "—"}</div>
          <div className="text-xs text-emerald-600">{showStation ? stmt.mediaStation : stmt.showName || "—"} · {created}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-emerald-700 font-['JetBrains_Mono',monospace]">{stmt.currencySymbol}{stmt.amount}</div>
          <StatusBadge label={stmt.status} variant={sv(stmt.status)} />
        </div>
      </div>

      {/* Interaction Details */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interaction Details</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          {([
            ["Created Date",      created],
            ["MSISDN",            stmt.msisdn],
            ["Amount",            `${stmt.currencySymbol}${stmt.amount}`],
            ["Credits Used",      String(stmt.creditsUsed)],
            ["Ticket",            stmt.ticket],
            ...(showStationRef ? [["Station Reference", stmt.stationRef] as [string, string]] : []),
            ...(showStation ? [["Station", stmt.mediaStation] as [string, string]] : []),
            ["Show",              stmt.showName || "—"],
            ["Interaction Type",  stmt.type],
            ["Operator",          stmt.operator || "—"],
          ] as [string, string][]).map(([lbl, val], i) => (
            <div key={lbl} className={`px-5 py-4 ${i < 10 ? "border-b border-border" : ""}`}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{lbl}</div>
              <div className="text-sm font-semibold text-foreground">{val}</div>
            </div>
          ))}
          <div className="col-span-2 px-5 py-4 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Status</div>
            <StatusBadge label={stmt.status} variant={sv(stmt.status)} />
          </div>
        </div>
      </div>

      {/* Back Button */}
      <Link href="/listener-statement" className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors">
        <ArrowLeft size={14} /> Back to Listener Statement
      </Link>
    </div>
  );
}
