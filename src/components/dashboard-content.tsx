"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  SectionHeader,
  StatusBadge,
  sv,
  Avatar,
  ChartFilter,
} from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Building2,
  Radio,
  Users,
  MessageSquare,
  Phone,
  CreditCard,
  CheckCircle2,
  UserPlus,
  Monitor,
  Mic,
  BarChart3,
  ArrowUpRight,
  Activity,
  AlertCircle,
  Eye,
  Megaphone,
  PhoneIncoming,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Globe,
  ChevronRight,
  Star,
  Plus,
  TrendingUp,
  Send,
} from "lucide-react";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery } from "@/features/user/userApi";
import { useGetThreadsQuery, useSendReplyMutation } from "@/features/message/messageApi";
import { useGetActiveShowQuery } from "@/features/show/showApi";
import { useGetPollsQuery } from "@/features/poll/pollApi";
import { useGetStatementKPIsQuery } from "@/features/statement/statementApi";
import { useGetStationCallsQuery, useAcceptCallMutation, useRejectCallMutation } from "@/features/call/callApi";
import { useRouter } from "next/navigation";
import PresenterDashboard from "@/components/presenter-dashboard";
import CustomerCareDashboard from "@/components/customer-care-dashboard";
import ChannelAdminDashboard from "@/components/channel-admin-dashboard";
import {
  useGetDashboardStatsQuery,
  useGetMessageActivityQuery,
  useGetCallActivityQuery,
  useGetCampaignStatsQuery,
  useGetCallOperationsStatsQuery,
  useGetRoleDistributionQuery,
  useGetStationOverviewQuery,
  useGetRecentActivityQuery,
  useGetTopStationsQuery,
  useGetRecentUsersQuery,
  useGetCreditStatsQuery,
  useGetCountryRevenueQuery,
} from "@/features/dashboard/dashboardApi";
import { toast } from "sonner";
import { formatTime24h } from "@/utils/time-utils";
import { formatTime12h } from "@/components/shared/time-picker";
import { useTimezone } from "@/hooks/use-timezone";

