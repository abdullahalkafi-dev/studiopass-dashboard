"use client";

import { useState } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import { getFieldVisibility } from "@/lib/access/permissions";
import { useGetStatementsQuery, useGetStatementKPIsQuery, useLazyExportStatementsQuery } from "@/features/statement/statementApi";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import {
  FileText, Download, Search, Eye, X, FileDown,
  Activity, MessageSquare, Phone, DollarSign, BarChart3,
} from "lucide-react";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

const COUNTRIES = ["Kenya","Uganda","Ghana","Tanzania","Nigeria","Rwanda"];
const STATIONS = ["Capital FM Kenya","Radio Uganda","Joy FM Ghana","Hot 96","Citizen TV","NTV Uganda","Peace FM"];
const TYPES = ["Message","Call"];

function ExportModal({ onClose, onExport }: { onClose: () => void; onExport: (format: string) => void }) {
  const [fmt, setFmt] = useState("CSV");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] flex items-center justify-center">
              <FileDown size={15} className="text-[#02B2FF]" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Export Statement</div>
              <div className="text-xs text-muted-foreground">Download filtered listener statement data</div>
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
              {(["CSV"] as const).map((f) => (
                <button key={f} onClick={() => setFmt(f)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all flex flex-col items-center gap-1 ${fmt===f ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm" : "border-border text-foreground hover:bg-muted"}`}>
                  <span className="text-base leading-none">📄</span>{f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-muted/20 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-foreground">Cancel</button>
          <button onClick={() => onExport(fmt)} className="px-5 py-2.5 text-sm font-semibold bg-[#02B2FF] text-white rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2">
            <Download size={14} />Export {fmt}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListenerStatementContent() {
  const timezone = useTimezone();
  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const isPresenter = role === "presenter";
  const isSuperAdmin = role === "super_admin";

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [station, setStation] = useState("");
  const [itype, setItype] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [pg, setPg] = useState(1);
  const [showExport, setShowExport] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const PER = 10;

  const [triggerExport] = useLazyExportStatementsQuery();

  const showStationRef = getFieldVisibility(role, "listener_statements", "stationRef") === "visible";
  const showStation = getFieldVisibility(role, "listener_statements", "mediaStation") === "visible";
  const showCountryFilter = isSuperAdmin;
  const showStationFilter = getFieldVisibility(role, "listener_statements", "stationRef") === "visible";

  const rawStation = (user as any)?.station || (user as any)?.stationId;
  const isPollChannel = (user as any)?.channelType === "polls" || (user as any)?.station?.channelType === "polls" || (typeof rawStation === "object" && rawStation?.channelType === "polls");

  const filterTypes = isPollChannel ? ["Vote", "Credits"] : ["Message", "Call"];

  const searchPlaceholder = isSuperAdmin
    ? "Search by ID, MSISDN, ticket, show…"
    : isPresenter
      ? "Search by MSISDN or ticket…"
      : isPollChannel
        ? "Search by MSISDN, poll title, candidate nominee…"
        : "Search by transaction ID, MSISDN, operator, receipt, station…";

  const { data: statementsData, isLoading } = useGetStatementsQuery({
    page: pg,
    limit: PER,
    station: isPresenter ? (user?.stationId || undefined) : (station || undefined),
    country: country || undefined,
    type: itype || undefined,
    search: search || undefined,
  });

  const { data: kpiData } = useGetStatementKPIsQuery({
    station: isPresenter ? (user?.stationId || undefined) : (station || undefined),
  });

  const kpis = kpiData?.data || { totalInteractions: 0, totalMessages: 0, totalCalls: 0, totalRevenue: 0 };
  const rawStatements = statementsData?.data || [];
  const statements = Array.isArray(rawStatements) ? rawStatements : (rawStatements as any).statements || [];
  const meta = statementsData?.meta || { total: statements.length, totalPage: 1 };

  const showShowColumn = !isPresenter && !isPollChannel && getFieldVisibility(role, "listener_statements", "showName") === "visible";
  const colCount = 6 + (showStationRef ? 1 : 0) + (showStation ? 1 : 0) + (showShowColumn ? 1 : 0);

  const handleExport = async (format: string) => {
    if (!statements.length) {
      toast.info("No content to export");
      setShowExport(false);
      return;
    }
    try {
      const result = await triggerExport({ station, country, type: itype, format }).unwrap();
      const strData = (result as unknown as string) || "";
      if (!strData.trim() || strData.trim().split("\n").length <= 1) {
        toast.info("No content to export");
        setShowExport(false);
        return;
      }
      const blob = new Blob([strData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "listener-statements-export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      setShowExport(false);
      toast.success("Statements exported successfully");
    } catch {
      toast.info("No content to export");
      setShowExport(false);
    }
  };

  return (
    <div className="space-y-6">
      {showExport && <ExportModal onClose={() => setShowExport(false)} onExport={handleExport} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center">
            <FileText size={18} className="text-[#02B2FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isPollChannel ? "Voter Statement" : "Listener Statement"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isPollChannel
                ? "Monitor all successful poll votes and candidate transactions."
                : isPresenter
                  ? "View listener statements related to your assigned show."
                  : "Monitor all successful listener interactions across the platform."}
            </p>
          </div>
        </div>
        {!isPresenter && (
          <button onClick={() => setShowExport(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
            <Download size={14} /> Export Statement
          </button>
        )}
      </div>

      {/* KPI Cards — admin roles only */}
      {!isPresenter && (
        <div className="grid grid-cols-4 gap-4">
          {isPollChannel ? (
            <>
              <KpiCard label="Total Votes" value={String(kpis.totalInteractions)} sub="All recorded votes" icon={<Activity size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
              <KpiCard label="Paid Votes" value={String(kpis.totalMessages)} sub="Credits-based votes" icon={<MessageSquare size={16} className="text-amber-500"/>} iconBg="bg-amber-50"/>
              <KpiCard label="Free Votes" value={String(kpis.totalCalls)} sub="Free poll votes" icon={<BarChart3 size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
              <KpiCard label="Total Vote Revenue" value={`$${kpis.totalRevenue.toFixed(2)}`} sub="Revenue from vote credits" icon={<DollarSign size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
            </>
          ) : (
            <>
              <KpiCard label="Total Interactions" value={String(kpis.totalInteractions)} sub="All successful listener interactions" icon={<Activity size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
              <KpiCard label="Total Messages" value={String(kpis.totalMessages)} sub="Successful messages sent" icon={<MessageSquare size={16} className="text-violet-500"/>} iconBg="bg-violet-50"/>
              <KpiCard label="Total Calls" value={String(kpis.totalCalls)} sub="Successful calls made" icon={<Phone size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
              <KpiCard label="Total Interaction Revenue" value={`$${kpis.totalRevenue.toFixed(2)}`} sub="Revenue from interactions" icon={<DollarSign size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder={searchPlaceholder} value={search} onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all" />
          </div>
          {showCountryFilter && (
            <FilterSelect value={country} onChange={(v) => { setCountry(v); setPg(1); }}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="All Countries" className="w-36" />
          )}
          {showStationFilter && (
            <FilterSelect value={station} onChange={(v) => { setStation(v); setPg(1); }}
              options={STATIONS.map((s) => ({ value: s, label: s }))}
              placeholder="All Stations" className="w-44" />
          )}
          <FilterSelect value={itype} onChange={(v) => { setItype(v); setPg(1); }}
            options={filterTypes.map((t) => ({ value: t, label: t }))}
            placeholder="All Types" className="w-36" />
          <FilterSelect value={dateRange} onChange={(v) => { setDateRange(v); setPg(1); }}
            options={[
              { value: "today", label: "Today" },
              { value: "last-7", label: "Last 7 days" },
              { value: "last-30", label: "Last 30 days" },
              { value: "last-3m", label: "Last 3 months" },
              { value: "this-year", label: "This Year" },
            ]}
            placeholder="Date Range" className="w-40" />
          {(search || country || station || itype || dateRange) && (
            <button onClick={() => { setSearch(""); setCountry(""); setStation(""); setItype(""); setDateRange(""); setPg(1); }}
              className="px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap flex items-center gap-1.5">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">Showing <span className="text-foreground">{statements.length}</span> of <span className="text-foreground">{meta.total}</span> statements</span>
          </div>
          <span className="text-xs text-muted-foreground">Page {pg} of {meta.totalPage}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">S/N</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">MSISDN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Ticket</th>
                {showStationRef && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Station Ref</th>}
                {showStation && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Station</th>}
                {showShowColumn && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Show</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center animate-pulse"><Search size={18} className="text-muted-foreground" /></div>
                      <p className="text-sm font-semibold text-foreground">Loading statements…</p>
                    </div>
                  </td>
                </tr>
              ) : statements.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Search size={18} className="text-muted-foreground" /></div>
                      <p className="text-sm font-semibold text-foreground">No statements found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : statements.map((s: any, i: number) => (
                <tr key={s._id || s.ticket} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{(pg - 1) * PER + i + 1}</td>
                   <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground whitespace-nowrap">{s.createdAt ? formatDate(s.createdAt, timezone) : "—"}</td>
                  <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-foreground">{s.msisdn}</td>
                  <td className="px-4 py-3.5 text-xs font-bold font-['JetBrains_Mono',monospace] text-foreground">{s.currencySymbol}{s.amount}</td>
                  <td className="px-4 py-3.5">
                    {isPresenter ? (
                      <span className="text-xs font-semibold font-['JetBrains_Mono',monospace] text-foreground">{s.ticket}</span>
                    ) : (
                      <Link href={`/listener-statement/${s._id}`} className="text-xs font-semibold font-['JetBrains_Mono',monospace] text-[#02B2FF] hover:underline">{s.ticket}</Link>
                    )}
                  </td>
                  {showStationRef && <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{s.stationRef}</td>}
                  {showStation && <td className="px-4 py-3.5 text-xs font-medium text-foreground">{s.mediaStation}</td>}
                  {showShowColumn && <td className="px-4 py-3.5 text-xs text-foreground">{s.showName || "—"}</td>}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.type === "Message" ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800" : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"}`}>
                      {s.type === "Message" ? <MessageSquare size={10} /> : <Phone size={10} />}{s.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge label={s.status} variant={sv(s.status)} /></td>
                  <td className="px-4 py-3.5 text-center">
                    {isPresenter ? (
                      <button onClick={() => setViewing(s)} className="inline-flex items-center rounded-lg border border-[#02B2FF] px-4 py-1.5 text-xs font-semibold text-[#02B2FF] hover:bg-muted transition-colors" title="View statement">
                        View
                      </button>
                    ) : (
                      <Link href={`/listener-statement/${s._id}`} className="w-7 h-7 rounded-lg inline-flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all" title="View statement">
                        <Eye size={14} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination pg={pg} totalPages={meta.totalPage} totalItems={meta.total} itemLabel="statements" setPg={setPg} />
      </div>

      {/* Presenter slide-over drawer */}
      {isPresenter && viewing && (
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
