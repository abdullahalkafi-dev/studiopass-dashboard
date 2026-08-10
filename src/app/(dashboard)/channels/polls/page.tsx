"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3, Plus, Search, Eye, Edit2,
  CheckCircle2, AlertCircle, Clock, Loader2,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetChannelPollsQuery } from "@/features/channelPoll/channelPollApi";

const PER_PAGE = 10;

export default function ChannelPollsPage() {
  const timezone = useTimezone();
  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);

  const isStationScoped = role === "station_admin" || role === "media_station" || role === "presenter";
  const rawStation = user?.station || user?.stationId;
  const stationId = typeof rawStation === "object" ? (rawStation?._id || rawStation?.id || "") : (rawStation || "");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);

  const { data: pollsData, isLoading } = useGetChannelPollsQuery({
    page: pg,
    limit: PER_PAGE,
    search: search || undefined,
    status: statusFilter || undefined,
    station: isStationScoped && stationId ? stationId : undefined,
  });

  const rawPolls = pollsData?.data || [];
  const rows = Array.isArray(rawPolls) ? rawPolls : [];
  const meta = pollsData?.meta || { total: rows.length, totalPage: 1 };

  const totalPolls = meta.total || rows.length;
  const activePollsCount = rows.filter((r: any) => r.status === "active").length;
  const completedPollsCount = rows.filter((r: any) => r.status === "completed" || r.status === "closed").length;
  const totalVotesCount = rows.reduce((sum: number, r: any) => sum + (r.totalVotes || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
            <BarChart3 size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Channel Polls</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage channel voting events, candidate nominees, and results.</p>
          </div>
        </div>
        <Link
          href="/channels/polls/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
        >
          <Plus size={14} /> Create Poll
        </Link>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Polls" value={String(totalPolls)} icon={<BarChart3 size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
        <KpiCard label="Active" value={String(activePollsCount)} icon={<CheckCircle2 size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KpiCard label="Completed" value={String(completedPollsCount)} icon={<Clock size={16} className="text-amber-500" />} iconBg="bg-amber-50" />
        <KpiCard label="Total Votes" value={String(totalVotesCount)} icon={<AlertCircle size={16} className="text-violet-500" />} iconBg="bg-violet-50" />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search polls by title..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          <FilterSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "draft", label: "Draft" },
            ]}
            placeholder="All Status"
            className="w-40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing <span className="text-foreground">{rows.length}</span> of <span className="text-foreground">{totalPolls}</span> records
          </span>
          <span className="text-xs text-muted-foreground">Page {pg} of {meta.totalPage || 1}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categories</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Billing</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Votes</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">End</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    <Loader2 size={20} className="animate-spin mx-auto text-[#02B2FF] mb-2" />
                    Loading channel polls...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No channel polls found. Click "Create Poll" to get started.
                  </td>
                </tr>
              ) : (
                rows.map((row: any) => {
                  const pollId = row._id || row.id;
                  const categoriesCount = row.categories?.length || 0;
                  const isPaid = row.billingMode === "credits";

                  return (
                    <tr key={pollId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-foreground">{row.title}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-foreground">{categoriesCount}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isPaid ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                          {isPaid ? `Paid (${row.creditCost || 1} Credits)` : "Free"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-foreground">{row.totalVotes || 0}</td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {row.startDate ? formatDate(row.startDate, timezone, "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {row.endDate ? formatDate(row.endDate, timezone, "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Active"}
                          variant={sv(row.status === "active" ? "Active" : "Inactive")}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/channels/polls/${pollId}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                            title="View Results"
                          >
                            <Eye size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination pg={pg} totalPages={meta.totalPage || 1} totalItems={totalPolls} itemLabel="records" setPg={setPg} />
      </div>
    </div>
  );
}
