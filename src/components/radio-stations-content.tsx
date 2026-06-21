"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Radio,
  Download,
  Plus,
  Search,
  Eye,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import stationsData from "@/mock/stations.json";
import { toast } from "sonner";

type Station = (typeof stationsData.stations)[number];

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda"];
const PARTNERS = ["Capital FM Group", "Radio Uganda Ltd", "Joy Media Ghana", "Tanzania Media Corp", "Peace FM Group"];

const PER_PAGE = 8;

export default function RadioStationsContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const showCountry = isSuperAdmin;
  const showPartner = isSuperAdmin;

  const allRows = useMemo(
    () => stationsData.stations.filter((s) => s.category === "radio"),
    []
  );

  const [rows, setRows] = useState<Station[]>(() => {
    if (isPartnerAdmin) return allRows.filter((s) => s.partnerId === "PA-001");
    return allRows;
  });

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const [viewing, setViewing] = useState<Station | null>(null);

  const total = rows.length;
  const active = rows.filter((r) => r.status === "Active").length;
  const inactive = total - active;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.stationAdmin.toLowerCase().includes(q)) return false;
      if (showCountry && countryFilter && r.country !== countryFilter) return false;
      if (showPartner && partnerFilter && r.partner !== partnerFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, countryFilter, partnerFilter, statusFilter, showCountry, showPartner]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);

  const colCount = (showCountry ? 1 : 0) + (showPartner ? 1 : 0) + 7;

  function toggleStatus(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r
      )
    );
    const r = rows.find((r) => r.id === id);
    toast.success(`Station ${r?.status === "Active" ? "deactivated" : "activated"} successfully`);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#02B2FF]">
            <Radio size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Radio Stations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage radio station accounts and configurations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-white hover:bg-muted transition-colors">
            <Download size={14} className="text-muted-foreground" /> Export
          </button>
          <Link
            href="/station-management/radio/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Radio Station
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Radio Stations"
          value={String(total)}
          icon={<Radio size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
          trend={{ val: "+1 this month vs last month", up: true }}
        />
        <KpiCard
          label="Active Stations"
          value={String(active)}
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Inactive Stations"
          value={String(inactive)}
          icon={<AlertCircle size={16} className="text-red-400" />}
          iconBg="bg-red-50"
        />
        <KpiCard
          label="New This Month"
          value="0"
          icon={<Plus size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search radio stations..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showCountry && (
            <FilterSelect value={countryFilter} onChange={(v) => { setCountryFilter(v); setPg(1); }}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="All Countries" className="w-44" />
          )}
          {showPartner && (
            <FilterSelect value={partnerFilter} onChange={(v) => { setPartnerFilter(v); setPg(1); }}
              options={PARTNERS.map((p) => ({ value: p, label: p }))}
              placeholder="All Partners" className="w-44" />
          )}
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
            placeholder="All Status" className="w-44" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} records
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station Name</th>
                {showCountry && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                )}
                {showPartner && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Partner</th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station Admin</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stations</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Shows</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No radio stations found.
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="text-xs font-semibold text-foreground">{row.name}</span>
                        <div className="text-[11px] text-muted-foreground font-['JetBrains_Mono',monospace]">{row.id}</div>
                      </div>
                    </td>
                    {showCountry && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-muted-foreground">{row.country}</span>
                      </td>
                    )}
                    {showPartner && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">{row.partner}</span>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.stationAdmin}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground">{row.mediaStations}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground">{row.activeShows}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={row.status} variant={sv(row.status)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{row.created}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewing(row)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleStatus(row.id)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            row.status === "Active"
                              ? "hover:bg-red-50 text-muted-foreground hover:text-red-500"
                              : "hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"
                          }`}
                          title={row.status === "Active" ? "Deactivate" : "Activate"}
                        >
                          {row.status === "Active" ? "🔴" : "🟢"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={totalPgs} totalItems={filtered.length} itemLabel="records" setPg={setPg} />
      </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <div className="text-sm font-bold text-foreground">{viewing.name}</div>
                <div className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{viewing.id}</div>
              </div>
              <button onClick={() => setViewing(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div>
                <div className="text-sm font-medium text-foreground">{viewing.country}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Partner</div>
                <div className="text-sm font-medium text-foreground">{viewing.partner}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Station Admin</div>
                <div className="text-sm font-medium text-foreground">{viewing.stationAdmin}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Active Shows</div>
                <div className="text-sm font-medium text-foreground">{viewing.activeShows}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Media Stations</div>
                <div className="text-sm font-medium text-foreground">{viewing.mediaStations}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
                <StatusBadge label={viewing.status} variant={sv(viewing.status)} />
              </div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</div>
                <div className="text-sm text-foreground">{viewing.description}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created</div>
                <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{viewing.created}</div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button onClick={() => setViewing(null)} className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-slate-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


