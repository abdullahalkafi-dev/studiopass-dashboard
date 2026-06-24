"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio, Download, Plus, Search, Eye, Edit2, Power, PowerOff,
  CheckCircle2, AlertCircle, Loader2, X,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetStationsQuery, useDeactivateStationMutation, useReactivateStationMutation } from "@/features/station/stationApi";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useRole } from "@/contexts/role-context";
import { toast } from "sonner";

const PER_PAGE = 8;

export default function ChannelsContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const [viewing, setViewing] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPg(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useGetStationsQuery({
    page: pg, limit: PER_PAGE, category: "channel",
    search: debouncedSearch || undefined,
    country: countryFilter || undefined,
    partner: partnerFilter || undefined,
    isActive: statusFilter || undefined,
  });
  const { data: countriesData } = useGetCountriesQuery();
  const { data: partnersData } = useGetPartnersQuery({ limit: 100 });
  const [deactivateStation] = useDeactivateStationMutation();
  const [reactivateStation] = useReactivateStationMutation();

  const rows = data?.data || [];
  const meta = data?.meta;
  const countries = countriesData?.data || [];
  const partners = partnersData?.data || [];
  const total = meta?.total || 0;

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    if (currentActive) {
      await deactivateStation(id).unwrap().then(() => toast.success("Channel deactivated")).catch(() => toast.error("Failed"));
    } else {
      await reactivateStation(id).unwrap().then(() => toast.success("Channel reactivated")).catch(() => toast.error("Failed"));
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-[#02B2FF]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]"><Radio size={18} /></div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Channels</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage all channels on the platform.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-white hover:bg-muted transition-colors">
            <Download size={14} className="text-muted-foreground" /> Export
          </button>
          <Link href="/station-management/create" className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
            <Plus size={14} /> Add Channel
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Channels" value={String(total)} icon={<Radio size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
        <KpiCard label="Active" value={String(rows.filter((r: any) => r.isActive).length)} icon={<CheckCircle2 size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KpiCard label="Inactive" value={String(rows.filter((r: any) => !r.isActive).length)} icon={<AlertCircle size={16} className="text-red-400" />} iconBg="bg-red-50" />
        <KpiCard label="Countries" value={String(new Set(rows.map((r: any) => typeof r.country === "object" ? r.country?.id : r.country)).size)} icon={<Radio size={16} className="text-violet-500" />} iconBg="bg-violet-50" />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all" />
          </div>
          {isSuperAdmin && <FilterSelect value={countryFilter} onChange={(v) => { setCountryFilter(v); setPg(1); }} options={countries.map((c: any) => ({ value: c.id, label: `${c.name} (${c.code})` }))} placeholder="All Countries" className="w-48" />}
          {isSuperAdmin && <FilterSelect value={partnerFilter} onChange={(v) => { setPartnerFilter(v); setPg(1); }} options={partners.map((p: any) => ({ value: p.id, label: p.name }))} placeholder="All Partners" className="w-48" />}
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPg(1); }} options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} placeholder="All Status" className="w-40" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">Showing {rows.length} of {total} records</span>
          <span className="text-xs text-muted-foreground">Page {pg} of {meta?.totalPage || 1}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Channel Name</th>
                {isSuperAdmin && <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>}
                {isSuperAdmin && <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Partner</th>}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={isSuperAdmin ? 7 : 5} className="px-5 py-12 text-center text-sm text-muted-foreground">No channels found.</td></tr>
              ) : rows.map((row: any) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <span className="text-xs font-semibold text-foreground">{row.name}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">({row.stationCode})</span>
                    </div>
                  </td>
                  {isSuperAdmin && <td className="px-5 py-3.5 text-xs font-medium text-foreground">{typeof row.country === "object" ? row.country?.name : "-"}</td>}
                  {isSuperAdmin && <td className="px-5 py-3.5 text-xs font-medium text-foreground">{typeof row.partner === "object" ? row.partner?.name : "-"}</td>}
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{row.stationCode}</td>
                  <td className="px-5 py-3.5"><StatusBadge label={row.isActive ? "Active" : "Inactive"} variant={sv(row.isActive ? "Active" : "Inactive")} /></td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewing(row)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all" title="View"><Eye size={14} /></button>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => handleToggleStatus(row.id, row.isActive)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${row.isActive ? "hover:bg-red-50 text-muted-foreground hover:text-red-500" : "hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"}`} title={row.isActive ? "Deactivate" : "Activate"}>
                        {row.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination pg={pg} totalPages={meta?.totalPage || 1} totalItems={total} itemLabel="records" setPg={setPg} />
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div><div className="text-sm font-bold text-foreground">{viewing.name}</div><div className="text-xs text-muted-foreground">{viewing.stationCode}</div></div>
              <button onClick={() => setViewing(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"><X size={16} className="text-muted-foreground" /></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Name</div><div className="text-sm font-medium text-foreground">{viewing.name}</div></div>
              <div><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Code</div><div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{viewing.stationCode}</div></div>
              {isSuperAdmin && <div><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div><div className="text-sm font-medium text-foreground">{typeof viewing.country === "object" ? viewing.country?.name : "-"}</div></div>}
              {isSuperAdmin && <div><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Partner</div><div className="text-sm font-medium text-foreground">{typeof viewing.partner === "object" ? viewing.partner?.name : "-"}</div></div>}
              <div><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div><StatusBadge label={viewing.isActive ? "Active" : "Inactive"} variant={sv(viewing.isActive ? "Active" : "Inactive")} /></div>
              <div><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created</div><div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{new Date(viewing.createdAt).toLocaleDateString()}</div></div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button onClick={() => setViewing(null)} className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-slate-200 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
