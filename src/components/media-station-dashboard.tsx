"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Radio,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Mic,
  MicOff,
  Clock,
  Send,
  BarChart3,
  Users,
  Star,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAppSelector } from "@/store/hooks";
import { useTimezone } from "@/hooks/use-timezone";
import { useCallContext } from "@/contexts/call-context";
import { useGetActiveShowQuery, useGetShowsQuery, useGetLiveStatsQuery } from "@/features/show/showApi";
import {
  useGetThreadsQuery,
  useGetThreadQuery,
  useSendReplyMutation,
} from "@/features/message/messageApi";
import { useGetPollsQuery } from "@/features/poll/pollApi";
import { useGetStationCallsQuery, useRejectCallMutation } from "@/features/call/callApi";
import { useGetMyProfileQuery } from "@/features/user/userApi";
import { formatClock12h, formatDuration, pickTimezone } from "@/utils/time-utils";
import { formatTime12h as formatTime12hPicker } from "@/components/shared/time-picker";
import { resolveUrl } from "@/lib/utils";
import { ChatMessageMedia } from "@/components/shared/chat-message-media";
import { toast } from "sonner";

const AVATAR_COLORS = [
  "bg-[#02B2FF] text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-500 text-white",
  "bg-teal-500 text-white",
];

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function secondsSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function MediaStationDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const reduxTimezone = useTimezone();
  const { data: profileData } = useGetMyProfileQuery();
  const liveUser = profileData?.data || user;
  // Profile may return null timezone when country is not linked — merge with login/Redux
  const profileTimezone =
    (profileData?.data as any)?.timezone ??
    (liveUser as any)?.station?.country?.timezone ??
    null;
  const timezone = pickTimezone(profileTimezone, liveUser?.timezone, reduxTimezone);

  // Station ID derivation
  const stationId =
    liveUser?.stationId?._id ||
    liveUser?.stationId?.toString() ||
    user?.stationId ||
    "";
  const stationName =
    liveUser?.stationName ||
    liveUser?.station?.name ||
    user?.stationName ||
    "Studio Pass Broadcast";
  const stationCategory =
    liveUser?.stationCategory ||
    liveUser?.station?.category ||
    "Radio Station";

  // Real-time ticking clock
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Call Context (Agora RTC + Realtime Socket)
  const callCtx = useCallContext();

  // Queries
  const { data: activeShowData, refetch: refetchActiveShow } = useGetActiveShowQuery(
    stationId,
    { skip: !stationId, pollingInterval: 20000 }
  );
  const activeShow = activeShowData?.data || null;

  const { data: liveStatsData, refetch: refetchLiveStats } = useGetLiveStatsQuery(
    stationId,
    { skip: !stationId, pollingInterval: 10000 }
  );
  const liveStats = liveStatsData?.data?.stats || {
    incomingMessages: 0,
    calls: 0,
    waitingCalls: 0,
    successfulInteractions: 0,
    uncutCalls: 0,
  };

  const { data: showsData } = useGetShowsQuery(
    { station: stationId, limit: 10 },
    { skip: !stationId }
  );
  const { data: threadsData, isLoading: threadsLoading } = useGetThreadsQuery(
    {
      stationId,
      showId: activeShow?.id || activeShow?._id,
      todayOnly: true,
      page: 1,
      limit: 50,
    },
    { skip: !stationId || !activeShow, pollingInterval: 8000 }
  );
  const { data: pollsData } = useGetPollsQuery(
    { page: 1, limit: 1, station: stationId, status: "active" },
    { skip: !stationId }
  );
  const { data: serverCallsData } = useGetStationCallsQuery(
    {
      stationId,
      showId: activeShow?.id || activeShow?._id,
      todayOnly: true,
      status: "queued,answered",
      limit: 50,
    },
    { skip: !stationId || !activeShow }
  );

  const [rejectCallMutation, { isLoading: isCuttingCall }] = useRejectCallMutation();
  const [sendReplyMutation, { isLoading: isSendingReply }] = useSendReplyMutation();

  // Message selection & Quick Reply state
  const [selectedThreadMsisdn, setSelectedThreadMsisdn] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [messageFilter, setMessageFilter] = useState<"all" | "unreplied">("all");

  const allShows = showsData?.data || [];

  // Reset selection when show changes or ends
  const activeShowId = activeShow?.id || activeShow?._id || null;
  useEffect(() => {
    setSelectedThreadMsisdn(null);
    setReplyText("");
  }, [activeShowId]);

  // Boundary check: when active show's end time is reached, trigger immediate refresh
  useEffect(() => {
    if (!activeShow?.endTime) return;
    const [endH, endM] = activeShow.endTime.split(":").map(Number);
    try {
      const tzNow = new Date(now.toLocaleString("en-US", { timeZone: timezone || "UTC" }));
      if (tzNow.getHours() === endH && tzNow.getMinutes() === endM && tzNow.getSeconds() <= 2) {
        refetchActiveShow();
        refetchLiveStats();
      }
    } catch {
      // Ignore
    }
  }, [now, activeShow?.endTime, timezone, refetchActiveShow, refetchLiveStats]);

  // If no active show, find next scheduled show if any
  const nextShow = useMemo(() => {
    if (activeShow) return null;
    return allShows.find((s: any) => s.status === "Scheduled" || s.status === "Active") || allShows[0] || null;
  }, [activeShow, allShows]);

  // Calls data merging (CallContext + Server API)
  const serverCalls = serverCallsData?.data || [];
  const waitingCalls = callCtx?.waitingCalls?.length ? callCtx.waitingCalls : serverCalls.filter((c: any) => c.status === "queued");
  const answeredCalls = serverCalls.filter((c: any) => c.status === "answered");
  const activeCall = callCtx?.activeCall || answeredCalls[0] || null;

  // Threads data
  const threads = threadsData?.data || [];
  const unrepliedThreads = threads.filter((t: any) => (t.unrepliedCount || 0) > 0);
  const displayedThreads = messageFilter === "unreplied" ? unrepliedThreads : threads;

  // Selected Thread
  const currentSelectedMsisdn = selectedThreadMsisdn || displayedThreads[0]?.msisdn || "";
  const selectedThread = threads.find((t: any) => t.msisdn === currentSelectedMsisdn) || displayedThreads[0] || null;

  const { data: threadDetailData } = useGetThreadQuery(
    { stationId, msisdn: currentSelectedMsisdn },
    { skip: !stationId || !currentSelectedMsisdn, pollingInterval: 5000 }
  );

  // Active Poll
  const activePoll = pollsData?.data?.[0] || null;
  const pollTotalVotes = activePoll?.options?.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0) || activePoll?.totalVotes || 0;

  // Quick Reply handler
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread?.msisdn) return;
    try {
      await sendReplyMutation({
        stationId,
        msisdn: selectedThread.msisdn,
        content: replyText.trim(),
      }).unwrap();
      setReplyText("");
      toast.success("Reply sent to listener!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send reply");
    }
  };

  // Call Cut / End handler
  const handleCutActiveCall = async (callId: string) => {
    try {
      if (callCtx?.endActiveCall) {
        await callCtx.endActiveCall();
      } else {
        await rejectCallMutation(callId).unwrap();
      }
      toast.success("Call ended. Credit refunded to listener.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cut call");
    }
  };

  // Call Accept handler
  const handleAcceptWaitingCall = async (call: any) => {
    const callId = call._id || call.callId || call.id;
    try {
      if (callCtx?.acceptCall) {
        await callCtx.acceptCall(callId, {
          callerName: call.callerName || (typeof call.startedBy === "object" ? call.startedBy?.fullName : "") || "Listener",
          callerPhone: call.callerPhone || (typeof call.startedBy === "object" ? call.startedBy?.phone : ""),
          showName: activeShow?.name || call.showName || "Live Show",
        });
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to connect call");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── 1. ON-AIR LIVE BROADCAST HERO BANNER ──────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#02B2FF] via-[#0092D8] to-[#0284C7] p-6 text-white shadow-xl">
        {/* Background glow decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-sky-300/10 blur-xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Left: Station & Show Status */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Radio size={13} className="text-sky-200" />
                {stationName}
              </span>
              {activeShow ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  ON AIR LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                  <Clock size={12} />
                  STUDIO STANDBY
                </span>
              )}
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium capitalize">
                {stationCategory}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeShow ? activeShow.name : nextShow ? `Upcoming: ${nextShow.name}` : "Studio Broadcast Console"}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-sky-100/90 font-medium">
              {activeShow ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <Mic size={14} className="text-sky-200" />
                    Host: {activeShow.presenter?.fullName || activeShow.presenterName || "Live Presenter"}
                  </span>
                  <span>•</span>
                  <span>
                    Schedule: {formatTime12hPicker(activeShow.startTime)} – {formatTime12hPicker(activeShow.endTime)}
                  </span>
                  {activeShow.days && (
                    <>
                      <span>•</span>
                      <span className="uppercase">{activeShow.days.join(", ")}</span>
                    </>
                  )}
                </>
              ) : nextShow ? (
                <span>
                  Next scheduled program starts at {formatTime12hPicker(nextShow.startTime)}
                </span>
              ) : (
                <span>Manage live on-air phone calls, incoming listener SMS, and active polls.</span>
              )}
            </div>
          </div>

          {/* Right: Digital Studio Clock & Quick Live Status */}
          <div className="flex flex-col items-start lg:items-end justify-center rounded-xl bg-black/20 p-4 backdrop-blur-md border border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-sky-200 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Studio Master Clock
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-mono tracking-wider text-white mt-0.5">
              {formatClock12h(now, timezone)}
            </div>
            <div className="text-[11px] text-sky-200/80 mt-1">
              Timezone: {timezone || "Station Local"}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. REAL-TIME STUDIO KPI METRICS (DAILY ACTIVE SHOW) ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          label="Incoming Messages"
          value={String(liveStats.incomingMessages)}
          sub={activeShow ? "Received during this show today" : "Studio standby"}
          icon={<MessageSquare size={18} className="text-amber-500" />}
          iconBg="bg-amber-50 dark:bg-amber-950/30"
        />
        <KpiCard
          label="Calls"
          value={String(liveStats.calls)}
          sub={activeShow ? "Total calls for this show today" : "Studio standby"}
          icon={<Phone size={18} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF] dark:bg-[#02B2FF]/10"
        />
        <KpiCard
          label="Waiting Calls"
          value={String(waitingCalls.length > 0 ? waitingCalls.length : liveStats.waitingCalls)}
          sub={waitingCalls.length > 0 ? `${waitingCalls.length} caller(s) in queue` : "Queue empty"}
          icon={<PhoneIncoming size={18} className="text-rose-500" />}
          iconBg="bg-rose-50 dark:bg-rose-950/30"
          trend={waitingCalls.length > 0 ? { val: `${waitingCalls.length} waiting`, up: true } : undefined}
        />
        <KpiCard
          label="Successful Interactions"
          value={String(liveStats.successfulInteractions)}
          sub={activeShow ? "Answered calls + replied messages" : "Studio standby"}
          icon={<CheckCircle2 size={18} className="text-emerald-500" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <KpiCard
          label="Uncut Calls"
          value={String(liveStats.uncutCalls)}
          sub={activeShow ? "Completed without operator cut" : "Studio standby"}
          icon={<PhoneCall size={18} className="text-violet-500" />}
          iconBg="bg-violet-50 dark:bg-violet-950/30"
        />
      </div>

      {/* ─── 3. MAIN STUDIO OPERATIONS CONSOLE (2-PANEL LAYOUT) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT: LIVE CALLS & WAITING QUEUE (7 Cols) ───────────────── */}
        <Card className="lg:col-span-7 p-5 bg-card border-border shadow-sm flex flex-col justify-between space-y-5">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <PhoneCall size={16} className="text-emerald-500" />
                  Live On-Air Calls & Queue
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Manage live caller audio, take waiting calls, or cut disconnected lines
                </p>
              </div>
              <Link
                href="/calls"
                className="text-xs font-semibold text-[#02B2FF] hover:underline flex items-center gap-1"
              >
                Full Console <ChevronRight size={13} />
              </Link>
            </div>

            {/* Live On-Air Call Banner */}
            <div className="mt-4">
              {activeCall ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-emerald-500">
                          {activeCall.callerAvatar && (
                            <AvatarImage src={resolveUrl(activeCall.callerAvatar)} alt="Caller" />
                          )}
                          <AvatarFallback className="bg-emerald-600 text-white font-bold">
                            {getInitials(activeCall.callerName || "Listener")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {activeCall.callerName || "Live Caller"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase">
                            ON SPEAKER
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {activeCall.callerPhone || (typeof activeCall.startedBy === "object" ? activeCall.startedBy?.phone : "Private Number")}
                        </p>
                      </div>
                    </div>

                    {/* Live Duration & Call Actions */}
                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 font-mono">
                          {callCtx?.isInCall
                            ? formatDuration(callCtx.callDuration)
                            : formatDuration(secondsSince(activeCall.answeredAt || activeCall.startedAt))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">Connected</span>
                      </div>

                      {/* Mute Toggle */}
                      {callCtx?.toggleMute && (
                        <button
                          onClick={() => callCtx.toggleMute()}
                          className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            callCtx.isMuted
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                              : "bg-card border-border hover:bg-muted text-foreground"
                          }`}
                          title={callCtx.isMuted ? "Unmute Mic" : "Mute Mic"}
                        >
                          {callCtx.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                        </button>
                      )}

                      {/* Cut Call Button */}
                      <button
                        onClick={() => handleCutActiveCall(activeCall.callId || activeCall._id || activeCall.id)}
                        disabled={isCuttingCall || callCtx?.isEnding}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <PhoneOff size={14} />
                        <span>{isCuttingCall || callCtx?.isEnding ? "Ending..." : "Cut Call"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5 text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center mb-2">
                    <PhoneIncoming size={18} />
                  </div>
                  <p className="text-xs font-bold text-foreground">No Caller Currently Live On Air</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                    {waitingCalls.length > 0
                      ? `${waitingCalls.length} caller(s) are waiting in the queue. Click "Accept" below to connect.`
                      : "Broadcast phone lines are open and ready for incoming listeners."}
                  </p>
                </div>
              )}
            </div>

            {/* Waiting Queue List */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={12} />
                  Waiting Queue ({waitingCalls.length})
                </span>
                {waitingCalls.length > 0 && (
                  <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                    <Clock size={10} /> Live Waiting List
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {waitingCalls.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/60">
                    Queue is empty. No listeners waiting.
                  </div>
                ) : (
                  waitingCalls.map((call: any, idx: number) => {
                    const callerName =
                      call.callerName ||
                      (typeof call.startedBy === "object" ? call.startedBy?.fullName : "") ||
                      `Caller #${idx + 1}`;
                    const callerPhone =
                      call.callerPhone ||
                      (typeof call.startedBy === "object" ? call.startedBy?.phone : "");
                    const waitSecs = secondsSince(call.waitStartedAt || call.startedAt);
                    const callId = call._id || call.callId || call.id;

                    return (
                      <div
                        key={callId || idx}
                        className="p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-9 h-9 shrink-0">
                            <AvatarFallback className={`text-xs font-bold ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                              {getInitials(callerName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 truncate">
                            <p className="text-xs font-semibold text-foreground truncate">{callerName}</p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">{callerPhone || "Incoming Line"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md font-semibold">
                            {formatWait(waitSecs)}
                          </span>

                          <button
                            onClick={() => handleAcceptWaitingCall(call)}
                            disabled={callCtx?.acceptingId === callId}
                            className="px-3 py-1.5 rounded-lg bg-[#02B2FF] text-white text-xs font-bold hover:bg-[#0092D8] transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                          >
                            <PhoneCall size={12} />
                            <span>{callCtx?.acceptingId === callId ? "Connecting..." : "Accept"}</span>
                          </button>

                          <button
                            onClick={() => handleCutActiveCall(callId)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Decline / Drop"
                          >
                            <PhoneOff size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Socket Call Sync</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telephony
            </span>
          </div>
        </Card>

        {/* ─── RIGHT: LIVE LISTENER MESSAGES & INSTANT REPLY (5 Cols) ──── */}
        <Card className="lg:col-span-5 p-5 bg-card border-border shadow-sm flex flex-col space-y-4 min-h-[520px]">
          <div>
            {/* Header with Filter Switcher */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#02B2FF]" />
                  Live Listener Messages
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Incoming SMS feed & instant studio replies
                </p>
              </div>
              <Link
                href="/messages"
                className="text-xs font-semibold text-[#02B2FF] hover:underline flex items-center gap-1"
              >
                All Messages <ChevronRight size={13} />
              </Link>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-3">
              <button
                onClick={() => setMessageFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  messageFilter === "all"
                    ? "bg-[#02B2FF] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({threads.length})
              </button>
              <button
                onClick={() => setMessageFilter("unreplied")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  messageFilter === "unreplied"
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Needs Reply ({unrepliedThreads.length})
              </button>
            </div>

            {/* Message Stream List */}
            <div className="mt-3 space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {threadsLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading message feed...</div>
              ) : displayedThreads.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/60">
                  No incoming messages found.
                </div>
              ) : (
                displayedThreads.slice(0, 6).map((thread: any, idx: number) => {
                  const isSelected = thread.msisdn === currentSelectedMsisdn;
                  const hasUnreplied = (thread.unrepliedCount || 0) > 0;

                  return (
                    <div
                      key={thread.msisdn || idx}
                      onClick={() => setSelectedThreadMsisdn(thread.msisdn)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#02B2FF] bg-[#EFF8FF]/50 dark:bg-[#02B2FF]/10 shadow-xs"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${hasUnreplied ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <span className="text-xs font-bold text-foreground font-mono truncate">
                            {thread.listenerName || thread.msisdn}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                          {thread.showName || activeShow?.name || "Show"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed pl-3.5">
                        {thread.lastMessage || "No message preview"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Instant Studio Reply Composer + Thread media preview */}
            {selectedThread && (
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Replying to: <span className="font-mono text-[#02B2FF]">{selectedThread.listenerName || selectedThread.msisdn}</span>
                  </span>
                </div>

                {/* Conversation history with image / sticker / voice */}
                {(threadDetailData?.data?.messages || threadDetailData?.data || []).length > 0 ? (
                  <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5 max-h-[360px] overflow-y-auto">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Conversation
                    </p>
                    {(threadDetailData?.data?.messages || threadDetailData?.data || []).map((m: any, i: number) => {
                      const isStation = m.senderType === "station";
                      return (
                        <div
                          key={m.id || m._id || i}
                          className={`flex ${isStation ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-xl px-3 py-2 text-xs ${
                              isStation
                                ? "bg-[#02B2FF]/10 text-foreground"
                                : "bg-card border border-border text-foreground"
                            }`}
                          >
                            <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                              {isStation ? m.senderName || "Station" : m.senderName || selectedThread.listenerName || "Listener"}
                            </p>
                            <ChatMessageMedia msg={m} />
                            {m.createdAt && (
                              <p className="text-[9px] text-muted-foreground mt-1">
                                {formatClock12h(m.createdAt, timezone)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
                    {threadDetailData
                      ? "No messages in this conversation"
                      : "Loading conversation…"}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                    placeholder="Type instant reply to listener..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF] shadow-xs transition-all"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSendingReply}
                    className="px-3.5 py-2 bg-[#02B2FF] text-white rounded-xl text-xs font-bold hover:bg-[#0092D8] transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={13} />
                    <span>{isSendingReply ? "..." : "Send"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Direct SMS Dispatch</span>
            <span className="text-[11px] text-muted-foreground">Press Enter to send</span>
          </div>
        </Card>
      </div>

      {/* ─── 4. BOTTOM ROW: ACTIVE POLL & STUDIO SHORTCUTS ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Show Poll Widget (6 Cols) */}
        <Card className="lg:col-span-6 p-5 bg-card border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-500" />
                  Live Show Poll & Voting
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Real-time listener vote tally on the active topic
                </p>
              </div>
              <Link
                href="/campaigns/polls"
                className="text-xs font-semibold text-[#02B2FF] hover:underline flex items-center gap-1"
              >
                Polls Center <ChevronRight size={13} />
              </Link>
            </div>

            <div className="mt-4">
              {activePoll ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-1">
                      Active Question
                    </span>
                    <p className="text-xs font-bold text-foreground">{activePoll.question}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Total Votes: <span className="font-bold text-foreground font-mono">{pollTotalVotes}</span>
                    </p>
                  </div>

                  {/* Options Progress Bars */}
                  <div className="space-y-2 mt-3">
                    {(activePoll.options || []).map((opt: any, idx: number) => {
                      const votes = opt.votes || 0;
                      const pct = pollTotalVotes > 0 ? Math.round((votes / pollTotalVotes) * 100) : 0;

                      return (
                        <div key={opt.label || idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">{opt.label}</span>
                            <span className="font-mono text-muted-foreground text-[11px]">
                              {votes} votes ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-[#02B2FF] transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/60 p-5">
                  <BarChart3 size={22} className="mx-auto mb-1.5 text-muted-foreground/50" />
                  <p className="font-semibold text-foreground">No Active Poll Running</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Launch a live listener poll to engage your audience during the show.
                  </p>
                  <Link
                    href="/campaigns/polls/create"
                    className="inline-block mt-3 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#02B2FF] text-white hover:bg-[#0092D8] transition-colors"
                  >
                    + Create Show Poll
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Studio Fast Shortcuts (6 Cols) */}
        <Card className="lg:col-span-6 p-5 bg-card border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                Broadcast Studio Shortcuts
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Quick navigation for on-air production and show operations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link
                href="/calls"
                className="p-3.5 rounded-xl border border-border bg-card hover:border-[#02B2FF]/40 hover:shadow-sm transition-all group flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-[#02B2FF] transition-colors">
                    Calls Console
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Live audio & call queue</p>
                </div>
              </Link>

              <Link
                href="/messages"
                className="p-3.5 rounded-xl border border-border bg-card hover:border-[#02B2FF]/40 hover:shadow-sm transition-all group flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EFF8FF] dark:bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-[#02B2FF] transition-colors">
                    Messages & SMS
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Threaded chat streams</p>
                </div>
              </Link>

              <Link
                href="/station-management/shows"
                className="p-3.5 rounded-xl border border-border bg-card hover:border-[#02B2FF]/40 hover:shadow-sm transition-all group flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Radio size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-[#02B2FF] transition-colors">
                    Shows Schedule
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Lineup & air-time slots</p>
                </div>
              </Link>

              <Link
                href="/top-fans"
                className="p-3.5 rounded-xl border border-border bg-card hover:border-[#02B2FF]/40 hover:shadow-sm transition-all group flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Star size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-[#02B2FF] transition-colors">
                    Top Fans & CRM
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Engaged listeners ranking</p>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
