"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { KpiCard } from "@/components/shared/kpi-card";
import { TablePagination } from "@/components/shared/table-pagination";
import { useGetAllStationStatusesQuery } from "@/features/status/statusApi";
import { BarChart3, Eye, Activity, Star, BarChart2, Heart, Loader2 } from "lucide-react";

function formatViews(n: number): string {
  return n.toLocaleString("en-US");
}

export default function StatusPerformanceContent() {
  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId || "";
  const isStationAdmin = role === "station_admin";

  const resolvedStationId = isStationAdmin ? stationId : "all";

  const { data, isLoading } = useGetAllStationStatusesQuery(
    { stationId: resolvedStationId, page: 1, limit: 100 },
    { skip: isStationAdmin && !stationId },
  );

  const meta = data?.meta;
  const statuses: any[] = Array.isArray(data?.data) ? data.data : (data?.data?.statuses || []);

  // Search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Expired">("All");

  const filtered = useMemo(() => {
    return statuses.filter((s: any) => {
      const q = search.toLowerCase();
      if (q && !s.content?.toLowerCase().includes(q)) return false;
      if (statusFilter === "Active" && new Date(s.expiresAt) <= new Date()) return false;
      if (statusFilter === "Expired" && new Date(s.expiresAt) > new Date()) return false;
      return true;
    });
  }, [statuses, search, statusFilter]);

  // Sort by views desc
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  }, [filtered]);

  // Pagination
  const [pg, setPg] = useState(1);
  const PER = 10;
  const totalPgs = Math.max(1, Math.ceil(sorted.length / PER));
  const paged = sorted.slice((pg - 1) * PER, pg * PER);

  // Top KPIs
  const totalViews = meta?.totalViews ?? statuses.reduce((acc: number, s: any) => acc + (s.viewCount || 0), 0);
  const activeCampaigns = meta?.activeCount ?? statuses.filter((s: any) => new Date(s.expiresAt) > new Date()).length;
  const topCampaign = sorted[0];
  const avgViews = statuses.length ? Math.round(totalViews / statuses.length) : 0;
  const maxViews = sorted[0]?.viewCount || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <BarChart3 size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Status Performance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor campaign reach and viewing performance.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Campaign Views"
          value={formatViews(totalViews)}
          sub="Across all campaigns"
          icon={<Eye size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Active Campaigns"
          value={String(activeCampaigns)}
          sub="Currently running"
          icon={<Activity size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top Campaign</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 shrink-0">
              <Star size={16} className="text-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight line-clamp-1">{topCampaign?.content || "No campaigns yet"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{topCampaign?.type === "auto_weekly_top_fans" ? "Auto" : "Manual"}</div>
          </div>
          <div className="text-lg font-bold text-foreground font-['JetBrains_Mono',monospace]">
            {formatViews(topCampaign?.viewCount || 0)} <span className="text-xs font-normal text-muted-foreground">views</span>
          </div>
        </div>
        <KpiCard
          label="Avg Views Per Campaign"
          value={formatViews(avgViews)}
          sub="Average across all posts"
          icon={<BarChart2 size={16} className="text-rose-500" />}
          iconBg="bg-rose-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPg(1); }}
            className="w-full sm:w-40 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">
            Ranked by Views ({sorted.length})
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 w-12 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[200px]">Total Views</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Likes</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Loader2 size={20} className="animate-spin text-muted-foreground mx-auto" />
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm font-semibold text-foreground">No campaigns found</p>
                  </td>
                </tr>
              ) : paged.map((row: any, i: number) => {
                const rank = (pg - 1) * PER + i + 1;
                const pct = Math.round(((row.viewCount || 0) / maxViews) * 100);
                const isActive = new Date(row.expiresAt) > new Date();
                return (
                  <tr
                    key={row._id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        rank <= 3 ? "bg-[#02B2FF] text-white" : "text-muted-foreground"
                      }`}>
                        {rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-foreground line-clamp-1">{row.content}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        row.type === "manual"
                          ? "bg-[#EFF8FF] text-[#02B2FF] border-[#02B2FF]/20"
                          : "bg-amber-50 text-amber-600 border-amber-200"
                      }`}>
                        {row.type === "manual" ? "Manual" : "Auto"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-[#02B2FF] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace] whitespace-nowrap">
                          {formatViews(row.viewCount || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 font-['JetBrains_Mono',monospace]">
                        <Heart size={13} className="text-rose-500 fill-rose-500/20" />
                        {(row.likeCount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isActive ? "text-emerald-700 bg-emerald-50" : "text-muted-foreground bg-muted"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                        {isActive ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/campaigns/status-performance/${row._id}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <TablePagination
          pg={pg}
          totalPages={totalPgs}
          totalItems={sorted.length}
          itemLabel="posts"
          setPg={setPg}
        />
      </div>
    </div>
  );
}
