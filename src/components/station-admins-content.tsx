"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Download, Plus, Search, Eye, Edit2, UserX, UserCheck,
  CheckCircle2, AlertCircle, Loader2, X,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { useGetStationAdminsQuery, useDeactivateUserMutation, useReactivateUserMutation } from "@/features/user/userApi";
import { EditStationModal } from "@/components/modals/edit-station-modal";
import { ViewStationDetailsModal } from "@/components/modals/view-station-details-modal";
import { ImageLightboxModal } from "@/components/modals/image-lightbox-modal";
import { useRole } from "@/contexts/role-context";
import { toast } from "sonner";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { resolveUrl } from "@/lib/utils";

const PER_PAGE = 8;

export default function StationAdminsContent() {
  const timezone = useTimezone();
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const [viewing, setViewing] = useState<any | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [editingStation, setEditingStation] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPg(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useGetStationAdminsQuery({
    page: pg, limit: PER_PAGE,
    search: debouncedSearch || undefined,
    isActive: statusFilter || undefined,
  });
  const [deactivateUser] = useDeactivateUserMutation();
  const [reactivateUser] = useReactivateUserMutation();

  const rows = data?.data || [];
  const meta = data?.meta;
  const total = meta?.total || 0;

  const handleToggleStatus = async (id: string, isBlocked: boolean) => {
    if (!isBlocked) {
      await deactivateUser(id).unwrap().then(() => toast.success("User deactivated")).catch(() => toast.error("Failed"));
    } else {
      await reactivateUser(id).unwrap().then(() => toast.success("User reactivated")).catch(() => toast.error("Failed"));
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={20} className="animate-spin text-[#02B2FF]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]"><Users size={18} /></div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Station Admins</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage all station administrator accounts.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors">
            <Download size={14} className="text-muted-foreground" /> Export
          </button>
          <Link href="/station-management/create" className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
            <Plus size={14} /> Add Station
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Station Admins" value={String(total)} icon={<Users size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
        <KpiCard label="Active" value={String(rows.filter((r: any) => !r.isBlocked).length)} icon={<CheckCircle2 size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KpiCard label="Blocked" value={String(rows.filter((r: any) => r.isBlocked).length)} icon={<AlertCircle size={16} className="text-red-400" />} iconBg="bg-red-50" />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all" />
          </div>
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[{ value: "false", label: "Active" }, { value: "true", label: "Blocked" }]} placeholder="All Status" className="w-40" />
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">No station admins found.</td></tr>
              ) : rows.map((row: any) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={row.avatar || (typeof row.stationId === "object" ? row.stationId?.logo : null)}
                        initials={row.fullName?.charAt(0) || "S"}
                        size="sm"
                        onClick={() => {
                          const imgSrc = row.avatar || (typeof row.stationId === "object" ? row.stationId?.logo : null);
                          if (imgSrc) {
                            const resolved = resolveUrl(imgSrc);
                            if (resolved) setLightboxSrc(resolved);
                          }
                        }}
                      />
                      <span className="text-xs font-semibold text-foreground">{row.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{row.email || row.phone || "-"}</td>
                  <td className="px-5 py-3.5 text-xs font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {typeof row.stationId === "object" && row.stationId?.logo ? (
                        <img
                          src={resolveUrl(row.stationId.logo)}
                          alt={row.stationId.name}
                          onClick={() => {
                            const resolved = resolveUrl(row.stationId.logo);
                            if (resolved) setLightboxSrc(resolved);
                          }}
                          className="w-6 h-6 rounded-full object-cover border border-border cursor-pointer hover:scale-110 transition-transform"
                          title="Click to zoom logo"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
                          {typeof row.stationId === "object" ? row.stationId?.name?.charAt(0) : "S"}
                        </div>
                      )}
                      <span>{typeof row.stationId === "object" ? row.stationId?.name : "-"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={row.isBlocked ? "Blocked" : "Active"} variant={sv(row.isBlocked ? "Inactive" : "Active")} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{row.createdAt ? formatDate(row.createdAt, timezone) : "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewing(row)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all" title="View"><Eye size={14} /></button>
                      <button
                        onClick={() => {
                          const station = typeof row.stationId === "object" ? row.stationId : null;
                          setEditingStation({
                            id: station?._id || station?.id || "",
                            name: station?.name || "",
                            stationCode: station?.stationCode || "",
                            description: station?.description || "",
                            website: station?.website || "",
                            logo: station?.logo || "",
                            coverImage: station?.coverImage || "",
                            adminUser: {
                              id: row.id,
                              fullName: row.fullName,
                              email: row.email,
                              phone: row.phone,
                            },
                          });
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleToggleStatus(row.id, row.isBlocked)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${!row.isBlocked ? "hover:bg-red-50 text-muted-foreground hover:text-red-500" : "hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"}`} title={row.isBlocked ? "Reactivate" : "Deactivate"}>
                        {row.isBlocked ? <UserCheck size={14} /> : <UserX size={14} />}
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

      <EditStationModal
        isOpen={!!editingStation}
        onClose={() => setEditingStation(null)}
        stationData={editingStation}
      />

      <ViewStationDetailsModal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        data={viewing}
      />

      <ImageLightboxModal
        isOpen={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
        src={lightboxSrc}
      />
    </div>
  );
}
