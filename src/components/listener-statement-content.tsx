"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { SectionHeader, StatusBadge, sv } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import {
  FileText, Download, Search, Eye, X, FileDown,
  Activity, MessageSquare, Phone, DollarSign, ArrowLeft,
} from "lucide-react";

interface Statement {
  id: string; created: string; msisdn: string; amount: string; ticket: string;
  stationRef: string; mediaStation: string; stationId: string; show: string;
  type: string; operator: string; country: string; status: string;
}

const STATEMENTS: Statement[] = [
  { id:"LS-004821", created:"2024-06-18 09:02", msisdn:"+254712345678", amount:"5.00",  ticket:"TKT-8821", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Morning Drive",  type:"Message", operator:"Safaricom", country:"Kenya",    status:"Successful" },
  { id:"LS-004820", created:"2024-06-18 08:47", msisdn:"+256701234567", amount:"2.50",  ticket:"TKT-8820", stationRef:"RAD-UG-01", mediaStation:"Radio Uganda",     stationId:"RS-002", show:"Evening News",   type:"Call",    operator:"MTN",       country:"Uganda",   status:"Successful" },
  { id:"LS-004819", created:"2024-06-18 08:31", msisdn:"+233241234567", amount:"1.00",  ticket:"TKT-8819", stationRef:"JOY-FM-GH", mediaStation:"Joy FM Ghana",     stationId:"RS-003", show:"Breakfast Show", type:"Message", operator:"MTN",       country:"Ghana",    status:"Successful" },
  { id:"LS-004818", created:"2024-06-18 08:14", msisdn:"+255612345678", amount:"3.00",  ticket:"TKT-8818", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Weekend Vibes",  type:"Call",    operator:"Airtel",    country:"Tanzania", status:"Successful" },
  { id:"LS-004817", created:"2024-06-18 07:58", msisdn:"+2348012345678",amount:"10.00", ticket:"TKT-8817", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Talk Back",      type:"Message", operator:"Airtel",    country:"Nigeria",  status:"Successful" },
  { id:"LS-004816", created:"2024-06-18 07:42", msisdn:"+250781234567", amount:"2.00",  ticket:"TKT-8816", stationRef:"PEA-FM-GH", mediaStation:"Peace FM",         stationId:"RS-004", show:"Sports Hour",    type:"Call",    operator:"MTN",       country:"Rwanda",   status:"Successful" },
  { id:"LS-004815", created:"2024-06-18 07:20", msisdn:"+254798765432", amount:"5.00",  ticket:"TKT-8815", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Morning Drive",  type:"Message", operator:"Airtel",    country:"Kenya",    status:"Successful" },
  { id:"LS-004814", created:"2024-06-18 07:05", msisdn:"+256702345678", amount:"2.50",  ticket:"TKT-8814", stationRef:"NTV-UG-01", mediaStation:"NTV Uganda",       stationId:"TV-002", show:"Evening News",   type:"Call",    operator:"Airtel",    country:"Uganda",   status:"Successful" },
  { id:"LS-004813", created:"2024-06-18 06:48", msisdn:"+233501234567", amount:"1.00",  ticket:"TKT-8813", stationRef:"JOY-FM-GH", mediaStation:"Joy FM Ghana",     stationId:"RS-003", show:"Talk Back",      type:"Message", operator:"Vodacom",   country:"Ghana",    status:"Successful" },
  { id:"LS-004812", created:"2024-06-18 06:30", msisdn:"+255623456789", amount:"3.00",  ticket:"TKT-8812", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Breakfast Show", type:"Call",    operator:"Vodacom",   country:"Tanzania", status:"Successful" },
  { id:"LS-004811", created:"2024-06-17 22:15", msisdn:"+2348023456789",amount:"10.00", ticket:"TKT-8811", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Sports Hour",    type:"Message", operator:"Glo",       country:"Nigeria",  status:"Successful" },
  { id:"LS-004810", created:"2024-06-17 21:50", msisdn:"+254723456789", amount:"5.00",  ticket:"TKT-8810", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Weekend Vibes",  type:"Call",    operator:"Safaricom", country:"Kenya",    status:"Successful" },
  { id:"LS-004809", created:"2024-06-17 21:22", msisdn:"+250782345678", amount:"2.00",  ticket:"TKT-8809", stationRef:"RAD-UG-01", mediaStation:"Radio Uganda",     stationId:"RS-002", show:"Morning Drive",  type:"Message", operator:"MTN",       country:"Rwanda",   status:"Successful" },
  { id:"LS-004808", created:"2024-06-17 20:48", msisdn:"+233209876543", amount:"1.00",  ticket:"TKT-8808", stationRef:"PEA-FM-GH", mediaStation:"Peace FM",         stationId:"RS-004", show:"Evening News",   type:"Call",    operator:"Orange",    country:"Ghana",    status:"Successful" },
  { id:"LS-004807", created:"2024-06-17 20:10", msisdn:"+255634567890", amount:"3.00",  ticket:"TKT-8807", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Talk Back",      type:"Message", operator:"Airtel",    country:"Tanzania", status:"Successful" },
  { id:"LS-004806", created:"2024-06-17 19:44", msisdn:"+254733456789", amount:"5.00",  ticket:"TKT-8806", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Breakfast Show", type:"Call",    operator:"Safaricom", country:"Kenya",    status:"Successful" },
  { id:"LS-004805", created:"2024-06-17 19:20", msisdn:"+2349012345678",amount:"10.00", ticket:"TKT-8805", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Sports Hour",    type:"Message", operator:"9Mobile",   country:"Nigeria",  status:"Successful" },
  { id:"LS-004804", created:"2024-06-17 18:58", msisdn:"+256703456789", amount:"2.50",  ticket:"TKT-8804", stationRef:"NTV-UG-01", mediaStation:"NTV Uganda",       stationId:"TV-002", show:"Morning Drive",  type:"Call",    operator:"MTN",       country:"Uganda",   status:"Successful" },
  { id:"LS-004803", created:"2024-06-17 18:33", msisdn:"+254745678901", amount:"5.00",  ticket:"TKT-8803", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Weekend Vibes",  type:"Message", operator:"Airtel",    country:"Kenya",    status:"Successful" },
  { id:"LS-004802", created:"2024-06-17 18:05", msisdn:"+233261234567", amount:"1.00",  ticket:"TKT-8802", stationRef:"JOY-FM-GH", mediaStation:"Joy FM Ghana",     stationId:"RS-003", show:"Evening News",   type:"Call",    operator:"MTN",       country:"Ghana",    status:"Successful" },
  { id:"LS-004801", created:"2024-06-17 17:40", msisdn:"+255645678901", amount:"3.00",  ticket:"TKT-8801", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Breakfast Show", type:"Message", operator:"Vodacom",   country:"Tanzania", status:"Successful" },
  { id:"LS-004800", created:"2024-06-17 17:12", msisdn:"+2348034567890",amount:"10.00", ticket:"TKT-8800", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Talk Back",      type:"Call",    operator:"Airtel",    country:"Nigeria",  status:"Successful" },
  { id:"LS-004799", created:"2024-06-17 16:48", msisdn:"+250783456789", amount:"2.00",  ticket:"TKT-8799", stationRef:"RAD-UG-01", mediaStation:"Radio Uganda",     stationId:"RS-002", show:"Sports Hour",    type:"Message", operator:"MTN",       country:"Rwanda",   status:"Successful" },
  { id:"LS-004798", created:"2024-06-17 16:22", msisdn:"+256704567890", amount:"2.50",  ticket:"TKT-8798", stationRef:"NTV-UG-01", mediaStation:"NTV Uganda",       stationId:"TV-002", show:"Morning Drive",  type:"Call",    operator:"Airtel",    country:"Uganda",   status:"Successful" },
  { id:"LS-004797", created:"2024-06-17 15:55", msisdn:"+254756789012", amount:"5.00",  ticket:"TKT-8797", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Evening News",   type:"Message", operator:"Safaricom", country:"Kenya",    status:"Successful" },
  { id:"LS-004796", created:"2024-06-17 15:28", msisdn:"+233278901234", amount:"1.00",  ticket:"TKT-8796", stationRef:"JOY-FM-GH", mediaStation:"Joy FM Ghana",     stationId:"RS-003", show:"Weekend Vibes",  type:"Call",    operator:"MTN",       country:"Ghana",    status:"Successful" },
  { id:"LS-004795", created:"2024-06-17 15:02", msisdn:"+255656789012", amount:"3.00",  ticket:"TKT-8795", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Breakfast Show", type:"Message", operator:"Vodacom",   country:"Tanzania", status:"Successful" },
  { id:"LS-004794", created:"2024-06-17 14:35", msisdn:"+2348045678901",amount:"10.00", ticket:"TKT-8794", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Talk Back",      type:"Call",    operator:"Glo",       country:"Nigeria",  status:"Successful" },
  { id:"LS-004793", created:"2024-06-17 14:10", msisdn:"+250784567890", amount:"2.00",  ticket:"TKT-8793", stationRef:"RAD-UG-01", mediaStation:"Radio Uganda",     stationId:"RS-002", show:"Sports Hour",    type:"Message", operator:"MTN",       country:"Rwanda",   status:"Successful" },
  { id:"LS-004792", created:"2024-06-17 13:48", msisdn:"+254767890123", amount:"5.00",  ticket:"TKT-8792", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Morning Drive",  type:"Call",    operator:"Safaricom", country:"Kenya",    status:"Successful" },
];

const COUNTRIES = ["Kenya","Uganda","Ghana","Tanzania","Nigeria","Rwanda"];
const STATIONS = ["Capital FM Kenya","Radio Uganda","Joy FM Ghana","Hot 96","Citizen TV","NTV Uganda","Peace FM"];
const TYPES = ["Message","Call"];

function ExportModal({ onClose }: { onClose: () => void }) {
  const [fmt, setFmt] = useState("CSV");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
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
              {(["CSV","Excel","PDF"] as const).map((f) => (
                <button key={f} onClick={() => setFmt(f)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all flex flex-col items-center gap-1 ${fmt===f ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm" : "border-border text-foreground hover:bg-muted"}`}>
                  <span className="text-base leading-none">{f==="CSV" ? "📄" : f==="Excel" ? "📊" : "📑"}</span>{f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-muted/20 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-foreground">Cancel</button>
          <button className="px-5 py-2.5 text-sm font-semibold bg-[#02B2FF] text-white rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2">
            <Download size={14} />Export {fmt}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListenerStatementContent() {
  const role = useRole();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [station, setStation] = useState("");
  const [itype, setItype] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [pg, setPg] = useState(1);
  const [showExport, setShowExport] = useState(false);
  const PER = 10;

  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";

  const searchPlaceholder = isSuperAdmin
    ? "Search by ID, MSISDN, ticket, show…"
    : "Search by transaction ID, MSISDN, operator, receipt, station…";

  const filtered = useMemo(() => STATEMENTS.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.id.toLowerCase().includes(q) && !s.msisdn.includes(q) && !s.ticket.toLowerCase().includes(q) && !s.show.toLowerCase().includes(q) && !s.mediaStation.toLowerCase().includes(q)) return false;
    if (country && s.country !== country) return false;
    if (station && s.mediaStation !== station) return false;
    if (itype && s.type !== itype) return false;
    return true;
  }), [search, country, station, itype]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER));
  const paged = filtered.slice((pg - 1) * PER, pg * PER);
  const totalMsgs = filtered.filter((s) => s.type === "Message").length;
  const totalCalls = filtered.filter((s) => s.type === "Call").length;
  const totalRev = filtered.reduce((acc, s) => acc + parseFloat(s.amount), 0);

  const showStationRef = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;
  const showCountryFilter = isSuperAdmin;
  const showStationFilter = isSuperAdmin || isPartnerAdmin;

  return (
    <div className="space-y-6">
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center">
            <FileText size={18} className="text-[#02B2FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Listener Statement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor all successful listener interactions across the platform.</p>
          </div>
        </div>
        <button onClick={() => setShowExport(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
          <Download size={14} /> Export Statement
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Interactions" value={String(filtered.length)} sub="All successful listener interactions" trend={{val:"+12.4%",up:true}} icon={<Activity size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
        <KpiCard label="Total Messages" value={String(totalMsgs)} sub="Successful messages sent" trend={{val:"+9.8%",up:true}} icon={<MessageSquare size={16} className="text-violet-500"/>} iconBg="bg-violet-50"/>
        <KpiCard label="Total Calls" value={String(totalCalls)} sub="Successful calls made" trend={{val:"+15.2%",up:true}} icon={<Phone size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
        <KpiCard label="Total Interaction Revenue" value={`$${totalRev.toFixed(2)}`} sub="Revenue from interactions" trend={{val:"+18.6%",up:true}} icon={<DollarSign size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder={searchPlaceholder} value={search} onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all" />
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
            options={TYPES.map((t) => ({ value: t, label: t }))}
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
            <span className="text-xs font-semibold text-muted-foreground">Showing <span className="text-foreground">{paged.length}</span> of <span className="text-foreground">{filtered.length}</span> statements</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MessageSquare size={11} className="text-violet-400" />{totalMsgs} messages</span>
              <span className="flex items-center gap-1"><Phone size={11} className="text-emerald-400" />{totalCalls} calls</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Page {pg} of {totalPgs}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">S/N</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Created Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">MSISDN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Ticket</th>
                {showStationRef && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Station Ref</th>}
                {showStation && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Station</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Show</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Operator</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={showStationRef ? 12 : showStation ? 11 : 10} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Search size={18} className="text-muted-foreground" /></div>
                      <p className="text-sm font-semibold text-foreground">No statements found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : paged.map((s, i) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{(pg - 1) * PER + i + 1}</td>
                  <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground whitespace-nowrap">{s.created}</td>
                  <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-foreground">{s.msisdn}</td>
                  <td className="px-4 py-3.5 text-xs font-bold font-['JetBrains_Mono',monospace] text-foreground">${s.amount}</td>
                  <td className="px-4 py-3.5">
                    <Link href={`/listener-statement/${s.id}`} className="text-xs font-semibold font-['JetBrains_Mono',monospace] text-[#02B2FF] hover:underline">{s.ticket}</Link>
                  </td>
                  {showStationRef && <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{s.stationRef}</td>}
                  {showStation && <td className="px-4 py-3.5 text-xs font-medium text-foreground">{s.mediaStation}</td>}
                  <td className="px-4 py-3.5 text-xs text-foreground">{s.show}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.type === "Message" ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      {s.type === "Message" ? <MessageSquare size={10} /> : <Phone size={10} />}{s.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-foreground">{s.operator}</td>
                  <td className="px-4 py-3.5"><StatusBadge label={s.status} variant={sv(s.status)} /></td>
                  <td className="px-4 py-3.5 text-center">
                    <Link href={`/listener-statement/${s.id}`} className="w-7 h-7 rounded-lg inline-flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all" title="View statement">
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <TablePagination pg={pg} totalPages={totalPgs} totalItems={filtered.length} itemLabel="statements" setPg={setPg} />
      </div>
    </div>
  );
}
