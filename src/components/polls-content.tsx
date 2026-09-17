"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRole } from "@/contexts/role-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetPollsQuery } from "@/features/poll/pollApi";
import { useGetChannelPollsQuery } from "@/features/channelPoll/channelPollApi";
import {
  BarChart3, Plus, Eye, Activity, Hash, TrendingUp, CheckCircle2, Search, Users,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { useAppSelector } from "@/store/hooks";

function formatVotes(n: number): string {
  return n.toLocaleString("en-US");
}

type PollMode = "station" | "channel";

function PollsContentInner() {
  const timezone = useTimezone();
  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const searchParams = useSearchParams();

  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const canCreate = isSuperAdmin || isPartnerAdmin || isStationAdmin;

  const rawStation = user?.station || user?.stationId;
  const userStationId =
    typeof rawStation === "object"
      ? String(rawStation?._id || rawStation?.id || "")
      : String(rawStation || "");
  const isStationScoped =
    role === "station_admin" || role === "media_station" || role === "presenter";

  const urlType = searchParams.get("type");
  const [mode, setMode] = useState<PollMode>(
    urlType === "channel" ? "channel" : "station",
  );

  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [pg, setPg] = useState(1);
  const PER = 8;
  const statusParam = activeTab === "all" ? undefined : activeTab;

  // ── Station polls (legacy /poll) ──
  const {
    data: stationPollsData,
    isLoading: stationLoading,
  } = useGetPollsQuery(
    { page: pg, limit: PER, status: statusParam },
    { skip: mode !== "station" },
  );
  const { data: allStationPollsData } = useGetPollsQuery(
    { page: 1, limit: 100 },
    { skip: mode !== "station" },
  );

  // ── Channel polls (/channel-poll) ──
  const {
    data: channelPollsData,
    isLoading: channelLoading,
  } = useGetChannelPollsQuery(
    {
      page: pg,
      limit: PER,
      status: statusParam,
      station: isStationScoped && userStationId ? userStationId : undefined,
    },
    { skip: mode !== "channel" },
  );

  const isLoading = mode === "station" ? stationLoading : channelLoading;

  const stationPolls = stationPollsData?.data || [];
  const stationMeta = stationPollsData?.meta || { total: 0, totalPage: 0 };
  const allStationPolls = allStationPollsData?.data || [];
  const stationTotal = allStationPollsData?.meta?.total || 0;
  const stationActive = allStationPolls.filter((p: any) => p.status === "active").length;
  const stationVotes = allStationPolls.reduce(
    (s: number, p: number | any) => s + ((p as any).totalVotes || 0),
    0,
  );

  const channelRowsRaw = channelPollsData?.data || [];
  const channelRows = Array.isArray(channelRowsRaw) ? channelRowsRaw : [];
  const channelMeta = channelPollsData?.meta || {
    total: channelRows.length,
    totalPage: 1,
  };
  const channelActive = channelRows.filter((r: any) => r.status === "active").length;
  const channelVotes = channelRows.reduce(
    (s: number, r: any) => s + (r.totalVotes || 0),
    0,
  );

  const listRows = mode === "station" ? stationPolls : channelRows;
  const meta = mode === "station" ? stationMeta : channelMeta;

  const createHref =
    mode === "channel"
      ? "/channels/polls/create"
      : "/campaigns/polls/create";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <BarChart3 size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Polls</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mode === "station"
                ? "Station show-time polls (A/B questions)."
                : "Channel voting events with categories and nominees."}
            </p>
          </div>
        </div>
        {canCreate && (
          <Link
            href={createHref}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} />
            {mode === "channel" ? "Create Channel Poll" : "Create Poll"}
          </Link>
        )}
      </div>

      {/* Mode tabs — Station polls / Channel polls */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("station");
                setPg(1);
                setActiveTab("all");
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                mode === "station"
                  ? "bg-[#02B2FF] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
              }`}
            >
              Station polls
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("channel");
                setPg(1);
                setActiveTab("all");
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                mode === "channel"
                  ? "bg-[#02B2FF] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
              }`}
            >
              Channel polls
            </button>
            <span className="ml-2 text-[11px] text-muted-foreground">
              {mode === "station"
                ? "Simple audience questions"
                : "Awards / nominee voting"}
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {(["all", "active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPg(1);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-muted text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI — mode aware */}
      {mode === "station" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Total Polls" value={String(stationTotal)} icon={<Hash size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
          <KpiCard label="Active Polls" value={String(stationActive)} icon={<Activity size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
          <KpiCard label="Completed Polls" value={String(stationTotal - stationActive)} icon={<CheckCircle2 size={16} className="text-violet-500" />} iconBg="bg-violet-50" />
          <KpiCard label="Total Votes" value={formatVotes(stationVotes)} icon={<TrendingUp size={16} className="text-amber-500" />} iconBg="bg-amber-50" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Channel Polls (page)" value={String(channelRows.length)} icon={<BarChart3 size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
          <KpiCard label="Active (page)" value={String(channelActive)} icon={<CheckCircle2 size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
          <KpiCard label="Total (API)" value={String(channelMeta.total || channelRows.length)} icon={<Users size={16} className="text-violet-500" />} iconBg="bg-violet-50" />
          <KpiCard label="Votes (page)" value={formatVotes(channelVotes)} icon={<TrendingUp size={16} className="text-amber-500" />} iconBg="bg-amber-50" />
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto rounded-xl border border-border">
          {mode === "station" ? (
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poll Question</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Votes</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created / Expires</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center animate-pulse">
                          <Search size={18} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Loading station polls…</p>
                      </div>
                    </td>
                  </tr>
                ) : stationPolls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <BarChart3 size={18} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No station polls found</p>
                        <p className="text-xs text-muted-foreground">Switch to Channel polls if you created a voting event.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stationPolls.map((poll: any, i: number) => {
                    const rank = (pg - 1) * PER + i + 1;
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
                          <span className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace]">
                            {formatVotes(poll.totalVotes || 0)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-[11px] text-muted-foreground font-['JetBrains_Mono',monospace]">
                            <div>Created: {poll.createdAt ? formatDate(poll.createdAt, timezone) : "—"}</div>
                            <div>
                              Expires:{" "}
                              {poll.expiresAt
                                ? formatDateTime(poll.expiresAt, timezone)
                                : "No expiry"}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center">
                            <Link
                              href={`/campaigns/polls/${poll._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#02B2FF] bg-[#EFF8FF] rounded-lg hover:bg-[#02B2FF]/10 transition-colors"
                            >
                              <Eye size={12} /> View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[750px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categories</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Billing</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Votes</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start → End</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-sm text-muted-foreground">
                      Loading channel polls…
                    </td>
                  </tr>
                ) : channelRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users size={18} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No channel polls found</p>
                        <p className="text-xs text-muted-foreground">
                          Use “Create Channel Poll” — they do not appear under Station polls.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  channelRows.map((row: any) => {
                    const pollId = row._id || row.id;
                    const isPaid = row.billingMode === "credits";
                    return (
                      <tr key={pollId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-semibold text-foreground">{row.title}</div>
                          {(row.station?.name || row.description) && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {row.station?.name || ""}
                              {row.description ? ` · ${String(row.description).slice(0, 40)}` : ""}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-foreground">
                          {row.categories?.length || 0}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isPaid ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                            {isPaid ? `Paid (${row.creditCost || 1})` : "Free"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-foreground">{row.totalVotes || 0}</td>
                        <td className="px-5 py-3.5 text-[11px] text-muted-foreground font-['JetBrains_Mono',monospace]">
                          <div>{row.startDate ? formatDateTime(row.startDate, timezone) : "—"}</div>
                          <div>{row.endDate ? formatDateTime(row.endDate, timezone) : "—"}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            label={row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "—"}
                            variant={sv(row.status === "active" ? "Active" : row.status === "scheduled" ? "Pending" : "Inactive")}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center">
                            <Link
                              href={`/channels/polls/${pollId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#02B2FF] bg-[#EFF8FF] rounded-lg hover:bg-[#02B2FF]/10 transition-colors"
                            >
                              <Eye size={12} /> View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <TablePagination
          pg={pg}
          totalPages={meta.totalPage || 1}
          totalItems={meta.total || listRows.length}
          itemLabel="polls"
          setPg={setPg}
        />
      </div>
    </div>
  );
}

export default function PollsContent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Loading polls…
        </div>
      }
    >
      <PollsContentInner />
    </Suspense>
  );
}
