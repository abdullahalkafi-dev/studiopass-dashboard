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
  CheckCircle2,
  Clock,
  UserPlus,
  X,
  Loader2,
  Save,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import { useGetShowsQuery, useUpdateShowMutation, type ShowResponse } from "@/features/show/showApi";
import { useGetPresentersQuery } from "@/features/user/userApi";
import { useAppSelector } from "@/store/hooks";
import { formatTime12h } from "@/components/shared/time-picker";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { toast } from "sonner";

interface Show {
  id: string;
  name: string;
  stationId: string;
  stationName: string;
  presenter: string;
  presenterId: string | null;
  days: string[];
  rawDays: string[];
  startTime: string;
  rawStartTime: string;
  endTime: string;
  rawEndTime: string;
  description: string;
  status: string;
  created: string;
}

const DAY_ABBR: Record<string, string> = {
  monday: "MON", tuesday: "TUE", wednesday: "WED", thursday: "THU",
  friday: "FRI", saturday: "SAT", sunday: "SUN",
};

function apiShowToRow(s: ShowResponse, timezone: string): Show {
  return {
    id: s.id || (s as any)._id || "",
    name: s.name,
    stationId: s.station?.id || (s.station as any)?._id || "",
    stationName: s.station?.name || "",
    presenter: s.presenter?.fullName || "Not Assigned",
    presenterId: s.presenter?.id || (s.presenter as any)?._id || null,
    days: s.days.map((d) => DAY_ABBR[d] || d.toUpperCase().slice(0, 3)),
    rawDays: s.days,
    startTime: formatTime12h(s.startTime),
    rawStartTime: s.startTime,
    endTime: formatTime12h(s.endTime),
    rawEndTime: s.endTime,
    description: s.description || "",
    status: s.status,
    created: s.createdAt ? formatDate(s.createdAt, timezone) : "",
  };
}

const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const PER_PAGE = 10;

const DAY_COLORS: Record<string, string> = {
  MON: "bg-blue-100 text-blue-700",
  TUE: "bg-emerald-100 text-emerald-700",
  WED: "bg-amber-100 text-amber-700",
  THU: "bg-violet-100 text-violet-700",
  FRI: "bg-rose-100 text-rose-700",
  SAT: "bg-cyan-100 text-cyan-700",
  SUN: "bg-orange-100 text-orange-700",
};

