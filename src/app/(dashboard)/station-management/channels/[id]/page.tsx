"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Radio, Users, MessageSquare,
  Trophy, BarChart3, Settings, Plus, Eye, Edit2,
  Power, PowerOff, CheckCircle2, AlertCircle,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetStationByIdQuery } from "@/features/station/stationApi";
import { useRole } from "@/contexts/role-context";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

import { resolveUrl } from "@/lib/utils";
import { useGetStationChallengesQuery } from "@/features/challenge/challengeApi";
import { useGetStationChannelPollsQuery } from "@/features/channelPoll/channelPollApi";

type TabId = "overview" | "challenges" | "polls" | "messages" | "analytics" | "settings";

const TABS: { id: TabId; label: string; icon: React.ReactNode; channelTypes?: string[] }[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
  { id: "challenges", label: "Challenges", icon: <Trophy size={16} />, channelTypes: ["challenges"] },
  { id: "polls", label: "Polls", icon: <BarChart3 size={16} />, channelTypes: ["polls"] },
  { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export default function ChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const timezone = useTimezone();
  const role = useRole();
  const stationId = params.id as string;

  const { data, isLoading, error } = useGetStationByIdQuery(stationId);
  const station = data?.data;

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-[#02B2FF]" />
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Channel not found.</p>
        <Link href="/station-management/channels" className="text-sm text-[#02B2FF] hover:underline mt-2 inline-block">
          Back to Channels
        </Link>
      </div>
    );
  }

  const channelType = station.channelType;
  const visibleTabs = TABS.filter((tab) => {
    if (!tab.channelTypes) return true;
    return channelType && tab.channelTypes.includes(channelType);
  });

  const channelTypeLabel = channelType === "challenges"
    ? "Challenges"
    : channelType === "polls"
      ? "Polls / Vote"
      : channelType === "message_chat"
        ? "Message / Chat"
        : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/station-management/channels"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft size={16} className="text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            {station.logo ? (
              <img
                src={resolveUrl(station.logo)}
                alt={station.name}
                className="w-12 h-12 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
                <Radio size={20} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{station.name}</h1>
                <StatusBadge
                  label={station.isActive ? "Active" : "Inactive"}
                  variant={sv(station.isActive ? "Active" : "Inactive")}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {station.stationCode} · {channelTypeLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 -mb-px">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#02B2FF] text-[#02B2FF]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && <OverviewTab station={station} timezone={timezone} />}
        {activeTab === "challenges" && <ChallengesTab stationId={stationId} />}
        {activeTab === "polls" && <PollsTab stationId={stationId} />}
        {activeTab === "messages" && <MessagesTab stationId={stationId} />}
        {activeTab === "analytics" && <AnalyticsTab stationId={stationId} station={station} />}
        {activeTab === "settings" && <SettingsTab station={station} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ station, timezone }: { station: any; timezone: string }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Followers" value={String(station.followerCount ?? 0)} icon={<Users size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
          <KpiCard label="Status" value={station.isActive ? "Active" : "Inactive"} icon={<CheckCircle2 size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
          <KpiCard label="Channel Type" value={station.channelType || "Standard"} icon={<Radio size={16} className="text-violet-500" />} iconBg="bg-violet-50" />
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Channel Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Name</p>
              <p className="text-sm text-foreground font-medium">{station.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Code</p>
              <p className="text-sm text-foreground font-medium font-['JetBrains_Mono',monospace]">{station.stationCode}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created At</p>
              <p className="text-sm text-foreground font-medium">{formatDate(station.createdAt, timezone)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Updated At</p>
              <p className="text-sm text-foreground font-medium">{formatDate(station.updatedAt, timezone)}</p>
            </div>
          </div>
          {station.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-foreground">{station.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Challenges Tab ──────────────────────────────────────────────────────────

function ChallengesTab({ stationId }: { stationId: string }) {
  const { data, isLoading } = useGetStationChallengesQuery({ stationId });
  const challenges = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Challenges</h3>
        <Link
          href={`/channels/challenges/create?stationId=${stationId}`}
          className="flex items-center gap-2 px-4 py-2 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors"
        >
          <Plus size={14} /> Create Challenge
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 bg-card rounded-xl border border-border">
          <Loader2 size={18} className="animate-spin text-[#02B2FF]" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
          <Trophy size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No challenges found for this channel.</p>
          <p className="text-xs text-muted-foreground mt-1">Create quizzes, fastest answer, or question of the day challenges.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {challenges.map((c: any) => (
                <tr key={c._id || c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{c.title}</td>
                  <td className="px-4 py-3 text-muted-foreground uppercase text-xs font-semibold">{c.type || "quiz"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={c.status || "active"} variant={sv(c.status || "active")} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.participantCount ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/channels/challenges/${c._id || c.id}`}
                      className="text-xs text-[#02B2FF] hover:underline font-semibold"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Polls Tab ───────────────────────────────────────────────────────────────

function PollsTab({ stationId }: { stationId: string }) {
  const { data, isLoading } = useGetStationChannelPollsQuery({ stationId });
  const polls = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Polls / Vote</h3>
        <Link
          href={`/channels/polls/create?stationId=${stationId}`}
          className="flex items-center gap-2 px-4 py-2 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors"
        >
          <Plus size={14} /> Create Poll
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 bg-card rounded-xl border border-border">
          <Loader2 size={18} className="animate-spin text-[#02B2FF]" />
        </div>
      ) : polls.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
          <BarChart3 size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No polls found for this channel.</p>
          <p className="text-xs text-muted-foreground mt-1">Create polls with categories, nominees, and live vote tallies.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Total Votes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {polls.map((p: any) => (
                <tr key={p._id || p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.categories?.length ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.totalVotes ?? 0}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={p.status || "active"} variant={sv(p.status || "active")} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/channels/polls/${p._id || p.id}`}
                      className="text-xs text-[#02B2FF] hover:underline font-semibold"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Messages Tab ────────────────────────────────────────────────────────────

function MessagesTab({ stationId }: { stationId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Channel Messages</h3>
        <Link
          href={`/messages?stationId=${stationId}`}
          className="flex items-center gap-2 px-4 py-2 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors"
        >
          <MessageSquare size={14} /> Open Message Center
        </Link>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center">
        <MessageSquare size={32} className="mx-auto text-muted-foreground mb-3 text-[#02B2FF]" />
        <p className="text-sm font-semibold text-foreground">Direct Channel Messaging</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Manage conversation threads and listener inquiries for this channel directly in the Message Inbox.
        </p>
      </div>
    </div>
  );
}

function AnalyticsTab({ stationId, station }: { stationId: string; station: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-foreground">Channel Analytics</h3>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Followers" value={String(station.followerCount ?? 0)} icon={<Users size={16} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
        <KpiCard label="Status" value={station.isActive ? "Active" : "Inactive"} icon={<CheckCircle2 size={16} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KpiCard label="Active Items" value={station.isActive ? "1" : "0"} icon={<BarChart3 size={16} className="text-amber-500" />} iconBg="bg-amber-50" />
        <KpiCard label="Channel Type" value={station.channelType || "Standard"} icon={<Radio size={16} className="text-violet-500" />} iconBg="bg-violet-50" />
      </div>
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab({ station }: { station: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground">Settings</h3>
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Channel Name</p>
            <p className="text-sm font-medium text-foreground">{station.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Channel Code</p>
            <p className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{station.stationCode}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Channel Type</p>
            <p className="text-sm font-medium text-foreground">{station.channelType === "challenges" ? "Challenges" : station.channelType === "polls" ? "Polls / Vote" : "Message / Chat"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</p>
            <StatusBadge label={station.isActive ? "Active" : "Inactive"} variant={sv(station.isActive ? "Active" : "Inactive")} />
          </div>
        </div>
      </div>
    </div>
  );
}
