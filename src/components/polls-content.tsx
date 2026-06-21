"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRole } from "@/contexts/role-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import {
  BarChart3, Plus, Eye, Edit2, Trash2, Activity, Hash, TrendingUp, CheckCircle2,
} from "lucide-react";

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

const STATUS_OPTIONS = ["Active", "Completed"];

export default function PollsContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";

  const showStation = isSuperAdmin || isPartnerAdmin;
  const canCreate = isSuperAdmin || isPartnerAdmin || isStationAdmin;

  const [statusFilter, setStatusFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [pg, setPg] = useState(1);
  const PER = 8;

  const filtered = useMemo(() => {
    return POLLS.filter((p) => {
      if (activeTab === "active" && p.status !== "Active") return false;
      if (activeTab === "completed" && p.status !== "Completed") return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (showStation && stationFilter && p.station !== stationFilter) return false;
      return true;
    });
  }, [activeTab, statusFilter, stationFilter, showStation]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER));
  const paged = filtered.slice((pg - 1) * PER, pg * PER);

  const totalPolls = POLLS.length;
  const activePolls = POLLS.filter((p) => p.status === "Active").length;
  const totalVotes = POLLS.reduce((s, p) => s + p.totalVotes, 0);
  const avgVotes = Math.round(totalVotes / totalPolls);

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
        <KpiCard
          label="Total Polls"
          value={String(totalPolls)}
          icon={<Hash size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Active Polls"
          value={String(activePolls)}
          icon={<Activity size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Completed Polls"
          value={String(totalPolls - activePolls)}
          icon={<CheckCircle2 size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
        <KpiCard
          label="Total Votes"
          value={formatVotes(totalVotes)}
          icon={<TrendingUp size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <BarChart3 size={14} />
            All Polls
            <span className="ml-1 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
              {filtered.length}
            </span>
          </div>

          {/* Tab Buttons */}
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Votes</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((poll, i) => {
                const rank = (pg - 1) * PER + i + 1;
                const maxVotes = Math.max(...POLLS.map((p) => p.totalVotes));
                const pct = Math.round((poll.totalVotes / maxVotes) * 100);
                return (
                  <tr
                    key={poll.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        rank <= 3 ? "bg-[#02B2FF] text-white" : "text-muted-foreground"
                      }`}>
                        {rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <div className="text-xs font-semibold text-foreground">{poll.question}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{poll.options.length} options</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <div className="text-xs font-medium text-foreground">{poll.station}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{poll.presenter}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={poll.status} variant={sv(poll.status)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[80px]">
                          <div
                            className="h-full bg-[#02B2FF] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace] whitespace-nowrap">
                          {formatVotes(poll.totalVotes)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{poll.created}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/campaigns/polls/${poll.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#02B2FF] bg-[#EFF8FF] rounded-lg hover:bg-[#02B2FF]/10 transition-colors"
                        >
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

        <TablePagination
          pg={pg}
          totalPages={totalPgs}
          totalItems={filtered.length}
          itemLabel="polls"
          setPg={setPg}
        />
      </div>
    </div>
  );
}
