"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Mic,
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
import { toast } from "sonner";
import {
  useGetPresentersQuery,
  useDeactivatePresenterMutation,
  useReactivatePresenterMutation,
  useUpdatePresenterMutation,
} from "@/features/presenter/presenterApi";
import { ViewUserDetailsModal } from "@/components/modals/view-user-details-modal";
import { ImageLightboxModal } from "@/components/modals/image-lightbox-modal";
import { resolveUrl } from "@/lib/utils";
import { useGetStationsQuery } from "@/features/station/stationApi";

const PER_PAGE = 20;

export default function PresentersContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const showStation = isSuperAdmin || isPartnerAdmin;

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStationId, setEditStationId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: stationsData } = useGetStationsQuery({ limit: 100 });
  const stationsList = stationsData?.data || [];
  const stationOptions = stationsList.map((s: any) => ({
    value: s._id || s.id,
    label: s.name,
  }));

  // Debounce search
  useState(() => {
    let timer: NodeJS.Timeout;
    return {
      set: (val: string) => {
        clearTimeout(timer);
        setSearch(val);
        timer = setTimeout(() => setDebouncedSearch(val), 300);
      },
    };
  });

  // RTK Query
  const { data, isLoading } = useGetPresentersQuery({
    page: pg,
    limit: PER_PAGE,
    search: debouncedSearch || undefined,
    isActive: statusFilter || undefined,
    station: stationFilter || undefined,
  });

  const [deactivatePresenter] = useDeactivatePresenterMutation();
  const [reactivatePresenter] = useReactivatePresenterMutation();
  const [updatePresenter, { isLoading: isUpdating }] = useUpdatePresenterMutation();

  const handleStartEdit = (row: any) => {
    setEditing(row);
    setEditFullName(row.fullName || "");
    setEditEmail(row.email || "");
    setEditPhone(row.phone || "");
    setEditStationId(row.station?.id || row.station?._id || "");
    setEditPassword("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload: any = {
        id: editing.id,
        fullName: editFullName,
        email: editEmail || undefined,
        phone: editPhone || undefined,
      };
      if (showStation && editStationId) {
        payload.stationId = editStationId;
      }
      if (editPassword) {
        payload.password = editPassword;
      }
      const res = await updatePresenter(payload);
      if ("error" in res) {
        const errData = res.error as any;
        toast.error(errData?.data?.message || errData?.message || "Failed to update presenter");
        return;
      }
      toast.success(`${editFullName} updated successfully`);
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update presenter");
    }
  };

  const presenters = data?.data || [];
  const meta = data?.meta;

  const total = meta?.total || 0;
  const totalPgs = meta?.totalPage || 1;

  // KPI counts
  const activeCount = meta?.activeTotal ?? presenters.filter((p: any) => !p.isBlocked).length;
  const inactiveCount = meta?.inactiveTotal ?? (total - activeCount);

  async function toggleStatus(id: string, currentBlocked: boolean) {
    try {
      if (currentBlocked) {
        await reactivatePresenter(id).unwrap();
        toast.success("Presenter activated successfully");
      } else {
        await deactivatePresenter(id).unwrap();
        toast.success("Presenter deactivated successfully");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Mic size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Presenters</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage presenter accounts across all stations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors">
            <Download size={14} className="text-muted-foreground" /> Export
          </button>
          <Link
            href="/users/presenters/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Presenter
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Presenters"
          value={String(total)}
          icon={<Mic size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Active"
          value={String(activeCount)}
          icon={<CheckCircle2 size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Inactive"
          value={String(inactiveCount)}
          icon={<AlertCircle size={16} className="text-red-400" />}
          iconBg="bg-red-50"
        />
        <KpiCard
          label="New This Month"
          value="—"
          icon={<UserPlus size={16} className="text-violet-500" />}
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
              placeholder="Search presenter..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPg(1);
                // Debounce
                clearTimeout((window as any).__presenterSearchTimer);
                (window as any).__presenterSearchTimer = setTimeout(() => setDebouncedSearch(e.target.value), 300);
              }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showStation && (
            <FilterSelect
              value={stationFilter}
              onChange={(v) => { setStationFilter(v); setPg(1); }}
              options={stationOptions}
              placeholder="All Stations"
              className="w-44"
            />
          )}
          <FilterSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            placeholder="All Status"
            className="w-44"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            {isLoading ? "Loading..." : `Showing ${presenters.length} of ${total} records`}
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
                    Station
                  </th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : presenters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No presenters found.
                  </td>
                </tr>
              ) : (
                presenters.map((row: any) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={row.avatar || (typeof row.station === "object" ? row.station?.logo : (typeof row.stationId === "object" ? row.stationId?.logo : null))}
                          initials={row.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "P"}
                          size="sm"
                          onClick={() => {
                            const imgSrc = row.avatar || (typeof row.station === "object" ? row.station?.logo : (typeof row.stationId === "object" ? row.stationId?.logo : null));
                            if (imgSrc) {
                              const resolved = resolveUrl(imgSrc);
                              if (resolved) setLightboxSrc(resolved);
                            }
                          }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                          {row.fullName}
                        </span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.email || "—"}</span>
                    </td>
                    {/* Station */}
                    {showStation && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">
                          {row.station?.name || "—"}
                        </span>
                      </td>
                    )}
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={row.isBlocked ? "Inactive" : "Active"}
                        variant={sv(row.isBlocked ? "Inactive" : "Active")}
                      />
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
                          onClick={() => handleStartEdit(row)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleStatus(row.id, row.isBlocked)}
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
        <TablePagination pg={pg} totalPages={totalPgs} totalItems={total} itemLabel="records" setPg={setPg} />
      </div>

      <ViewUserDetailsModal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        data={viewing}
        title="Presenter Profile"
      />

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-popover rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <Edit2 size={16} className="text-[#02B2FF]" />
                Edit Presenter
              </div>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              {showStation && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Assigned Station</label>
                  <select
                    value={editStationId}
                    onChange={(e) => setEditStationId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                  >
                    <option value="">Select Station</option>
                    {stationsList.map((s: any) => (
                      <option key={s._id || s.id} value={s._id || s.id}>
                        {s.name} ({s.stationCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  New Password <span className="text-xs text-muted-foreground font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#02B2FF] hover:bg-[#00A0E8] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdating && <Loader2 size={14} className="animate-spin" />}
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ImageLightboxModal
        isOpen={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
        src={lightboxSrc}
      />
    </div>
  );
}
