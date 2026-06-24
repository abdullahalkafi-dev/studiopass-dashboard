"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  MessageSquare,
  Phone,
  Eye,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import topFansData from "@/mock/top-fans.json";

interface TopFan {
  id: string;
  name: string;
  phone: string;
  rank: number;
  status: string;
  messages: number;
  calls: number;
  polls: number;
  favouriteShow: string;
  joinedDate: string;
  lastActive: string;
  recentActivity: { action: string; time: string; icon: string }[];
}

const ALL_FANS = topFansData.topFans as TopFan[];

const RANK_COLORS: Record<number, string> = {
  1: "bg-amber-100 text-amber-600",
  2: "bg-slate-100 text-slate-500",
  3: "bg-orange-50 text-orange-400",
};

const AVATAR_COLORS = [
  "bg-[#02B2FF] text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-violet-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-500 text-white",
  "bg-orange-500 text-white",
  "bg-teal-500 text-white",
];

export default function TopFansContent() {
  const [tab, setTab] = useState<"all" | "active" | "inactive">("all");

  const activeFans = ALL_FANS.filter((f) => f.status === "Active");
  const inactiveFans = ALL_FANS.filter((f) => f.status === "Inactive");

  const filtered = useMemo(() => {
    if (tab === "active") return activeFans;
    if (tab === "inactive") return inactiveFans;
    return ALL_FANS;
  }, [tab]);

  const totalMessages = ALL_FANS.reduce((sum, f) => sum + f.messages, 0);
  const totalCalls = ALL_FANS.reduce((sum, f) => sum + f.calls, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Top Fans</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and track the most engaged listeners for your station
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Active Fans"
          value={String(activeFans.length)}
          icon={<Star size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Messages Sent Today"
          value={String(totalMessages)}
          icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Calls Participated"
          value={String(totalCalls)}
          icon={<Phone size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Tab Filters + Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-foreground">All Fans <span className="text-muted-foreground font-normal">{ALL_FANS.length}</span></span>
            <div className="flex items-center gap-1">
              {(["all", "active", "inactive"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    tab === t
                      ? "bg-[#02B2FF] text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rank</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Listener Name</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calls</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Active</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fan, i) => (
                <tr key={fan.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {fan.rank <= 3 ? (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${RANK_COLORS[fan.rank]}`}>
                          {fan.rank}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace] ml-1">#{fan.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {fan.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{fan.name}</p>
                        <StatusBadge label={fan.status} variant={sv(fan.status)} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs font-semibold text-foreground font-['JetBrains_Mono',monospace]">{fan.messages}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs font-semibold text-foreground font-['JetBrains_Mono',monospace]">{fan.calls}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-muted-foreground">{fan.lastActive}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Link
                      href={`/top-fans/${fan.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      <Eye size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
