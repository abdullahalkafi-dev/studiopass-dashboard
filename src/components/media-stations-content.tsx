"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Monitor,
  Download,
  Plus,
  Search,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  X,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import usersData from "@/mock/users.json";
import stationsData from "@/mock/stations.json";
import { toast } from "sonner";

type MediaStation = (typeof usersData.mediaStations)[number];

interface EnrichedMediaStation extends MediaStation {
  partner: string;
}

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda", "South Africa", "Ethiopia"];
const PARTNERS = ["Capital FM Group", "Radio Uganda Ltd", "Joy Media Ghana", "Tanzania Media Corp", "Peace FM Group"];

const PER_PAGE = 8;

function enrichData(rows: MediaStation[]): EnrichedMediaStation[] {
  const stationMap = new Map(
    stationsData.stations.map((s) => [s.id, s.partner])
  );
  return rows.map((r) => ({
    ...r,
    partner: stationMap.get(r.stationId) ?? "—",
  }));
}

export default function MediaStationsContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const showCountry = isSuperAdmin;
  const showPartner = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;

  const allRows = enrichData(usersData.mediaStations as MediaStation[]);

  const [rows, setRows] = useState<EnrichedMediaStation[]>(() => {
    if (isPartnerAdmin) {
      return allRows.filter((r) => {
        const station = stationsData.stations.find((s) => s.id === r.stationId);
        return station?.partnerId === "PA-001";
      });
    }
    if (isStationAdmin) {
      return allRows.filter((r) => r.stationId === "RS-001");
    }
    return allRows;
  });

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const [viewing, setViewing] = useState<EnrichedMediaStation | null>(null);

  const total = rows.length;
  const active = rows.filter((r) => r.status === "Active").length;
  const inactive = total - active;

  const uniqueStations = useMemo(() => {
    return [...new Set(rows.map((r) => r.assignedStation))].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      if (showStation && stationFilter && r.assignedStation !== stationFilter) return false;
      if (showCountry && countryFilter && r.country !== countryFilter) return false;
      if (showPartner && partnerFilter && r.partner !== partnerFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, stationFilter, countryFilter, partnerFilter, statusFilter, showStation, showCountry, showPartner]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);

  const colCount = (showStation ? 1 : 0) + (showCountry ? 1 : 0) + (showPartner ? 1 : 0) + 5;

  function toggleStatus(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r
      )
    );
    const r = rows.find((r) => r.id === id);
    toast.success(`User ${r?.status === "Active" ? "deactivated" : "activated"} successfully`);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Monitor size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Media Stations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage media station operational accounts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-white hover:bg-muted transition-colors">
            <Download size={14} className="text-muted-foreground" /> Export
          </button>
          <Link
            href="/users/media-stations/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Media Station
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Media Stations"
          value={String(total)}
          icon={<Monitor size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
          trend={{ val: "+1 this month", up: true }}
        />
        <KpiCard
          label="Active"
          value={String(active)}
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Inactive"
          value={String(inactive)}
          icon={<AlertCircle size={16} className="text-red-400" />}
          iconBg="bg-red-50"
        />
        <KpiCard
          label="New This Month"
          value="1"
          icon={<UserPlus size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search media station..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPg(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showStation && (
            <div className="w-44">
              <select
                value={stationFilter}
                onChange={(e) => {
                  setStationFilter(e.target.value);
                  setPg(1);
                }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
              >
                <option value="">All Stations</option>
                {uniqueStations.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          {showCountry && (
            <div className="w-44">
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setPg(1);
                }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          {showPartner && (
            <div className="w-44">
              <select
                value={partnerFilter}
                onChange={(e) => {
                  setPartnerFilter(e.target.value);
                  setPg(1);
                }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
              >
                <option value="">All Partners</option>
                {PARTNERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
          <div className="w-44">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPg(1);
              }}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} records
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Email
                </th>
                {showStation && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Assigned Station
                  </th>
                )}
                {showCountry && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Country
                  </th>
                )}
                {showPartner && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Partner
                  </th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Created Date
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={row.avatar} size="sm" />
                        <span className="text-xs font-semibold text-foreground">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.email}</span>
                    </td>
                    {/* Assigned Station */}
                    {showStation && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">
                          {row.assignedStation}
                        </span>
                      </td>
                    )}
                    {/* Country */}
                    {showCountry && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">
                          {row.country}
                        </span>
                      </td>
                    )}
                    {/* Partner */}
                    {showPartner && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">
                          {row.partner}
                        </span>
                      </td>
                    )}
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge label={row.status} variant={sv(row.status)} />
                    </td>
                    {/* Created Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {row.created}
                      </span>
                    </td>
                    {/* Actions */}
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
                          {row.status === "Active" ? (
                            <UserX size={14} />
                          ) : (
                            <UserCheck size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {filtered.length} total records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPg((p) => Math.max(1, p - 1))}
                disabled={pg === 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPgs) }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    key={n}
                    onClick={() => setPg(n)}
                    className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                      pg === n
                        ? "bg-[#02B2FF] text-white"
                        : "border border-border bg-white text-foreground hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                onClick={() => setPg((p) => Math.min(totalPgs, p + 1))}
                disabled={pg === totalPgs}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
      </div>

      {/* View Modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar initials={viewing.avatar} />
                <div>
                  <div className="text-sm font-bold text-foreground">{viewing.name}</div>
                  <div className="text-xs text-muted-foreground">{viewing.email}</div>
                </div>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Full Name
                </div>
                <div className="text-sm font-medium text-foreground">{viewing.name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Email
                </div>
                <div className="text-sm font-medium text-foreground">{viewing.email}</div>
              </div>
              {showStation && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Assigned Station
                  </div>
                  <div className="text-sm font-medium text-foreground">{viewing.assignedStation}</div>
                </div>
              )}
              {showCountry && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Country
                  </div>
                  <div className="text-sm font-medium text-foreground">{viewing.country}</div>
                </div>
              )}
              {showPartner && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Partner
                  </div>
                  <div className="text-sm font-medium text-foreground">{viewing.partner}</div>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Status
                </div>
                <StatusBadge label={viewing.status} variant={sv(viewing.status)} />
              </div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Created
                </div>
                <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
                  {viewing.created}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
