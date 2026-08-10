"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, Eye, Trophy, Activity, Clock } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetPollByIdQuery } from "@/features/poll/pollApi";
import { formatDateTime } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { resolveUrl } from "@/lib/utils";

type PollOption = { label: string; votes: number };

function formatVotes(n: number): string {
  return n.toLocaleString("en-US");
}

function getPercent(votes: number, total: number): number {
  return total > 0 ? Math.round((votes / total) * 100) : 0;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "No limit";
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  return `${hours}h ${minutes}m remaining`;
}

function resolveImageUrl(url: string | null | undefined): string {
  return resolveUrl(url) || "";
}

export default function PollsDetails({ id }: { id: string }) {
  const timezone = useTimezone();
  const { data: pollData, isLoading, error } = useGetPollByIdQuery(id);
  const poll = pollData?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/campaigns/polls" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Polls
        </Link>
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading poll details...</div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="space-y-6">
        <Link href="/campaigns/polls" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Polls
        </Link>
        <div className="text-center py-12 text-muted-foreground text-sm">Poll not found.</div>
      </div>
    );
  }

  const opts = (poll.options || []) as Array<{ label: string; imageUrl?: string; votes: number }>;
  let leadingLabel = "No votes yet";
  let leadingPct = 0;

  if (poll.totalVotes > 0 && opts.length > 0) {
    const maxVotes = Math.max(...opts.map((o) => o.votes));
    const topOptions = opts.filter((o) => o.votes === maxVotes);
    if (topOptions.length === 1) {
      leadingLabel = topOptions[0].label;
      leadingPct = getPercent(topOptions[0].votes, poll.totalVotes);
    } else {
      leadingLabel = "Tie";
      leadingPct = getPercent(maxVotes, poll.totalVotes);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/campaigns/polls"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors"
      >
        <ArrowLeft size={13} /> Back to Polls
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Poll Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Performance overview for selected poll
        </p>
      </div>

      {/* Poll Summary Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-rose-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Poll Question</p>
              <h2 className="text-lg font-bold text-foreground">{poll.question}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {poll.station?.name || "—"} {poll.show?.name ? `• ${poll.show.name}` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground font-['JetBrains_Mono',monospace]">
              {formatVotes(poll.totalVotes)}
            </div>
            <div className="text-xs text-muted-foreground">Total Votes</div>
            <div className="mt-1">
              <StatusBadge label={poll.status} variant={sv(poll.status)} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Total Votes"
          value={formatVotes(poll.totalVotes)}
          sub="All poll votes"
          icon={<Eye size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Leading Option"
          value={leadingLabel}
          sub={`${leadingPct}% of total votes`}
          icon={<Trophy size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Poll Status"
          value={poll.status}
          sub={poll.status === "Active" ? "Currently accepting votes" : "Poll has ended"}
          icon={<Activity size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Poll Information */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poll Information</span>
        </div>
        <div className="grid grid-cols-2">
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Poll Question</div>
            <div className="text-sm font-medium text-foreground">{poll.question}</div>
          </div>
          <div className="px-5 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Votes</div>
            <div className="text-sm font-bold text-foreground font-['JetBrains_Mono',monospace]">{formatVotes(poll.totalVotes)}</div>
          </div>
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created Time</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
              {poll.createdAt ? formatDateTime(poll.createdAt, timezone) : "—"}
            </div>
          </div>
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
            <StatusBadge label={poll.status} variant={sv(poll.status)} />
          </div>
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Station</div>
            <div className="text-sm font-medium text-foreground">{poll.station?.name || "—"}</div>
          </div>
          <div className="px-5 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Expires</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Clock size={12} className="text-muted-foreground" />
              {formatExpiry(poll.expiresAt || null)}
            </div>
          </div>
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Options Count</div>
            <div className="text-sm font-medium text-foreground">{poll.options?.length || 0}</div>
          </div>
          {poll.show?.name && (
            <div className="px-5 py-4 border-b border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Show</div>
              <div className="text-sm font-medium text-foreground">{poll.show.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Poll Results */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poll Results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Option</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[200px]"></th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Votes</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {(poll.options || []).map((opt: any, i: number) => {
                const pct = getPercent(opt.votes, poll.totalVotes);
                const optImage = opt.imageUrl || opt.image;
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#EFF8FF] text-[#02B2FF] text-xs font-bold flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {optImage && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveImageUrl(optImage)}
                              alt={opt.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#02B2FF] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace]">
                        {formatVotes(opt.votes)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs font-bold text-[#02B2FF] font-['JetBrains_Mono',monospace]">
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Poll Summary */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poll Summary</span>
        </div>
        <div className="grid grid-cols-4">
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Votes</div>
            <div className="text-sm font-bold text-foreground font-['JetBrains_Mono',monospace]">{formatVotes(poll.totalVotes)}</div>
          </div>
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Leading Option</div>
            <div className="text-sm font-bold text-[#02B2FF]">{leadingLabel}</div>
          </div>
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Winning Percentage</div>
            <div className="text-sm font-bold text-foreground font-['JetBrains_Mono',monospace]">{leadingPct}%</div>
          </div>
          <div className="px-5 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Poll Status</div>
            <StatusBadge label={poll.status} variant={sv(poll.status)} />
          </div>
        </div>
      </div>
    </div>
  );
}
