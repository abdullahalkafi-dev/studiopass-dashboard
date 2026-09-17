"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Phone,
  Tv,
} from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetTopFanByIdQuery } from "@/features/user/userApi";
import { formatDateTime } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

const RANK_BADGES: Record<number, string> = {
  1: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  2: "bg-muted text-muted-foreground dark:bg-white/10",
  3: "bg-orange-50 text-orange-400 dark:bg-orange-950/40 dark:text-orange-400",
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

function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function FanDetailContent({ id }: { id: string }) {
  const timezone = useTimezone();
  const {
    data: response,
    isLoading,
    isError,
  } = useGetTopFanByIdQuery(id, { skip: !id });

  const fan = response?.data as any;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/top-fans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Top Fans
        </Link>
        <div className="space-y-4">
          <div className="h-20 bg-muted rounded-xl animate-pulse" />
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !fan) {
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

  const rank = Number(fan.rank) || 0;
  const avatarColor = AVATAR_COLORS[(Math.max(rank, 1) - 1) % AVATAR_COLORS.length];
  const recentActivity: { action: string; time: string; icon: string }[] =
    fan.recentActivity || [];

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
            {initials(fan.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{fan.name}</h2>
              {rank > 0 ? (
                rank <= 3 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RANK_BADGES[rank]}`}>
                    #{rank}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">#{rank}</span>
                )
              ) : null}
              <StatusBadge label={fan.status || "Active"} variant={sv(fan.status || "Active")} />
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          <div className="px-6 py-4 border-b sm:border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone Number</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{fan.phone || "N/A"}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Current Rank</div>
            <div className="text-sm font-medium text-foreground">{rank > 0 ? `#${rank}` : "—"}</div>
          </div>
          <div className="px-6 py-4 border-b sm:border-b-0 sm:border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Joined Date</div>
            <div className="text-sm font-medium text-foreground">{fan.joinedDate || "—"}</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Last Active</div>
            <div className="text-sm font-medium text-foreground">
              {fan.lastActive ? formatDateTime(fan.lastActive, timezone) : "—"}
            </div>
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
            <span className="text-sm font-bold text-[#02B2FF] font-['JetBrains_Mono',monospace]">{fan.messages ?? 0}</span>
          </div>
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-emerald-500" />
              <span className="text-sm text-foreground">Total Calls</span>
            </div>
            <span className="text-sm font-bold text-emerald-500 font-['JetBrains_Mono',monospace]">{fan.calls ?? 0}</span>
          </div>
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star size={14} className="text-amber-500" />
              <span className="text-sm text-foreground">Poll Participations</span>
            </div>
            <span className="text-sm font-bold text-amber-500 font-['JetBrains_Mono',monospace]">{fan.polls ?? 0}</span>
          </div>
          <div className="px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tv size={14} className="text-violet-500" />
              <span className="text-sm text-foreground">Favourite Show</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{fan.favouriteShow || "—"}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity — real messages/calls */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</h3>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No recent activity for this station.
            </div>
          ) : (
            recentActivity.map((activity, i) => {
              const actConfig = ACTIVITY_ICONS[activity.icon] || ACTIVITY_ICONS.message;
              const ActIcon = actConfig.icon;
              return (
                <div key={i} className="px-6 py-3.5 flex items-center gap-3">
                  <ActIcon size={14} className={actConfig.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground break-words">{activity.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace] shrink-0">
                    {activity.time ? formatDateTime(activity.time, timezone) : ""}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