const allQuickActions = [
  { label: "Add Partner",       href: "/users/partner-admins/create",  icon: <Building2 size={20}/>,  color: "text-[#02B2FF]", bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10 dark:bg-[#02B2FF]/10 dark:hover:bg-[#02B2FF]/20", minRole: "super_admin" as const },
  { label: "Add Station",       href: "/station-management/create", icon: <Radio size={20}/>,      color: "text-violet-500", bg: "bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/50", minRole: "partner_admin" as const },
  { label: "Add Presenter",     href: "/users/presenters/create",      icon: <Mic size={20}/>,        color: "text-emerald-500", bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50", minRole: "station_admin" as const },
  { label: "Add Media Station", href: "/users/media-stations/create",  icon: <Monitor size={20}/>,    color: "text-amber-500",  bg: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50", minRole: "station_admin" as const },
  { label: "Add Shows",         href: "/station-management/shows/create", icon: <Mic size={20}/>,      color: "text-[#02B2FF]",  bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10 dark:bg-[#02B2FF]/10 dark:hover:bg-[#02B2FF]/20", minRole: "station_admin" as const },
  { label: "View Reports",      href: "/reports",                      icon: <BarChart3 size={20}/>,  color: "text-rose-500",   bg: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50", minRole: "station_admin" as const },
  { label: "Manage Billing",    href: "/billing",                      icon: <CreditCard size={20}/>, color: "text-teal-500",   bg: "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50", minRole: "super_admin" as const },
];

// TODO: wire when backend role-distribution endpoint is built
const roleDistribution = [
  { role: "Partner Admins", count: 248, pct: 0.8, color: "bg-[#02B2FF]" },
  { role: "Station Admins", count: 1842, pct: 3.5, color: "bg-violet-500" },
  { role: "Media Stations", count: 3104, pct: 5.9, color: "bg-amber-500" },
  { role: "Presenters", count: 28640, pct: 54.6, color: "bg-emerald-500" },
  { role: "Customer Care", count: 18582, pct: 35.4, color: "bg-rose-500" },
];

const ROLE_HIERARCHY = ["super_admin", "partner_admin", "station_admin", "customer_care", "media_station", "presenter"];

function MediaStationDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId || "";
  const timezone = useTimezone();
  const [selectedMsg, setSelectedMsg] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real data from APIs
  const { data: threadsData, isLoading: threadsLoading } = useGetThreadsQuery(
    { stationId, page: 1, limit: 20 },
    { skip: !stationId }
  );
  const { data: activeShowData } = useGetActiveShowQuery(stationId, { skip: !stationId });
  const { data: pollsData } = useGetPollsQuery(
    { page: 1, limit: 1, station: stationId, status: "active" },
    { skip: !stationId }
  );
  const [sendReply, { isLoading: isSendingReply }] = useSendReplyMutation();

  // Calls — queued + active
  const router = useRouter();
  const { data: callsData, isLoading: callsLoading } = useGetStationCallsQuery(
    { stationId, status: "queued,answered", limit: 20 },
    { skip: !stationId }
  );
  const [acceptCall] = useAcceptCallMutation();
  const [rejectCall, { isLoading: isRejecting }] = useRejectCallMutation();

  const handleCutCall = async (callId: string) => {
    try {
      await rejectCall(callId).unwrap();
      toast.success("Call cut. Credit refunded to listener.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cut call");
    }
  };

  const calls = callsData?.data || [];
  const queuedCalls = calls.filter((c: any) => c.status === "queued");
  const activeCalls = calls.filter((c: any) => c.status === "answered");

  const threads = threadsData?.data || [];
  const activeShow = activeShowData?.data || null;
  const activePoll = pollsData?.data?.[0] || null;
  const incomingCount = threads.filter((t: any) => (t.unrepliedCount || 0) > 0).length;
  const repliedCount = threads.filter((t: any) => (t.unrepliedCount || 0) === 0).length;

  const selectedThread = selectedMsg !== null ? threads[selectedMsg] : null;

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    try {
      await sendReply({
        msisdn: selectedThread.msisdn,
        content: replyText.trim(),
      }).unwrap();
      setReplyText("");
      toast.success("Reply sent!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send reply");
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    Incoming: "bg-[#02B2FF]/10 text-[#02B2FF]",
    Replied: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className="space-y-4">
      {/* 3-Panel Top Section */}
      <div className="grid grid-cols-12 gap-4 h-[420px]">
        {/* Left - Messages */}
        <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Messages</span>
            <span className="px-2 py-0.5 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] text-[10px] font-bold">{threads.length}</span>
          </div>
          <div className="px-4 py-2 border-b border-border">
            <span className="text-xs text-muted-foreground">Incoming</span>
            <span className="ml-2 text-xs text-muted-foreground">{incomingCount}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading messages...</div>
            ) : threads.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">No messages yet</div>
            ) : (
              threads.map((thread: any, i: number) => (
                <button
                  key={thread.msisdn || i}
                  onClick={() => setSelectedMsg(i)}
                  className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${
                    selectedMsg === i ? "bg-[#EFF8FF]/50 dark:bg-[#02B2FF]/15 border-l-2 border-l-[#02B2FF]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{thread.msisdn || "Unknown"}</span>
                    <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">{thread.showName || ""}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${(thread.unrepliedCount || 0) > 0 ? "bg-[#02B2FF]" : "bg-emerald-400"}`} />
                    {thread.lastMessage || "No messages"}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-b border-border">
            <span className="text-xs text-muted-foreground">Replied</span>
            <span className="ml-2 text-xs text-muted-foreground">{repliedCount}</span>
          </div>
        </div>

        {/* Center - ON AIR */}
        <div className="col-span-6 bg-card rounded-xl border border-border shadow-sm flex flex-col items-center justify-center">
          {activeShow ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 text-xs font-bold uppercase">ON AIR</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <p className="text-5xl font-bold text-foreground font-['JetBrains_Mono',monospace] mb-4">
                {formatTime24h(now, timezone)}
              </p>
              <p className="text-lg font-bold text-foreground mb-1">{activeShow.name}</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-lg border border-border text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{formatTime12h(activeShow.startTime)}</span>
                <span className="text-muted-foreground">—</span>
                <span className="px-3 py-1 rounded-lg border border-border text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{formatTime12h(activeShow.endTime)}</span>
              </div>
              {activeShow.timeRemainingMinutes > 0 && (
                <p className="text-xs text-muted-foreground">
                  {activeShow.timeRemainingMinutes >= 60
                    ? `${Math.floor(activeShow.timeRemainingMinutes / 60)}h ${activeShow.timeRemainingMinutes % 60}m remaining`
                    : `${activeShow.timeRemainingMinutes}m remaining`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-5xl font-bold text-foreground font-['JetBrains_Mono',monospace] mb-4">
                {formatTime24h(now, timezone)}
              </p>
              <p className="text-xl font-bold text-muted-foreground">No show is running</p>
            </>
          )}
        </div>

        {/* Right - Calls */}
        <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Calls</span>
            <span className="px-2 py-0.5 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] text-[10px] font-bold">{queuedCalls.length + activeCalls.length}</span>
          </div>
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Incoming {queuedCalls.length}</span>
            <span className="text-xs text-muted-foreground">Active {activeCalls.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {callsLoading ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading calls...</div>
            ) : calls.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">No incoming calls</div>
            ) : (
              [...queuedCalls, ...activeCalls].map((call: any) => {
                const callerName = call.startedBy?.fullName || "Unknown";
                const callerPhone = call.startedBy?.phone || "";
                const showName = call.show?.name || "";
                const isQueued = call.status === "queued";
                return (
                  <div
                    key={call._id}
                    className="px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-foreground">{callerName}</span>
                      <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">{showName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground truncate">{callerPhone}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        isQueued ? "bg-[#02B2FF]/10 text-[#02B2FF]" : "bg-emerald-100 text-emerald-600"
                      }`}>
                        {isQueued ? "Incoming" : "Active"}
                      </span>
                    </div>
                    {isQueued && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => router.push("/calls")}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#02B2FF] text-white text-[11px] font-semibold hover:bg-[#02B2FF]/90 transition-colors flex items-center justify-center gap-1"
                        >
                          <Phone size={12} /> Accept Call
                        </button>
                        <button
                          onClick={() => handleCutCall(call._id)}
                          disabled={isRejecting}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-[11px] font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400"
                          title="Cut Call & Refund Credit"
                        >
                          <PhoneOff size={12} /> Cut Call
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="px-4 py-2 border-t border-border">
            <button
              onClick={() => router.push("/calls")}
              className="w-full text-center text-[11px] text-[#02B2FF] font-semibold hover:underline"
            >
              View All Calls
            </button>
          </div>
        </div>
      </div>

      {/* Message Detail + Reply */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        {selectedThread ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-foreground">{selectedThread.msisdn}</p>
                <p className="text-xs text-muted-foreground">{selectedThread.showName || "No show"} · {selectedThread.unrepliedCount || 0} unreplied</p>
              </div>
            </div>
            <div className="bg-muted/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-foreground leading-relaxed">
                {selectedThread.lastMessage || "No message content"}
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                placeholder="Type your reply to the listener..."
                className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSendingReply}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} /> {isSendingReply ? "Sending..." : "Send"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <MessageSquare size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Select a message to view details and reply</p>
          </div>
        )}
      </div>

      {/* Bottom Section - Top Fans + Poll */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Fans (placeholder) */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-amber-500" />
            <span className="text-sm font-bold text-foreground">Top Fans</span>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <Users size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No fan data yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Fan tracking coming soon</p>
            </div>
          </div>
        </div>

        {/* Poll */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-[#02B2FF]" />
            <span className="text-sm font-bold text-foreground">Poll</span>
          </div>
          {activePoll ? (
            <>
              <p className="text-sm font-semibold text-foreground mb-4">{activePoll.question}</p>
              <div className="space-y-3">
                {(activePoll.options || []).map((opt: any, i: number) => {
                  const totalVotes = (activePoll.options || []).reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
                  const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground">{opt.text || opt.label || `Option ${i + 1}`}</span>
                        <span className="text-xs font-bold text-[#02B2FF] font-['JetBrains_Mono',monospace]">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[#02B2FF] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <BarChart3 size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No active poll</p>
                <p className="text-[10px] text-muted-foreground mt-1">Create a poll to engage listeners</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const isMediaStation = role === "media_station";
  const isPresenter = role === "presenter";
  const isCustomerCare = role === "customer_care";
  const user = useAppSelector((state) => state.auth.user);
  const { data: profileData } = useGetMyProfileQuery();
  const liveUser = profileData?.data || user;
  const [period, setPeriod] = useState("monthly");

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(undefined);
  const { data: messageActivity } = useGetMessageActivityQuery({ period });
  const { data: callActivity } = useGetCallActivityQuery({ period });
  const skipSuperQueries = !isSuperAdmin && !isPartnerAdmin;
  const { data: campaignStats } = useGetCampaignStatsQuery(undefined, { skip: skipSuperQueries });
  const { data: callOpsStats } = useGetCallOperationsStatsQuery(undefined, { skip: skipSuperQueries });
  const { data: roleDistData } = useGetRoleDistributionQuery(undefined, { skip: !isSuperAdmin });
  const { data: stationOverview } = useGetStationOverviewQuery(undefined, { skip: skipSuperQueries });
  const { data: recentActivity } = useGetRecentActivityQuery({ limit: 10 }, { skip: skipSuperQueries });
  const { data: topStationsData } = useGetTopStationsQuery({ limit: 5 }, { skip: skipSuperQueries });
  const { data: recentUsersData } = useGetRecentUsersQuery({ limit: 6 }, { skip: !isSuperAdmin });
  const { data: creditStats } = useGetCreditStatsQuery(undefined, { skip: skipSuperQueries });
  const { data: countryRevenueData } = useGetCountryRevenueQuery(undefined, { skip: !isSuperAdmin });
  const { data: kpiData } = useGetStatementKPIsQuery({});

  const msgMap = new Map((messageActivity?.data ?? []).map((d: any) => [d.date, d.count]));
  const callMap = new Map((callActivity?.data ?? []).map((d: any) => [d.date, d.count]));
  const allDates = Array.from(new Set([...msgMap.keys(), ...callMap.keys()])).sort();
  const chartMapped = allDates.length > 0
    ? allDates.map((date) => ({
        name: date,
        m: msgMap.get(date) || 0,
        c: callMap.get(date) || 0,
      }))
    : (messageActivity?.data ?? []).map((d: any) => ({ name: d.date, m: d.count, c: 0 }));

  const roleDistribution = (roleDistData?.data ?? []).length > 0
    ? roleDistData.data
    : [
        { role: "Partner Admins", count: 0, pct: 0, color: "bg-[#02B2FF]" },
        { role: "Station Admins", count: 0, pct: 0, color: "bg-violet-500" },
        { role: "Media Stations", count: 0, pct: 0, color: "bg-amber-500" },
        { role: "Presenters", count: 0, pct: 0, color: "bg-emerald-500" },
        { role: "Customer Care", count: 0, pct: 0, color: "bg-rose-500" },
      ];

  const stationRowsData = (stationOverview?.data ?? []).map((s: any) => ({
    name: s.stationName,
    country: s.country || "",
    shows: s.activeShows,
    messages: s.messagesToday,
    calls: s.callsToday ?? 0,
    status: s.status,
  }));

  if (isMediaStation) {
    return <MediaStationDashboard />;
  }

  if (isPresenter) {
    return <PresenterDashboard />;
  }

  if (isCustomerCare) {
    return <CustomerCareDashboard />;
  }

  const rawCat = (liveUser as any)?.stationCategory || (liveUser as any)?.station?.category || (user as any)?.stationCategory || (user as any)?.station?.category;
  const isChannelStation = rawCat === "channel" || rawCat === "channels";
  if (isStationAdmin && isChannelStation) {
    return <ChannelAdminDashboard />;
  }

  const quickActions = allQuickActions.filter((a) => {
    const minIdx = ROLE_HIERARCHY.indexOf(a.minRole);
    const curIdx = ROLE_HIERARCHY.indexOf(role);
    return curIdx <= minIdx;
  });

  return (
    <div className="space-y-7">
      {/* Section 1: Executive Overview */}
      <section>
        <SectionHeader title="Executive Overview" sub={
          isStationAdmin ? "Your station performance" :
          isPartnerAdmin ? "Your partner performance" :
          "Platform-wide performance at a glance"
        } />
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {isSuperAdmin && (
            <KpiCard key="partners" label="Total Partners" value={statsData?.data?.totalPartners ?? "--"} sub="Active organizations" icon={<Building2 size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
          )}
          {(isSuperAdmin || isPartnerAdmin) && (
            <KpiCard key="stations" label="Total Stations" value={statsData?.data?.totalStations ?? "--"} sub={isPartnerAdmin ? "Under your partner" : "Radio & TV"} icon={<Radio size={16} className="text-violet-500"/>} iconBg="bg-violet-50"/>
          )}
          <KpiCard key="users" label="Total Users" value={statsData?.data?.totalUsers ?? "--"} sub={isStationAdmin ? "At your station" : isPartnerAdmin ? "Under your partner" : "All roles"} icon={<Users size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
          <KpiCard key="messages" label="Total Messages" value={statsData?.data?.totalMessages ?? "--"} sub={isStationAdmin ? "At your station" : isPartnerAdmin ? "Under your partner" : "All messages"} icon={<MessageSquare size={16} className="text-amber-500"/>} iconBg="bg-amber-50"/>
          <KpiCard key="calls" label="Total Calls" value={statsData?.data?.totalCalls ?? "--"} sub="All calls" icon={<Phone size={16} className="text-rose-500"/>} iconBg="bg-rose-50"/>
          <KpiCard key="revenue" label="Revenue" value={statsData?.data?.totalRevenue ? `${statsData.data.totalRevenue.toLocaleString()}` : "0"} sub={isStationAdmin ? "Station revenue" : isPartnerAdmin ? "Partner revenue" : "Total revenue"} icon={<CreditCard size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
        </div>
      </section>

      {/* Section 2: Quick Management */}
      <section>
        <SectionHeader title="Quick Management" sub="Click a card to navigate to the corresponding workflow" />
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className={`${action.bg} rounded-xl py-6 px-4 flex flex-col items-center gap-3 border border-border hover:border-transparent hover:shadow-md transition-all group cursor-pointer`}>
                <div className={`${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</div>
                <span className="text-xs font-semibold text-foreground text-center leading-tight">{action.label}</span>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 3: Partner Overview + User Role Distribution */}
      {isSuperAdmin && (
      <section>
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          {/* Left: Partner Overview */}
          <div>
            <SectionHeader title="Partner Overview" sub="Partner health and growth metrics" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <KpiCard label="Total Partners" value={statsData?.data?.totalPartners ?? "--"} icon={<Building2 size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
              <KpiCard label="Active Partners" value={statsData?.data?.activePartners ?? "--"} icon={<CheckCircle2 size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
              <KpiCard label="New This Month" value="--" icon={<UserPlus size={16} className="text-violet-500"/>} iconBg="bg-violet-50"/>
              <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top Partner</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">CF</div>
                  <div><div className="text-sm font-bold text-foreground">Capital FM</div><div className="text-[10px] text-muted-foreground">Kenya · 14 stations</div></div>
                  <Star size={14} className="text-amber-400 ml-auto"/>
                </div>
              </div>
            </div>
          </div>

          {/* Right: User Role Distribution */}
          <div>
            <SectionHeader title="User Role Distribution" sub="Active users by role" />
            <div className="mt-4 grid grid-cols-1 gap-2">
              {roleDistribution.map((item: any) => (
                <button key={item.role} className="bg-card rounded-xl border border-border px-4 py-3 shadow-sm flex items-center gap-3 hover:border-[#02B2FF]/30 hover:shadow-md transition-all text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{item.role}</span>
                      <span className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace]">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(item.pct * 1.7, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace] ml-1">{item.pct}%</span>
                  <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Section 4: Platform Performance */}
      <section>
        <SectionHeader title="Platform Performance">
          <ChartFilter
            value={period}
            onChange={setPeriod}
          />
        </SectionHeader>
        <div className="mt-4 grid grid-cols-1 gap-7 lg:grid-cols-2">
          {/* Message Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold">Message Activity</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartMapped}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="m"
                      stroke="#02B2FF"
                      fill="#02B2FF"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Call Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold">Call Activity</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartMapped}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="c"
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 5: Listener Statement Summary */}
      <section>
        <SectionHeader title="Listener Statement Summary" sub="Aggregated listener interaction data" />
        <div className="mt-4 grid grid-cols-3 gap-4">
          <KpiCard label="Total Messages" value={kpiData?.data?.totalMessages?.toLocaleString() ?? "0"} icon={<MessageSquare size={16} className="text-amber-500"/>} iconBg="bg-amber-50"/>
          <KpiCard label="Total Calls" value={kpiData?.data?.totalCalls?.toLocaleString() ?? "0"} icon={<Phone size={16} className="text-rose-500"/>} iconBg="bg-rose-50"/>
          <KpiCard label="Total Paid Interactions" value={kpiData?.data?.totalInteractions?.toLocaleString() ?? "0"} icon={<CreditCard size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
        </div>
      </section>

      {/* Section 6: Campaign Overview */}
      <section>
        <SectionHeader title="Campaign Overview" sub="Active and historical campaign metrics" />
        <div className="mt-4 grid grid-cols-4 gap-4">
          <KpiCard label="Active Campaigns" value={String(campaignStats?.data?.activeCampaigns ?? "--")} icon={<Activity size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
          <KpiCard label="Expired Campaigns" value={String(campaignStats?.data?.expiredCampaigns ?? "--")} sub="All-time" icon={<AlertCircle size={16} className="text-muted-foreground"/>} iconBg="bg-muted"/>
          <KpiCard label="Campaign Views" value={campaignStats?.data?.campaignViews != null ? campaignStats.data.campaignViews.toLocaleString() : "--"} icon={<Eye size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top Campaign</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Megaphone size={15} className="text-amber-600"/></div>
              <div><div className="text-sm font-bold text-foreground leading-tight">{campaignStats?.data?.topCampaign?.title || "No campaigns yet"}</div><div className="text-[10px] text-muted-foreground">{(campaignStats?.data?.topCampaign?.views || 0).toLocaleString()} views · {campaignStats?.data?.topCampaign?.type || "Manual"}</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Station Overview */}
      <section>
        <SectionHeader title="Station Overview" sub="Live station performance metrics" />
        <div className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station Name</th>
                {isSuperAdmin && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                )}
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Shows</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages Today</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calls Today</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {stationRowsData.map((row: any) => (
                <tr key={row.name} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF8FF] flex items-center justify-center">
                        <Radio size={13} className="text-[#02B2FF]" />
                      </div>
                      <span className="font-semibold text-foreground text-xs">{row.name}</span>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{row.country}</td>
                  )}
                  <td className="px-5 py-3.5 text-xs text-right font-['JetBrains_Mono',monospace] font-medium text-foreground">{row.shows}</td>
                  <td className="px-5 py-3.5 text-xs text-right font-['JetBrains_Mono',monospace] font-medium text-foreground">{row.messages.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-xs text-right font-['JetBrains_Mono',monospace] font-medium text-foreground">{row.calls.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge label={row.status} variant={sv(row.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 8: Call Operations Overview */}
      <section>
        <SectionHeader title="Call Operations Overview" sub="Inbound call handling performance" />
        <div className="mt-4 grid grid-cols-4 gap-4 mb-4">
          <KpiCard label="Incoming Calls" value={callOpsStats?.data?.incomingCalls != null ? callOpsStats.data.incomingCalls.toLocaleString() : "--"} icon={<PhoneIncoming size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
          <KpiCard label="Answered Calls" value={callOpsStats?.data?.answeredCalls != null ? callOpsStats.data.answeredCalls.toLocaleString() : "--"} sub={`${callOpsStats?.data?.callSuccessRate ?? 0}% rate`} icon={<PhoneCall size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
          <KpiCard label="Missed Calls" value={callOpsStats?.data?.missedCalls != null ? callOpsStats.data.missedCalls.toLocaleString() : "--"} icon={<PhoneMissed size={16} className="text-amber-500"/>} iconBg="bg-amber-50"/>
          <KpiCard label="Rejected Calls" value={callOpsStats?.data?.rejectedCalls != null ? callOpsStats.data.rejectedCalls.toLocaleString() : "--"} icon={<PhoneOff size={16} className="text-red-500"/>} iconBg="bg-red-50"/>
        </div>

        {/* Circular Gauges */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center justify-center gap-6 p-6">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                className="-rotate-90"
              >
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(callOpsStats?.data?.callSuccessRate ?? 0) * 3.14159} ${314.159}`}
                  />
                </svg>
                <div>
                  <p className="text-sm text-muted-foreground">Call Success Rate</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{callOpsStats?.data?.callSuccessRate ?? 0}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-center gap-6 p-6">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                className="-rotate-90"
              >
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#02B2FF"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(callOpsStats?.data?.callResponseRate ?? 0) * 3.14159} ${314.159}`}
                  />
                </svg>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Call Response Rate
                  </p>
                  <p className="text-3xl font-bold text-[#02B2FF]">{callOpsStats?.data?.callResponseRate ?? 0}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 9: Recent Activity + Top Performing Stations */}
      <section>
        <div className={`grid gap-5 ${isStationAdmin ? "grid-cols-1" : "grid-cols-5"}`}>
          {/* Recent Activity */}
          <div className={isStationAdmin ? "col-span-1" : "col-span-3"}>
            <SectionHeader title="Recent Activity" sub="Latest platform events" />
            <div className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {(recentActivity?.data ?? []).map((activity: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <div className={`w-8 h-8 rounded-full ${activity.color || "bg-[#EFF8FF] text-[#02B2FF]"} flex items-center justify-center text-xs font-bold shrink-0`}>{activity.initials || "?"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">{activity.name || "Unknown"}</span>{" "}
                      <span className="text-muted-foreground">{activity.action || ""}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{activity.time || ""}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Stations */}
          {!isStationAdmin && (
          <div className="col-span-2">
            <SectionHeader title="Top Performing Stations" sub="By engagement score" />
            <div className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {(topStationsData?.data ?? []).map((station: any, i: number) => {
                const rank = i + 1;
                return (
                <div key={rank} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rank===1?"bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400":rank===2?"bg-muted text-muted-foreground dark:bg-white/10":"bg-orange-50 text-orange-400 dark:bg-orange-950/40 dark:text-orange-400"}`}>{rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{station.name || station.stationName || ""}</div>
                    <div className="text-[10px] text-muted-foreground">{station.country || ""}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace]">{station.score ?? "--"}</div>
                    <div className="text-[10px] text-muted-foreground">{(station.messages ?? station.messageCount ?? 0).toLocaleString()} msgs</div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Section 10: Recent Users */}
      {!isStationAdmin && (
      <section>
        <SectionHeader title="Recent Users" sub="Newly registered and recently active users" />
        <div className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {(recentUsersData?.data ?? []).map((user: any) => (
                <tr key={user.email || user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF] text-xs font-bold">{user.initials || "?"}</div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{user.name || "Unknown"}</div>
                        <div className="text-[10px] text-muted-foreground">{user.email || ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-foreground">{user.role || ""}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{user.station || user.stationName || ""}</td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge label={user.status || "Active"} variant={sv(user.status || "Active")} />
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">{user.lastActive || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* Section 11: Billing & Credits Overview */}
      {!isStationAdmin && (
      <section>
        <SectionHeader title="Billing & Credits Overview" sub="Platform-wide financial metrics" />
        <div className="mt-4 grid grid-cols-5 gap-4">
          <KpiCard label="Credits Purchased" value={creditStats?.data?.creditsPurchased ?? "--"} icon={<Plus size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
          <KpiCard label="Credits Used" value={creditStats?.data?.creditsUsed ?? "--"} icon={<Activity size={16} className="text-violet-500"/>} iconBg="bg-violet-50"/>
          <KpiCard label="Successful Txns" value={creditStats?.data?.successfulTxns ?? "--"} icon={<CheckCircle2 size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
          <KpiCard label="Failed Txns" value={creditStats?.data?.failedTxns ?? "--"} icon={<AlertCircle size={16} className="text-red-500"/>} iconBg="bg-red-50"/>
          <KpiCard label="Revenue Generated" value={creditStats?.data?.totalRevenue ? `$${creditStats.data.totalRevenue.toLocaleString()}` : "--"} icon={<TrendingUp size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
        </div>
      </section>
      )}

      {/* Section 12: Country Revenue Overview */}
      {isSuperAdmin && (
      <section>
        <SectionHeader title="Country Revenue Overview" />
        <div className="mt-4 overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Country
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Stations
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Messages
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Calls
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody>
                {(countryRevenueData?.data ?? []).map((row: any) => (
                  <tr key={row.name} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{row.flag || ""}</span>
                        <span className="font-medium">{row.name || row.country || ""}</span>
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {(row.stations ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.messages ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.calls ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {row.revenue ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-emerald-600">
                        {row.growth ?? "--"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      )}

      <div className="h-4" />
    </div>
  );
}
