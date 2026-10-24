"use client";

import { useState } from "react";
import { CreditCard, Search, Loader2, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetDisbursementsQuery, useRetryDisbursementMutation } from "@/features/disbursement/disbursementApi";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

const PER_PAGE = 10;

type Tab = "completed" | "pending" | "processing" | "failed";
const TABS: { key: Tab; label: string; status: string }[] = [
  { key: "completed", label: "Completed Payouts", status: "successful" },
  { key: "pending", label: "Pending Payouts", status: "pending" },
  { key: "processing", label: "In Progress", status: "processing" },
  { key: "failed", label: "Failed", status: "failed" },
];
const RETRYABLE_PRIZES = ["mobile_money", "airtime", "bonus_credits"];

export default function DisbursementsPage() {
  const timezone = useTimezone();
  const [activeTab, setActiveTab] = useState<Tab>("completed");
  const [retryDisbursement, { isLoading: isRetrying }] = useRetryDisbursementMutation();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    setRetryError(null);
    try {
      await retryDisbursement(id).unwrap();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      setRetryError(message || "Retry failed. Please try again.");
    } finally {
      setRetryingId(null);
    }
  };
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pg, setPg] = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetDisbursementsQuery({
    status: TABS.find((t) => t.key === activeTab)?.status,
    search: debouncedSearch || undefined,
    page: pg,
    limit: PER_PAGE,
  });

  const disbursements = data?.data || [];
  const meta = data?.meta || { page: 1, limit: PER_PAGE, total: 0, totalPage: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF] shrink-0">
            <CreditCard size={18} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Disbursements</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Monitor automatic mobile money, airtime, and bonus credit reward payouts.
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-card border border-border text-xs font-semibold rounded-lg hover:bg-muted transition-colors w-full sm:w-auto"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin text-[#02B2FF]" : ""} />
          Refresh
        </button>
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPg(1); setRetryError(null); }}
              className={`flex-1 sm:flex-none text-center px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-[#02B2FF] text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by winner or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPg(1);
              clearTimeout((window as any).__disbSearchTimer);
              (window as any).__disbSearchTimer = setTimeout(() => setDebouncedSearch(e.target.value), 300);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
          />
        </div>
      </div>

      {retryError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs text-destructive">
          <AlertCircle size={14} /> {retryError}
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">Showing {disbursements.length} of {meta.total} records</span>
          <span className="text-xs text-muted-foreground">Page {pg} of {meta.totalPage || 1}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Created Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Winner Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Phone Number</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Channel / Station</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Challenge</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Prize Value</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Tx Reference</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Note</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#02B2FF]" /> Loading disbursements...
                  </td>
                </tr>
              ) : disbursements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-xs text-muted-foreground">
                    No {activeTab} disbursements found.
                  </td>
                </tr>
              ) : (
                disbursements.map((row: any) => {
                  const challengeObj = typeof row.challenge === "object" ? row.challenge : null;
                  const stationObj = typeof row.station === "object" ? row.station : null;

                  return (
                    <tr key={row._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {formatDate(row.createdAt, timezone, "MMM d, HH:mm")}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-foreground">
                        {row.winnerName}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-foreground">
                        {row.phone}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {stationObj?.name || "Channel"}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-foreground">
                        {challengeObj?.title || challengeObj?.name || "Challenge"}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#02B2FF]">
                        {row.prizeValue}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground">
                        {row.txRef || "N/A"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge
                          label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                          variant={sv(row.status === "successful" ? "Active" : row.status === "pending" || row.status === "processing" ? "Draft" : "Inactive")}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[260px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate" title={row.failureReason || row.providerReference || ""}>
                            {row.failureReason || (row.providerReference ? `Receipt ${row.providerReference}` : "—")}
                          </span>
                          {row.status === "failed" && RETRYABLE_PRIZES.includes(row.prizeTypeKey) && (
                            <button
                              onClick={() => handleRetry(row._id)}
                              disabled={isRetrying}
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border border-border hover:bg-muted disabled:opacity-50"
                            >
                              {retryingId === row._id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination pg={pg} totalPages={meta.totalPage || 1} totalItems={meta.total || 0} itemLabel="records" setPg={setPg} />
      </div>
    </div>
  );
}