function DayBadges({ days }: { days: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => (
        <span key={d} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${DAY_COLORS[d] || "bg-muted text-muted-foreground"}`}>
          {d}
        </span>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-3 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-14 bg-muted rounded-xl animate-pulse" />
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShowsContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const isMediaStation = role === "media_station";
  const showStation = isSuperAdmin || isPartnerAdmin;
  const canCreate = !isMediaStation;

  const userStationId = useAppSelector((state) => state.auth.user?.stationId);
  const timezone = useTimezone();

  // Role-based query params
  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {};
    // station_admin and media_station: filter by their station
    if ((isStationAdmin || isMediaStation) && userStationId) {
      params.station = userStationId;
    }
    // super_admin and partner_admin: no station filter (backend scopes by role)
    return params;
  }, [isStationAdmin, isMediaStation, userStationId]);

  const { data: apiData, isLoading } = useGetShowsQuery(queryParams);

  const rows = useMemo(() => {
    if (!apiData?.data) return [];
    return (apiData.data as ShowResponse[]).map((s) => apiShowToRow(s, timezone));
  }, [apiData]);

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [presenterFilter, setPresenterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);

  const total = rows.length;
  const active = rows.filter((r) => r.status === "Active").length;
  const scheduled = rows.filter((r) => r.status === "Scheduled").length;
  const inactive = rows.filter((r) => r.status === "Inactive").length;

  const uniqueStations = useMemo(() => {
    return [...new Set(rows.map((s) => s.stationName))].sort();
  }, [rows]);

  const uniquePresenters = useMemo(() => {
    return [...new Set(rows.map((s) => s.presenter))].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.presenter.toLowerCase().includes(q)) return false;
      if (showStation && stationFilter && r.stationName !== stationFilter) return false;
      if (presenterFilter && r.presenter !== presenterFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, stationFilter, presenterFilter, statusFilter, showStation]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);

  const colCount = (showStation ? 1 : 0) + 7;

  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [assigningShow, setAssigningShow] = useState<Show | null>(null);

  const handleExportCSV = () => {
    if (!filtered.length) {
      toast.info("No content to export");
      return;
    }
    const headers = ["S/N", "Show Name", "Station", "Presenter", "Days", "Start Time", "End Time", "Status", "Created"];
    const csvRows = filtered.map((r, idx) => [
      idx + 1,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.stationName.replace(/"/g, '""')}"`,
      `"${r.presenter.replace(/"/g, '""')}"`,
      `"${r.days.join(", ")}"`,
      `"${r.startTime}"`,
      `"${r.endTime}"`,
      `"${r.status}"`,
      `"${r.created}"`,
    ]);
    const csvContent = [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shows_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Shows exported to CSV successfully");
  };

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Mic size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Shows</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage all shows across stations and channels.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors"
          >
            <Download size={14} className="text-muted-foreground" /> Export
          </button>
          {canCreate && (
            <Link
              href="/station-management/shows/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
            >
              <Plus size={14} /> Add Show
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Shows"
          value={String(total)}
          icon={<Mic size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Active Shows"
          value={String(active)}
          icon={<CheckCircle2 size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
          trend={total > 0 ? { val: `${Math.round((active / total) * 100)}% of total`, up: true } : undefined}
        />
        <KpiCard
          label="Scheduled Shows"
          value={String(scheduled)}
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Inactive Shows"
          value={String(inactive)}
          icon={<CheckCircle2 size={16} className="text-violet-500" />}
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
              placeholder="Search show name or presenter..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showStation && (
            <FilterSelect value={stationFilter} onChange={(v) => { setStationFilter(v); setPg(1); }}
              options={uniqueStations.map((s) => ({ value: s, label: s }))}
              placeholder="All Stations" className="w-48" />
          )}
          <FilterSelect value={presenterFilter} onChange={(v) => { setPresenterFilter(v); setPg(1); }}
            options={uniquePresenters.map((p) => ({ value: p, label: p }))}
            placeholder="All Presenters" className="w-44" />
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "Active", label: "Active" },
              { value: "Scheduled", label: "Scheduled" },
              { value: "Inactive", label: "Inactive" },
            ]}
            placeholder="All Status" className="w-44" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} shows
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">S/N</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show Name</th>
                {showStation && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show Presenter</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Day of Show</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">End Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No shows found.
                  </td>
                </tr>
              ) : (
                paged.map((row, idx) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {String((pg - 1) * PER_PAGE + idx + 1).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-foreground">{row.name}</span>
                    </td>
                    {showStation && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">{row.stationName}</span>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.presenter}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <DayBadges days={row.days} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{row.startTime}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{row.endTime}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={row.status} variant={sv(row.status)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/station-management/shows/${row.id}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="View"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => setEditingShow(row)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setAssigningShow(row)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="Assign Presenter"
                        >
                          <UserPlus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={totalPgs} totalItems={filtered.length} itemLabel="shows" setPg={setPg} />
      </div>

      {editingShow && (
        <EditShowModal show={editingShow} onClose={() => setEditingShow(null)} />
      )}

      {assigningShow && (
        <AssignPresenterModal show={assigningShow} onClose={() => setAssigningShow(null)} />
      )}
    </div>
  );
}

const ALL_WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

function EditShowModal({ show, onClose }: { show: Show; onClose: () => void }) {
  const [name, setName] = useState(show.name);
  const [description, setDescription] = useState(show.description);
  const [days, setDays] = useState<string[]>(show.rawDays || []);
  const [startTime, setStartTime] = useState(show.rawStartTime || "09:00");
  const [endTime, setEndTime] = useState(show.rawEndTime || "12:00");
  const [presenterId, setPresenterId] = useState<string>(show.presenterId || "");
  const [status, setStatus] = useState<"Active" | "Inactive">(
    show.status === "Inactive" ? "Inactive" : "Active"
  );

  const { data: presentersData } = useGetPresentersQuery(show.stationId);
  const [updateShow, { isLoading }] = useUpdateShowMutation();

  const presenters = (presentersData?.data as any[]) || [];

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Show name is required");
      return;
    }
    if (days.length === 0) {
      toast.error("At least one day must be selected");
      return;
    }
    try {
      await updateShow({
        id: show.id,
        name: name.trim(),
        description: description.trim() || undefined,
        days,
        startTime,
        endTime,
        presenterId: presenterId ? presenterId : null,
        status,
      }).unwrap();
      toast.success("Show updated successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update show");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Mic size={16} />
            </div>
            <h3 className="text-base font-bold text-foreground">Edit Show</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Show Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
              placeholder="e.g. Morning Drive"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] resize-none"
              placeholder="Show description..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Day(s) of Show</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEEKDAYS.map((d) => {
                const selected = days.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selected
                        ? "bg-[#02B2FF] text-white border-[#02B2FF]"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {d.label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Start Time (HH:mm)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">End Time (HH:mm)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Assigned Presenter</label>
            <select
              value={presenterId}
              onChange={(e) => setPresenterId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
            >
              <option value="">No Presenter (Unassigned)</option>
              {presenters.map((p: any) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.fullName} {p.email ? `(${p.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#02B2FF] hover:bg-[#00A0E8] rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignPresenterModal({ show, onClose }: { show: Show; onClose: () => void }) {
  const [selectedPresenterId, setSelectedPresenterId] = useState<string>(show.presenterId || "");
  const { data: presentersData } = useGetPresentersQuery(show.stationId);
  const [updateShow, { isLoading }] = useUpdateShowMutation();

  const presenters = (presentersData?.data as any[]) || [];

  const handleSave = async () => {
    try {
      await updateShow({
        id: show.id,
        presenterId: selectedPresenterId ? selectedPresenterId : null,
      }).unwrap();
      toast.success("Presenter assigned successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to assign presenter");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500">
              <UserPlus size={16} />
            </div>
            <h3 className="text-base font-bold text-foreground">Assign Presenter</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show</div>
            <div className="text-sm font-bold text-foreground mt-0.5">{show.name}</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Select Presenter</label>
            <select
              value={selectedPresenterId}
              onChange={(e) => setSelectedPresenterId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
            >
              <option value="">No Presenter (Unassigned)</option>
              {presenters.map((p: any) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.fullName} {p.email ? `(${p.email})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#02B2FF] hover:bg-[#00A0E8] rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Assign Presenter
          </button>
        </div>
      </div>
    </div>
  );
}
