"use client";

import { useState } from "react";
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
  Loader2,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import { useGetMediaStationsQuery, useCreateMediaStationMutation } from "@/features/media-station/mediaStationApi";
import { toast } from "sonner";

interface MediaStationRow {
  id: string;
  fullName: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role: string;
  station?: {
    id: string;
    name: string;
    stationCode: string;
    category?: string;
    country?: any;
    partner?: any;
  } | null;
  isBlocked: boolean;
  createdAt: string;
}

const PER_PAGE = 8;

export default function MediaStationsContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const showStation = isSuperAdmin || isPartnerAdmin;

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const [viewing, setViewing] = useState<MediaStationRow | null>(null);

  const { data, isLoading, isFetching } = useGetMediaStationsQuery({
    page: pg,
    limit: PER_PAGE,
    search: search || undefined,
    station: stationFilter || undefined,
    isActive: statusFilter === "Active" ? "true" : statusFilter === "Inactive" ? "false" : undefined,
  });

  const rows: MediaStationRow[] = data?.data || [];
  const meta = data?.meta || { page: 1, limit: PER_PAGE, total: 0, totalPage: 1 };

  const total = meta.total;
  const active = rows.filter((r) => !r.isBlocked).length;
  const inactive = total - active;

  const colCount = (showStation ? 1 : 0) + 5;

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
        {/* Table Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            {isLoading || isFetching ? "Loading..." : `Showing ${rows.length} of ${total} records`}
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {meta.totalPage}
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
              {isLoading ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center">
                    <Loader2 size={20} className="animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No media station users found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={row.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "MS"} size="sm" />
                        <span className="text-xs font-semibold text-foreground">
                          {row.fullName}
                        </span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.email || "—"}</span>
                    </td>
                    {/* Assigned Station */}
                    {showStation && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">
                          {row.station?.name || "—"}
                        </span>
                      </td>
                    )}
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge label={row.isBlocked ? "Inactive" : "Active"} variant={sv(row.isBlocked ? "Inactive" : "Active")} />
                    </td>
                    {/* Created Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {new Date(row.createdAt).toLocaleDateString("en-CA")}
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
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            !row.isBlocked
                              ? "hover:bg-red-50 text-muted-foreground hover:text-red-500"
                              : "hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"
                          }`}
                          title={row.isBlocked ? "Activate" : "Deactivate"}
                        >
                          {row.isBlocked ? <UserCheck size={14} /> : <UserX size={14} />}
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
        <TablePagination pg={pg} totalPages={meta.totalPage} totalItems={total} itemLabel="records" setPg={setPg} />
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
                <Avatar initials={viewing.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "MS"} />
                <div>
                  <div className="text-sm font-bold text-foreground">{viewing.fullName}</div>
                  <div className="text-xs text-muted-foreground">{viewing.email || "—"}</div>
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
                <div className="text-sm font-medium text-foreground">{viewing.fullName}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Email
                </div>
                <div className="text-sm font-medium text-foreground">{viewing.email || "—"}</div>
              </div>
              {showStation && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Assigned Station
                  </div>
                  <div className="text-sm font-medium text-foreground">{viewing.station?.name || "—"}</div>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Status
                </div>
                <StatusBadge label={viewing.isBlocked ? "Inactive" : "Active"} variant={sv(viewing.isBlocked ? "Inactive" : "Active")} />
              </div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Created
                </div>
                <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
                  {new Date(viewing.createdAt).toLocaleDateString("en-CA")}
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
