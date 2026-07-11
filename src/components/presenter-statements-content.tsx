"use client";

import { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { FilterSelect } from "@/components/shared/filter-select";
import { useGetStatementsQuery } from "@/features/statement/statementApi";
import { useAppSelector } from "@/store/hooks";

export default function PresenterStatementsContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewing, setViewing] = useState<any>(null);
  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId || "";

  const { data, isLoading } = useGetStatementsQuery({
    page: 1,
    limit: 100,
    station: stationId,
    search: search || undefined,
  });

  const statements = data?.data || [];

  const filtered = statements.filter((s: any) => {
    if (statusFilter) {
      const sStatus = s.status === "Successful" ? "Replied" : "New";
      if (sStatus !== statusFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Listener Statements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View listener statements related to your assigned show.
        </p>
      </div>

      <hr className="border-border" />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by MSISDN or ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "New", label: "New" },
            { value: "Replied", label: "Replied" },
          ]}
          placeholder="All Status"
          className="w-40"
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">MSISDN</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statement</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader2 size={20} className="animate-spin text-[#02B2FF] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">No statements found.</td>
                </tr>
              ) : (
                filtered.map((stmt: any) => (
                  <tr key={stmt._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-foreground">{stmt.msisdn}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{stmt.type} — {stmt.showName || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{stmt.type}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{stmt.currencySymbol}{stmt.amount}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={stmt.status} variant={sv(stmt.status === "Successful" ? "Active" : "Pending")} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setViewing(stmt)}
                        className="inline-flex items-center rounded-lg border border-[#02B2FF] px-4 py-1.5 text-xs font-semibold text-[#02B2FF] hover:bg-muted transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-md bg-popover shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Statement Details</h2>
              <button onClick={() => setViewing(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                {[
                  ["Statement ID", viewing.statementId],
                  ["MSISDN", viewing.msisdn],
                  ["Type", viewing.type],
                  ["Show", viewing.showName || "—"],
                  ["Amount", `${viewing.currencySymbol}${viewing.amount}`],
                  ["Credits Used", String(viewing.creditsUsed)],
                  ["Ticket", viewing.ticket],
                  ["Status", viewing.status],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border">
              <button onClick={() => setViewing(null)} className="w-full rounded-lg border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
