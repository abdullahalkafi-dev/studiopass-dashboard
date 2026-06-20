"use client";

import { useState } from "react";
import { useRole } from "@/contexts/role-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { Wallet, Download, Search, Eye, X, Hash, DollarSign } from "lucide-react";

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda", "South Africa", "Ethiopia"];
const OPERATORS = ["Safaricom", "MTN", "Airtel", "Vodacom", "Orange", "Glo", "9Mobile"];

type Txn = {
  id: string;
  msisdn: string;
  amount: string;
  currency: string;
  country: string;
  operator: string;
  receipt: string;
  status: string;
  created: string;
  updated: string;
};

const TRANSACTIONS: Txn[] = [
  { id:"TXN-001842", msisdn:"+254712345678",  amount:"150.00",  currency:"KES", country:"Kenya",    operator:"Safaricom", receipt:"SAF2024061801", status:"Successful", created:"2024-06-18 09:14", updated:"2024-06-18 09:15" },
  { id:"TXN-001841", msisdn:"+256701234567",  amount:"5000.00", currency:"UGX", country:"Uganda",   operator:"MTN",       receipt:"MTN2024061842", status:"Successful", created:"2024-06-18 08:52", updated:"2024-06-18 08:53" },
  { id:"TXN-001840", msisdn:"+233241234567",  amount:"2.50",    currency:"GHS", country:"Ghana",    operator:"MTN",       receipt:"SAF2024061801", status:"Successful", created:"2024-06-18 08:31", updated:"2024-06-18 08:31" },
  { id:"TXN-001839", msisdn:"+255612345678",  amount:"500.00",  currency:"TZS", country:"Tanzania", operator:"Airtel",    receipt:"AIR2024061839", status:"Successful", created:"2024-06-18 07:49", updated:"2024-06-18 07:50" },
  { id:"TXN-001838", msisdn:"+2348012345678", amount:"250.00",  currency:"NGN", country:"Nigeria",  operator:"Airtel",    receipt:"SAF2024061801", status:"Successful", created:"2024-06-18 07:22", updated:"2024-06-18 07:22" },
  { id:"TXN-001837", msisdn:"+250781234567",  amount:"1000.00", currency:"RWF", country:"Rwanda",   operator:"MTN",       receipt:"MTN2024061837", status:"Successful", created:"2024-06-18 06:58", updated:"2024-06-18 06:59" },
  { id:"TXN-001836", msisdn:"+254798765432",  amount:"75.00",   currency:"KES", country:"Kenya",    operator:"Airtel",    receipt:"AIR2024061836", status:"Successful", created:"2024-06-17 22:10", updated:"2024-06-17 22:11" },
  { id:"TXN-001835", msisdn:"+256702345678",  amount:"3000.00", currency:"UGX", country:"Uganda",   operator:"Airtel",    receipt:"SAF2024061801", status:"Successful", created:"2024-06-17 21:45", updated:"2024-06-17 21:45" },
  { id:"TXN-001834", msisdn:"+233501234567",  amount:"5.00",    currency:"GHS", country:"Ghana",    operator:"Vodacom",   receipt:"VOD2024061834", status:"Successful", created:"2024-06-17 20:33", updated:"2024-06-17 20:34" },
  { id:"TXN-001833", msisdn:"+255623456789",  amount:"200.00",  currency:"TZS", country:"Tanzania", operator:"Vodacom",   receipt:"VOD2024061833", status:"Successful", created:"2024-06-17 19:18", updated:"2024-06-17 19:19" },
  { id:"TXN-001832", msisdn:"+2348023456789", amount:"100.00",  currency:"NGN", country:"Nigeria",  operator:"Glo",       receipt:"AIR2024061836", status:"Successful", created:"2024-06-17 18:44", updated:"2024-06-17 18:44" },
  { id:"TXN-001831", msisdn:"+254723456789",  amount:"300.00",  currency:"KES", country:"Kenya",    operator:"Safaricom", receipt:"SAF2024061831", status:"Successful", created:"2024-06-17 17:02", updated:"2024-06-17 17:03" },
  { id:"TXN-001830", msisdn:"+250782345678",  amount:"800.00",  currency:"RWF", country:"Rwanda",   operator:"MTN",       receipt:"MTN2024061730", status:"Successful", created:"2024-06-17 15:44", updated:"2024-06-17 15:45" },
  { id:"TXN-001829", msisdn:"+233209876543",  amount:"10.00",   currency:"GHS", country:"Ghana",    operator:"Orange",    receipt:"SAF2024061801", status:"Successful", created:"2024-06-17 14:28", updated:"2024-06-17 14:28" },
  { id:"TXN-001828", msisdn:"+255634567890",  amount:"750.00",  currency:"TZS", country:"Tanzania", operator:"Airtel",    receipt:"AIR2024061728", status:"Successful", created:"2024-06-17 13:11", updated:"2024-06-17 13:12" },
  { id:"TXN-001827", msisdn:"+254733456789",  amount:"200.00",  currency:"KES", country:"Kenya",    operator:"Safaricom", receipt:"SAF2024061727", status:"Successful", created:"2024-06-17 11:55", updated:"2024-06-17 11:56" },
  { id:"TXN-001826", msisdn:"+2349012345678", amount:"500.00",  currency:"NGN", country:"Nigeria",  operator:"9Mobile",   receipt:"SAF2024061801", status:"Successful", created:"2024-06-17 10:30", updated:"2024-06-17 10:30" },
  { id:"TXN-001825", msisdn:"+256703456789",  amount:"2500.00", currency:"UGX", country:"Uganda",   operator:"MTN",       receipt:"MTN2024061725", status:"Successful", created:"2024-06-17 09:18", updated:"2024-06-17 09:19" },
  { id:"TXN-001824", msisdn:"+254745678901",  amount:"50.00",   currency:"KES", country:"Kenya",    operator:"Airtel",    receipt:"AIR2024061724", status:"Successful", created:"2024-06-16 22:41", updated:"2024-06-16 22:42" },
  { id:"TXN-001823", msisdn:"+233261234567",  amount:"7.50",    currency:"GHS", country:"Ghana",    operator:"MTN",       receipt:"MTN2024061623", status:"Successful", created:"2024-06-16 20:15", updated:"2024-06-16 20:16" },
  { id:"TXN-001822", msisdn:"+255645678901",  amount:"1000.00", currency:"TZS", country:"Tanzania", operator:"Vodacom",   receipt:"SAF2024061801", status:"Successful", created:"2024-06-16 18:50", updated:"2024-06-16 18:50" },
  { id:"TXN-001821", msisdn:"+2348034567890", amount:"150.00",  currency:"NGN", country:"Nigeria",  operator:"Airtel",    receipt:"AIR2024061621", status:"Successful", created:"2024-06-16 17:22", updated:"2024-06-16 17:23" },
  { id:"TXN-001820", msisdn:"+250783456789",  amount:"500.00",  currency:"RWF", country:"Rwanda",   operator:"MTN",       receipt:"MTN2024061620", status:"Successful", created:"2024-06-16 15:08", updated:"2024-06-16 15:09" },
  { id:"TXN-001819", msisdn:"+256704567890",  amount:"1500.00", currency:"UGX", country:"Uganda",   operator:"Airtel",    receipt:"SAF2024061801", status:"Successful", created:"2024-06-16 13:44", updated:"2024-06-16 13:44" },
  { id:"TXN-001818", msisdn:"+254756789012",  amount:"100.00",  currency:"KES", country:"Kenya",    operator:"Safaricom", receipt:"SAF2024061618", status:"Successful", created:"2024-06-16 11:30", updated:"2024-06-16 11:31" },
];

