"use client";

import { useState } from "react";
import Link from "next/link";
import { useRole } from "@/contexts/role-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetPollsQuery } from "@/features/poll/pollApi";
import {
  BarChart3, Plus, Eye, Activity, Hash, TrendingUp, CheckCircle2, Search,
} from "lucide-react";

function formatVotes(n: number): string {
  return n.toLocaleString("en-US");
}

export default function PollsContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";

  const showStation = isSuperAdmin || isPartnerAdmin;
  const canCreate = isSuperAdmin || isPartnerAdmin || isStationAdmin;

  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [pg, setPg] = useState(1);
  const PER = 8;

  const statusParam = activeTab === "all" ? undefined : activeTab;

  const { data: pollsData, isLoading } = useGetPollsQuery({
    page: pg,
    limit: PER,
    status: statusParam,
  });

  const polls = pollsData?.data || [];
  const meta = pollsData?.meta || { total: 0, totalPage: 0 };

  // Compute KPIs from all polls (fetch first page with large limit for totals)
  const { data: allPollsData } = useGetPollsQuery({ page: 1, limit: 100 });
  const allPolls = allPollsData?.data || [];
  const totalPolls = allPollsData?.meta?.total || 0;
  const activePolls = allPolls.filter((p: any) => p.status === "active").length;
  const totalVotes = allPolls.reduce((s: number, p: any) => s + (p.totalVotes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <BarChart3 size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Polls</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage live audience polls for active shows.
            </p>
          </div>
        </div>
        {canCreate && (
          <Link
            href="/campaigns/polls/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} /> Create Poll
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Polls" value={String(totalPolls)} icon={<Hash size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
        <KpiCard label="Active Polls" value={String(activePolls)} icon={<Activity size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KpiCard label="Completed Polls" value={String(totalPolls - activePolls)} icon={<CheckCircle2 size={16} className="text-violet-500" />} iconBg="bg-violet-50" />
        <KpiCard label="Total Votes" value={formatVotes(totalVotes)} icon={<TrendingUp size={16} className="text-amber-500" />} iconBg="bg-amber-50" />
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <BarChart3 size={14} />
            All Polls
            <span className="ml-1 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
              {meta.total}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {(["all", "active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPg(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-[#02B2FF] text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poll Question</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Votes</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center animate-pulse"><Search size={18} className="text-muted-foreground" /></div>
                      <p className="text-sm font-semibold text-foreground">Loading polls…</p>
                    </div>
                  </td>
                </tr>
              ) : polls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><BarChart3 size={18} className="text-muted-foreground" /></div>
                      <p className="text-sm font-semibold text-foreground">No polls found</p>
                    </div>
                  </td>
                </tr>
              ) : polls.map((poll: any, i: number) => {
                const rank = (pg - 1) * PER + i + 1;
                const maxVotes = Math.max(...polls.map((p: any) => p.totalVotes || 1));
                const pct = Math.round(((poll.totalVotes || 0) / maxVotes) * 100);
                return (
                  <tr key={poll._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${rank <= 3 ? "bg-[#02B2FF] text-white" : "text-muted-foreground"}`}>
                        {rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <div className="text-xs font-semibold text-foreground">{poll.question}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{poll.options?.length || 0} options</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-medium text-foreground">{poll.station?.name || "—"}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={poll.status} variant={sv(poll.status)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[80px]">
                          <div className="h-full bg-[#02B2FF] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace] whitespace-nowrap">
                          {formatVotes(poll.totalVotes || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {new Date(poll.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        <Link href={`/campaigns/polls/${poll._id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#02B2FF] bg-[#EFF8FF] rounded-lg hover:bg-[#02B2FF]/10 transition-colors">
                          <Eye size={12} /> View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={meta.totalPage} totalItems={meta.total} itemLabel="polls" setPg={setPg} />
      </div>
    </div>
  );
}
