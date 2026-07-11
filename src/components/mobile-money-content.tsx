"use client";

import { useState } from "react";
import { useRole } from "@/contexts/role-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { Wallet, Download, Search, Eye, X, Hash, DollarSign } from "lucide-react";
import { useGetTransactionsQuery } from "@/features/credit/creditApi";

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda", "South Africa", "Ethiopia", "Bangladesh"];
const OPERATORS = ["Safaricom", "MTN", "Airtel", "Vodacom", "Orange", "Glo", "9Mobile"];

// Backend response shape (populated)
type RawTxn = {
  _id: string;
  user: { _id: string; fullName?: string; phone?: string } | string;
  type: "purchase" | "admin_grant" | "message_deduction" | "call_deduction";
  amount: number;
  isFree: boolean;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentReference?: string;
  currency?: string;
  localAmount?: number;
  country?: { _id: string; name?: string; code?: string } | string;
  station?: { _id: string; name?: string } | string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

// Frontend display shape
type Txn = {
  id: string;
  userId: string;
  userName: string;
  msisdn: string;
  amount: number;
  currency: string;
  country: string;
  operator: string;
  type: "purchase" | "admin_grant" | "message_deduction" | "call_deduction";
  isFree: boolean;
  status: string;
  created: string;
};

function transformTxn(raw: RawTxn): Txn {
  const userObj = typeof raw.user === "object" ? raw.user : null;
  const countryObj = typeof raw.country === "object" ? raw.country : null;
  return {
    id: raw._id,
    userId: userObj?._id || (typeof raw.user === "string" ? raw.user : ""),
    userName: userObj?.fullName || "Unknown",
    msisdn: userObj?.phone || "",
    amount: raw.amount,
    currency: raw.currency || "",
    country: countryObj?.name || "",
    operator: raw.paymentProvider || "",
    type: raw.type,
    isFree: raw.isFree,
    status: raw.status,
    created: raw.createdAt,
  };
}

function ExportModal({ onClose }: { onClose: () => void }) {
  const [fmt, setFmt] = useState("CSV");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] flex items-center justify-center">
              <Download size={15} className="text-[#02B2FF]" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Export Transactions</div>
              <div className="text-xs text-muted-foreground">Download filtered transaction data</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Export Format</p>
            <div className="flex gap-2">
              {(["CSV", "Excel", "PDF"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFmt(f)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all flex flex-col items-center gap-1 ${
                    fmt === f ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm" : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-base leading-none">{f === "CSV" ? "📄" : f === "Excel" ? "📊" : "📑"}</span>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-muted/20 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-foreground">
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
            }}
            className="px-5 py-2.5 text-sm font-semibold bg-[#02B2FF] text-white rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2"
          >
            <Download size={14} /> Export {fmt}
          </button>
        </div>
      </div>
    </div>
  );
}

function TxnDetailModal({ txn, onClose }: { txn: Txn; onClose: () => void }) {
  const statusCol =
    txn.status === "Successful"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
      : txn.status === "Failed"
        ? "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
        : "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";

  const fields: [string, string, boolean][] = [
    ["Transaction ID", txn.id, true],
    ["User", txn.userName || "—", true],
    ["MSISDN", txn.msisdn || "—", true],
    ["Amount", String(txn.amount), true],
    ["Currency", txn.currency || "—", true],
    ["Country", txn.country || "—", false],
    ["Operator", txn.operator || "—", false],
    ["Type", txn.type, true],
    ["Created Date", txn.created, true],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-sm font-bold text-foreground">Transaction Details</div>
            <div className="text-xs text-muted-foreground mt-0.5">Reference {txn.id}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${statusCol}`}>
            <div className="text-lg">{txn.status === "Successful" ? "✓" : txn.status === "Failed" ? "✕" : "⏳"}</div>
            <div>
              <div className="text-sm font-bold">{txn.status} Transaction</div>
              <div className="text-xs opacity-75">
                {txn.status === "completed"
                  ? "Transaction completed successfully."
                  : txn.status === "failed"
                    ? "This transaction was not completed."
                    : "This transaction is awaiting confirmation."}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xl font-bold font-['JetBrains_Mono',monospace]">{txn.amount}</div>
              <div className="text-xs opacity-75 font-['JetBrains_Mono',monospace]">{txn.currency}</div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transaction Information</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
              {fields.map(([lbl, val, mono], i) => (
                <div key={lbl} className={`px-5 py-4 ${i < fields.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{lbl}</div>
                  <div className={`text-sm font-semibold text-foreground ${mono ? "font-['JetBrains_Mono',monospace] text-xs" : ""}`}>{val}</div>
                </div>
              ))}
              <div className="col-span-2 px-5 py-4 border-t border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Payment Status</div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    txn.status === "Successful"
                      ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40"
                      : txn.status === "Failed"
                        ? "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40"
                        : "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      txn.status === "Successful" ? "bg-emerald-500" : txn.status === "Failed" ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  {txn.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileMoneyContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isCustomerCare = role === "customer_care";

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [operator, setOperator] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [pg, setPg] = useState(1);
  const [showExport, setShowExport] = useState(false);
  const [viewTxn, setViewTxn] = useState<Txn | null>(null);
  const PER = 10;

  const { data: transactionsResponse, isLoading } = useGetTransactionsQuery({
    page: pg,
    limit: 100,
  });
  const transactions: Txn[] = (transactionsResponse?.data ?? [])
    .map(transformTxn)
    .filter((t: Txn) => t.type === "purchase" || t.type === "admin_grant");

  const showCountry = isSuperAdmin;
  const showCountryFilter = isSuperAdmin;

  // Backend handles role-based scoping — no frontend filtering needed
  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    if (q && !t.id.toLowerCase().includes(q) && !(t.userName || "").toLowerCase().includes(q) && !(t.msisdn || "").includes(q) && !(t.operator || "").toLowerCase().includes(q))
      return false;
    if (showCountryFilter && country && t.country !== country) return false;
    if (operator && t.operator !== operator) return false;
    return true;
  });

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER));
  const paged = filtered.slice((pg - 1) * PER, pg * PER);
  const totalTransactions = transactions.length;
  const totalRevenue = transactions
    .filter((t: any) => t.type === "purchase")
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

  function clearFilters() {
    setSearch("");
    setCountry("");
    setOperator("");
    setDateRange("");
    setPg(1);
  }
  const hasFilters = !!(search || country || operator || dateRange);

  return (
    <div className="space-y-6">
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {viewTxn && <TxnDetailModal txn={viewTxn} onClose={() => setViewTxn(null)} />}

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-64 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-3 animate-pulse">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-7 w-24 bg-muted rounded" />
                <div className="h-2 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="bg-card rounded-xl border border-border p-5 space-y-3 animate-pulse">
            <div className="h-4 w-full bg-muted rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-full bg-muted rounded" />
            ))}
          </div>
        </div>
      ) : (
      <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center">
            <Wallet size={18} className="text-[#02B2FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mobile Money</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor and manage all recharge, top-up, and payment transactions.</p>
          </div>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
        >
          <Download size={14} /> Export Transactions
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          label="Total Transactions"
          value={String(totalTransactions)}
          sub="All recorded payment transactions"
          trend={{ val: "+8.4%", up: true }}
          icon={<Hash size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          sub="Total collected revenue"
          trend={{ val: "+14.7%", up: true }}
          icon={<DollarSign size={16} className="text-teal-500" />}
          iconBg="bg-teal-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by transaction ID, user, MSISDN, operator…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPg(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showCountryFilter && (
            <FilterSelect value={country} onChange={(v) => { setCountry(v); setPg(1); }}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="All Countries" className="w-36" />
          )}
          <FilterSelect value={operator} onChange={(v) => { setOperator(v); setPg(1); }}
            options={OPERATORS.map((o) => ({ value: o, label: o }))}
            placeholder="All Operators" className="w-36" />
          <FilterSelect value={dateRange} onChange={(v) => { setDateRange(v); setPg(1); }}
            options={[
              { value: "Today", label: "Today" },
              { value: "Last 7 days", label: "Last 7 days" },
              { value: "Last 30 days", label: "Last 30 days" },
              { value: "Last 3 months", label: "Last 3 months" },
              { value: "This Year", label: "This Year" },
            ]}
            placeholder="Date Range" className="w-40" />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Showing <span className="text-foreground">{paged.length}</span> of <span className="text-foreground">{filtered.length}</span> transactions
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {filtered.filter((t) => t.status === "Successful").length} successful
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Transaction ID", "User", "MSISDN", "Amount", "Type", "Currency", ...(showCountry ? ["Country"] : []), "Operator", "Status", "Created Date", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${h === "Actions" ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={showCountry ? 11 : 10} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Search size={18} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No transactions found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="mt-1 text-xs text-[#02B2FF] font-semibold hover:underline">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paged.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3.5">
                      <button onClick={() => setViewTxn(t)} className="text-xs font-semibold font-['JetBrains_Mono',monospace] text-[#02B2FF] hover:underline">
                        {t.id}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-foreground">{t.userName}</td>
                    <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-foreground">{t.msisdn || "—"}</td>
                    <td className="px-4 py-3.5 text-xs font-bold font-['JetBrains_Mono',monospace] text-foreground">
                      <div className="flex items-center gap-1.5">
                        {t.amount}
                        {t.isFree && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40">
                            Free
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {(() => {
                        const typeConfig: Record<string, { label: string; className: string }> = {
                          purchase: { label: "Purchase", className: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" },
                          admin_grant: { label: "Admin Grant", className: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" },
                          message_deduction: { label: "Message", className: "text-muted-foreground bg-muted" },
                          call_deduction: { label: "Call", className: "text-muted-foreground bg-muted" },
                        };
                        const cfg = typeConfig[t.type] ?? { label: t.type, className: "text-muted-foreground bg-muted" };
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold font-['JetBrains_Mono',monospace] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {t.currency}
                      </span>
                    </td>
                    {showCountry && <td className="px-4 py-3.5 text-xs font-medium text-foreground">{t.country}</td>}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-foreground">{t.operator}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        t.status === "completed"
                          ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40"
                          : t.status === "failed"
                            ? "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/40"
                            : "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground whitespace-nowrap">{t.created}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setViewTxn(t)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all mx-auto"
                        title="View transaction"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={totalPgs} totalItems={filtered.length} itemLabel="transactions" setPg={setPg} />
      </div>
      </>
    )}
    </div>
  );
}