function ExportModal({ onClose }: { onClose: () => void }) {
  const [fmt, setFmt] = useState("CSV");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
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
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : txn.status === "Failed"
        ? "text-red-600 bg-red-50 border-red-200"
        : "text-blue-600 bg-blue-50 border-blue-200";

  const fields: [string, string, boolean][] = [
    ["Transaction ID", txn.id, true],
    ["MSISDN", txn.msisdn, true],
    ["Amount", txn.amount, true],
    ["Currency", txn.currency, true],
    ["Country", txn.country, false],
    ["Operator", txn.operator, false],
    ["Receipt Number", txn.receipt || "—", true],
    ["Created Date", txn.created, true],
    ["Last Updated", txn.updated, true],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                {txn.status === "Successful"
                  ? `Receipt: ${txn.receipt}`
                  : txn.status === "Failed"
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
                      ? "text-emerald-700 bg-emerald-50"
                      : txn.status === "Failed"
                        ? "text-red-700 bg-red-50"
                        : "text-blue-700 bg-blue-50"
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

  const showCountry = isSuperAdmin;
  const showCountryFilter = isSuperAdmin;

  const scoped = isPartnerAdmin || isCustomerCare ? TRANSACTIONS.filter((t) => t.country === "Kenya") : TRANSACTIONS;

  const filtered = scoped.filter((t) => {
    const q = search.toLowerCase();
    if (q && !t.id.toLowerCase().includes(q) && !t.msisdn.includes(q) && !t.receipt.toLowerCase().includes(q) && !t.operator.toLowerCase().includes(q))
      return false;
    if (showCountryFilter && country && t.country !== country) return false;
    if (operator && t.operator !== operator) return false;
    return true;
  });

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER));
  const paged = filtered.slice((pg - 1) * PER, pg * PER);
  const total = scoped.length;
  const revenue = scoped.reduce((acc, t) => acc + parseFloat(t.amount), 0);

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
          value={String(total)}
          sub="All recorded payment transactions"
          trend={{ val: "+8.4%", up: true }}
          icon={<Hash size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Total Revenue"
          value={`$${revenue.toFixed(2)}`}
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
              placeholder="Search by transaction ID, MSISDN, operator, receipt…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPg(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
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
                {filtered.length} successful
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
                {["Transaction ID", "MSISDN", "Amount", "Currency", ...(showCountry ? ["Country"] : []), "Operator", "Receipt Number", "Status", "Created Date", "Actions"].map(
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
                  <td colSpan={showCountry ? 10 : 9} className="px-5 py-16 text-center">
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
                    <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-foreground">{t.msisdn}</td>
                    <td className="px-4 py-3.5 text-xs font-bold font-['JetBrains_Mono',monospace] text-foreground">{t.amount}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold font-['JetBrains_Mono',monospace] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {t.currency}
                      </span>
                    </td>
                    {showCountry && <td className="px-4 py-3.5 text-xs font-medium text-foreground">{t.country}</td>}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-foreground">{t.operator}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">
                      {t.receipt ? t.receipt : <span className="text-slate-300 italic text-[10px]">not available</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Successful
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
    </div>
  );
}
