"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Phone,
  Trophy,
  Clock,
  Tv,
} from "lucide-react";
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

const RANK_BADGES: Record<number, string> = {
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

const ACTIVITY_ICONS: Record<string, { icon: any; color: string }> = {
  message: { icon: MessageSquare, color: "text-[#02B2FF]" },
  poll: { icon: Star, color: "text-amber-500" },
  call: { icon: Phone, color: "text-emerald-500" },
};

export default function FanDetailContent({ id }: { id: string }) {
  const fan = ALL_FANS.find((f) => f.id === id);

  if (!fan) {
    return (
      <div className="space-y-6">
        <Link href="/top-fans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Top Fans
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Fan not found.</p>
        </div>
      </div>
    );
  }

  const avatarColor = AVATAR_COLORS[(fan.rank - 1) % AVATAR_COLORS.length];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/top-fans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Top Fans
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Fan Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{fan.name}</p>
      </div>

      {/* Hero Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${avatarColor}`}>
            {fan.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{fan.name}</h2>
              {fan.rank <= 3 ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RANK_BADGES[fan.rank]}`}>
                  #{fan.rank}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">#{fan.rank}</span>
              )}
              <StatusBadge label={fan.status} variant={sv(fan.status)} />
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 gap-0">
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone Number</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{fan.phone}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Current Rank</div>
            <div className="text-sm font-medium text-foreground">#{fan.rank}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Joined Date</div>
            <div className="text-sm font-medium text-foreground">{fan.joinedDate}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Last Active</div>
            <div className="text-sm font-medium text-foreground">{fan.lastActive}</div>
          </div>
        </div>
      </div>

      {/* Engagement Summary */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Engagement Summary</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={14} className="text-[#02B2FF]" />
              <span className="text-sm text-foreground">Total Messages</span>
            </div>
            <span className="text-sm font-bold text-[#02B2FF] font-['JetBrains_Mono',monospace]">{fan.messages}</span>
          </div>
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-emerald-500" />
              <span className="text-sm text-foreground">Total Calls</span>
            </div>
            <span className="text-sm font-bold text-emerald-500 font-['JetBrains_Mono',monospace]">{fan.calls}</span>
          </div>
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star size={14} className="text-amber-500" />
              <span className="text-sm text-foreground">Poll Participations</span>
            </div>
            <span className="text-sm font-bold text-amber-500 font-['JetBrains_Mono',monospace]">{fan.polls}</span>
          </div>
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tv size={14} className="text-violet-500" />
              <span className="text-sm text-foreground">Favourite Show</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{fan.favouriteShow}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</h3>
        </div>
        <div className="divide-y divide-border">
          {fan.recentActivity.map((activity, i) => {
            const actConfig = ACTIVITY_ICONS[activity.icon] || ACTIVITY_ICONS.message;
            const ActIcon = actConfig.icon;
            return (
              <div key={i} className="px-6 py-3.5 flex items-center gap-3">
                <ActIcon size={14} className={actConfig.color} />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{activity.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
