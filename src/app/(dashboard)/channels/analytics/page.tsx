"use client";

import {
  BarChart3, Users, MessageSquare, Trophy, TrendingUp,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";

// Mock analytics data — will be replaced with real API
const MOCK_ANALYTICS = {
  totalParticipants: 234,
  participantsTrend: 12.5,
  totalMessages: 1089,
  messagesTrend: 8.3,
  totalChallenges: 12,
  challengesTrend: 25.0,
  engagementRate: 67.8,
  engagementTrend: -2.1,
};

const RECENT_ACTIVITY = [
  { id: "1", type: "challenge", title: "Music Knowledge Quiz completed", time: "2 hours ago", participants: 45 },
  { id: "2", type: "poll", title: "Best Male Presenter voting ended", time: "5 hours ago", votes: 234 },
  { id: "3", type: "message", title: "New messages received", time: "1 hour ago", count: 23 },
  { id: "4", type: "challenge", title: "Fastest Song ID started", time: "30 minutes ago", participants: 18 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Channel performance and engagement metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Participants"
          value={String(MOCK_ANALYTICS.totalParticipants)}
          icon={<Users size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
          trend={`${MOCK_ANALYTICS.participantsTrend > 0 ? "+" : ""}${MOCK_ANALYTICS.participantsTrend}%`}
          trendUp={MOCK_ANALYTICS.participantsTrend > 0}
        />
        <KpiCard
          label="Total Messages"
          value={String(MOCK_ANALYTICS.totalMessages)}
          icon={<MessageSquare size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
          trend={`${MOCK_ANALYTICS.messagesTrend > 0 ? "+" : ""}${MOCK_ANALYTICS.messagesTrend}%`}
          trendUp={MOCK_ANALYTICS.messagesTrend > 0}
        />
        <KpiCard
          label="Total Challenges"
          value={String(MOCK_ANALYTICS.totalChallenges)}
          icon={<Trophy size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
          trend={`${MOCK_ANALYTICS.challengesTrend > 0 ? "+" : ""}${MOCK_ANALYTICS.challengesTrend}%`}
          trendUp={MOCK_ANALYTICS.challengesTrend > 0}
        />
        <KpiCard
          label="Engagement Rate"
          value={`${MOCK_ANALYTICS.engagementRate}%`}
          icon={<TrendingUp size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
          trend={`${MOCK_ANALYTICS.engagementTrend > 0 ? "+" : ""}${MOCK_ANALYTICS.engagementTrend}%`}
          trendUp={MOCK_ANALYTICS.engagementTrend > 0}
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Participants Over Time</h3>
          <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Chart will be displayed here</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Messages Over Time</h3>
          <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Chart will be displayed here</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {RECENT_ACTIVITY.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activity.type === "challenge" ? "bg-violet-100 text-violet-600" :
                activity.type === "poll" ? "bg-[#EFF8FF] text-[#02B2FF]" :
                "bg-emerald-100 text-emerald-600"
              }`}>
                {activity.type === "challenge" ? <Trophy size={14} /> :
                 activity.type === "poll" ? <BarChart3 size={14} /> :
                 <MessageSquare size={14} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
