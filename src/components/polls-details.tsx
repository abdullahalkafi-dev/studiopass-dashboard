"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, Eye, Trophy, Activity } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";

type PollOption = { label: string; votes: number };

type Poll = {
  id: string;
  question: string;
  station: string;
  presenter: string;
  status: "Active" | "Completed";
  totalVotes: number;
  options: PollOption[];
  created: string;
  createdDate: string;
};

const POLLS: Poll[] = [
  { id: "POL-001", question: "What genre should we play next?", station: "Morning Drive Show", presenter: "DJ Marcus Cole", status: "Active", totalVotes: 744, options: [{ label: "Afrobeats", votes: 312 }, { label: "Classic Rock", votes: 189 }, { label: "Jazz & Soul", votes: 145 }, { label: "Hip Hop", votes: 98 }], created: "07:35", createdDate: "2024-06-14" },
  { id: "POL-002", question: "Who is your favourite morning presenter?", station: "Morning Drive Show", presenter: "DJ Marcus Cole", status: "Active", totalVotes: 1200, options: [{ label: "DJ Marcus Cole", votes: 480 }, { label: "Sarah Jenkins", votes: 390 }, { label: "Tom Ochieng", votes: 330 }], created: "06:42", createdDate: "2024-06-14" },
  { id: "POL-003", question: "Should we extend the morning show to 11AM?", station: "Morning Drive Show", presenter: "DJ Marcus Cole", status: "Completed", totalVotes: 1350, options: [{ label: "Yes, extend it", votes: 890 }, { label: "No, keep current time", votes: 460 }], created: "06:08", createdDate: "2024-06-13" },
  { id: "POL-004", question: "Best time for a listener call-in segment?", station: "Midday Rhythms", presenter: "Zara Hassan", status: "Completed", totalVotes: 1100, options: [{ label: "10:00 - 11:00 AM", votes: 385 }, { label: "11:00 AM - 12:00 PM", votes: 340 }, { label: "12:00 - 1:00 PM", votes: 220 }, { label: "1:00 - 2:00 PM", votes: 155 }], created: "12:10", createdDate: "2024-06-12" },
  { id: "POL-005", question: "What topic should tonight's panel discuss?", station: "Evening News Live", presenter: "Lisa Obiyo", status: "Active", totalVotes: 1680, options: [{ label: "Local Politics", votes: 605 }, { label: "Sports Analysis", votes: 520 }, { label: "Entertainment News", votes: 555 }], created: "17:56", createdDate: "2024-06-14" },
  { id: "POL-006", question: "Rate today's news coverage", station: "Evening News Live", presenter: "Lisa Obiyo", status: "Completed", totalVotes: 1350, options: [{ label: "Excellent", votes: 540 }, { label: "Good", votes: 405 }, { label: "Average", votes: 270 }, { label: "Poor", votes: 135 }], created: "19:30", createdDate: "2024-06-13" },
  { id: "POL-007", question: "Which local artist should we feature this week?", station: "Weekend Vibes", presenter: "Nkechi Obi", status: "Active", totalVotes: 892, options: [{ label: "Burna Boy", votes: 312 }, { label: "Wizkid", votes: 267 }, { label: "Davido", votes: 198 }, { label: "Tems", votes: 115 }], created: "08:15", createdDate: "2024-06-14" },
  { id: "POL-008", question: "Should we add a sports segment?", station: "Sports Hour", presenter: "Tunde Okafor", status: "Completed", totalVotes: 920, options: [{ label: "Yes, daily sports update", votes: 552 }, { label: "Yes, weekend only", votes: 276 }, { label: "No", votes: 92 }], created: "14:20", createdDate: "2024-06-11" },
  { id: "POL-009", question: "Favourite segment of the breakfast show?", station: "Breakfast Show", presenter: "Sandra Ankrah", status: "Active", totalVotes: 1050, options: [{ label: "News Roundup", votes: 368 }, { label: "Music Mix", votes: 315 }, { label: "Celebrity Interviews", votes: 210 }, { label: "Listener Calls", votes: 157 }], created: "05:50", createdDate: "2024-06-14" },
  { id: "POL-010", question: "What community event should we cover next?", station: "Community Hour", presenter: "David Mutua", status: "Completed", totalVotes: 638, options: [{ label: "Charity Run", votes: 223 }, { label: "Food Festival", votes: 191 }, { label: "Music Concert", votes: 128 }, { label: "Art Exhibition", votes: 96 }], created: "11:00", createdDate: "2024-06-10" },
];

function formatVotes(n: number): string {
  return n.toLocaleString("en-US");
}

function getPercent(votes: number, total: number): number {
  return total > 0 ? Math.round((votes / total) * 100) : 0;
}

export default function PollsDetails({ id }: { id: string }) {
  const poll = POLLS.find((p) => p.id === id);

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

  const leadingOption = poll.options.reduce((a, b) => (a.votes > b.votes ? a : b));
  const leadingPct = getPercent(leadingOption.votes, poll.totalVotes);

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
                {poll.station} • {poll.presenter}
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
          value={leadingOption.label}
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
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{poll.created}</div>
          </div>
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
            <StatusBadge label={poll.status} variant={sv(poll.status)} />
          </div>
          <div className="px-5 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Options Count</div>
            <div className="text-sm font-medium text-foreground">{poll.options.length}</div>
          </div>
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
              {poll.options.map((opt, i) => {
                const pct = getPercent(opt.votes, poll.totalVotes);
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#EFF8FF] text-[#02B2FF] text-xs font-bold flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
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
            <div className="text-sm font-bold text-[#02B2FF]">{leadingOption.label}</div>
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
