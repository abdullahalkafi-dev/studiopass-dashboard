"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trophy, Plus, Search, Loader2, Eye, Edit2, CheckCircle2, AlertCircle, Clock, ShieldAlert,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { useGetChallengesQuery } from "@/features/challenge/challengeApi";
import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery } from "@/features/user/userApi";

const PER_PAGE = 10;

const TYPE_LABELS: Record<string, string> = {
  quiz: "Quiz",
  fastest_answer: "Fastest Answer",
  question_of_day: "Question of Day",
};

export default function ChallengesPage() {
  const timezone = useTimezone();
  const role = useRole();
  const isReadOnly = role === "station_admin" || role === "presenter" || role === "media_station";
  const isSuperOrPartner = role === "super_admin" || role === "partner_admin";

  const user = useAppSelector((state) => state.auth.user);
  const { data: profileData } = useGetMyProfileQuery();
  const liveUser = profileData?.data || user;
  const stationCategory = (liveUser as any)?.stationCategory || (liveUser as any)?.station?.category || "radio";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);

  const { data, isLoading } = useGetChallengesQuery({
    page: pg,
    limit: PER_PAGE,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const challenges = data?.data || [];
  const meta = data?.meta || { page: 1, limit: PER_PAGE, total: 0, totalPage: 1 };

  if (!isSuperOrPartner && stationCategory !== "channel") {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border shadow-sm text-center my-8">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-lg font-bold text-foreground">Challenges Unavailable</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Challenges are exclusively available for Channels. Your account is associated with a {stationCategory.toUpperCase()} station.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
            <Trophy size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Challenges</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage channel challenges, prizes, and leaderboards.</p>
          </div>
        </div>
        {isSuperOrPartner && (
          <Link
            href="/channels/challenges/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} /> Create Challenge
          </Link>
        )}
      </div>

      {/* Read-only banner for Channel Admins / Presenters */}
      {isReadOnly && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-sm">
          <ShieldAlert size={18} className="shrink-0 text-amber-500" />
          <span>
            <strong>Read-Only Mode:</strong> Only Super Admins and Partner Admins can create or modify challenges for channels.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Challenges" value={String(meta.total)} icon={<Trophy size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
        <KpiCard label="Active" value={String(challenges.filter((c: any) => c.status === "active").length)} icon={<CheckCircle2 size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KpiCard label="Completed" value={String(challenges.filter((c: any) => c.status === "completed").length)} icon={<Clock size={16} className="text-amber-500" />} iconBg="bg-amber-50" />
        <KpiCard label="Total Participants" value={String(challenges.reduce((sum: number, c: any) => sum + (c.totalParticipants || 0), 0))} icon={<AlertCircle size={16} className="text-violet-500" />} iconBg="bg-violet-50" />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search challenges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          <FilterSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "draft", label: "Draft" },
              { value: "scheduled", label: "Scheduled" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            placeholder="All Status"
            className="w-44"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">Showing {challenges.length} of {meta.total} records</span>
          <span className="text-xs text-muted-foreground">Page {pg} of {meta.totalPage || 1}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prize</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Participants</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#02B2FF]" /> Loading challenges...
                  </td>
                </tr>
              ) : challenges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No challenges found.</td>
                </tr>
              ) : (
                challenges.map((row: any) => {
                  const prizeStr = row.prizeLabel
                    ? `${row.prizeLabel} ${row.currency ? `(${row.currency} ${row.prizeValue})` : row.prizeValue || ""}`
                    : row.rewardText || "N/A";

                  return (
                    <tr key={row._id || row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-foreground">{row.title}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge label={TYPE_LABELS[row.type] || row.type} variant="neutral" />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground font-medium">
                        {prizeStr}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-foreground">{row.totalParticipants || 0}</td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {formatDate(row.startDate, timezone, "MMM d, HH:mm")}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Draft"}
                          variant={sv(row.status === "active" ? "Active" : row.status === "completed" ? "Inactive" : "Draft")}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/channels/challenges/${row._id || row.id}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                            title="View"
                          >
                            <Eye size={14} />
                          </Link>
                          {isSuperOrPartner && (
                            <Link
                              href={`/channels/challenges/${row._id || row.id}/edit`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination pg={pg} totalPages={meta.totalPage || 1} totalItems={meta.total || 0} itemLabel="records" setPg={setPg} />
      </div>
    </div>
  );
}
