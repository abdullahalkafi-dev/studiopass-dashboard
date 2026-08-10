"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { useGetAllStationStatusesQuery, useDeleteStatusMutation } from "@/features/status/statusApi";
import { Megaphone, Search, Eye, X, FileText, Image, TrendingUp, Clock, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

export default function StatusPostsContent() {
  const timezone = useTimezone();
  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId || "";

  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const PER = 10;

  const resolvedStationId = isStationAdmin ? stationId : "all";

  const { data, isLoading } = useGetAllStationStatusesQuery(
    { stationId: resolvedStationId, page: pg, limit: PER },
    { skip: isStationAdmin && !stationId },
  );

  const [deleteStatus, { isLoading: isDeleting }] = useDeleteStatusMutation();

  const statuses = data?.data || [];
  const meta = data?.meta || { total: 0, totalPage: 0 };

  const filtered = useMemo(() => {
    return statuses.filter((s: any) => {
      const q = search.toLowerCase();
      if (q && !s.content?.toLowerCase().includes(q)) return false;
      if (statusFilter === "Active" && new Date(s.expiresAt) <= new Date()) return false;
      if (statusFilter === "Expired" && new Date(s.expiresAt) > new Date()) return false;
      return true;
    });
  }, [statuses, search, statusFilter]);

  const active = statuses.filter((s: any) => new Date(s.expiresAt) > new Date()).length;
  const expired = statuses.filter((s: any) => new Date(s.expiresAt) <= new Date()).length;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this status post?")) return;
    try {
      await deleteStatus(id).unwrap();
      toast.success("Status deleted");
    } catch {
      toast.error("Failed to delete status");
    }
  };

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setPg(1);
  }
  const hasFilters = !!(search || statusFilter);

  if (!resolvedStationId && (isStationAdmin || isPartnerAdmin)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center">
            <Megaphone size={18} className="text-[#02B2FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Status Posts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">No station associated with your account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center">
            <Megaphone size={18} className="text-[#02B2FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Status Posts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your station&apos;s status posts and campaign content.</p>
          </div>
        </div>
        <Link href="/campaigns/status-posts/create" className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
          + Create Status Post
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Posts"
          value={String(meta.total || 0)}
          sub="All status posts"
          icon={<Megaphone size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Active Posts"
          value={String(active)}
          sub="Currently live"
          icon={<TrendingUp size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Expired Posts"
          value={String(expired)}
          sub="No longer running"
          icon={<Clock size={16} className="text-muted-foreground" />}
          iconBg="bg-muted"
        />
        <KpiCard
          label="Total Views"
          value={String(statuses.reduce((sum: number, s: any) => sum + (s.viewCount || 0), 0).toLocaleString())}
          sub="Across all posts"
          icon={<Eye size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by content..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "Active", label: "Active" },
              { value: "Expired", label: "Expired" },
            ]}
            placeholder="All Status" className="w-36" />
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap flex items-center gap-1.5">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing <span className="text-foreground">{filtered.length}</span> of <span className="text-foreground">{meta.total || 0}</span> posts
          </span>
          <span className="text-xs text-muted-foreground">Page {pg} of {meta.totalPage || 1}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Views</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expires</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Loader2 size={20} className="animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Search size={18} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No posts found</p>
                      <p className="text-xs text-muted-foreground">Create your first status post to get started</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((s: any) => {
                const isActive = new Date(s.expiresAt) > new Date();
                return (
                  <tr key={s._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-foreground line-clamp-1">{s.content}</span>
                      {s.media && <span className="text-xs text-muted-foreground">Has image</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        s.type === "auto_weekly_top_fans"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {s.type === "auto_weekly_top_fans" ? "Auto" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-bold font-['JetBrains_Mono',monospace] text-foreground">{(s.viewCount || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isActive
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-muted-foreground bg-muted"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                        {isActive ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground whitespace-nowrap">
                      {s.expiresAt ? formatDate(s.expiresAt, timezone) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/campaigns/status-posts/${s._id}`} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all" title="View">
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(s._id)}
                          disabled={isDeleting}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={meta.totalPage || 1} totalItems={meta.total || 0} itemLabel="posts" setPg={setPg} />
      </div>
    </div>
  );
}
