"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneCall,
  PhoneOff,
  Clock,
  Mic,
  MicOff,
  CheckCircle,
  XCircle,
  Users,
  History,
  ArrowRightLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { resolveUrl } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { formatTime12h, formatDuration } from "@/utils/time-utils";
import { useGetStationCallsQuery } from "@/features/call/callApi";
import {
  useCallContext,
  ActiveCallData,
  WaitingCallItem,
} from "@/contexts/call-context";
import { useTimezone } from "@/hooks/use-timezone";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-[#02B2FF] text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-500 text-white",
  "bg-orange-500 text-white",
  "bg-teal-500 text-white",
];

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-[#02B2FF]/10 text-[#02B2FF]",
  answered: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  missed: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function getField(obj: any, ...keys: string[]): string {
  if (!obj) return "";
  for (const key of keys) {
    if (typeof obj === "object" && obj[key]) return obj[key];
  }
  return typeof obj === "string" ? obj : "";
}

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
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

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Single card in the Waiting Queue panel */
function WaitingCallerCard({
  call,
  index,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
  isOnCall,
  tick,
}: {
  call: WaitingCallItem;
  index: number;
  onAccept: (call: WaitingCallItem) => void;
  onDecline: (call: WaitingCallItem) => void;
  isAccepting: boolean;
  isDeclining: boolean;
  isOnCall: boolean;
  tick: number;
}) {
  const callerName =
    call.callerName ||
    (typeof call.startedBy === "object" ? call.startedBy?.fullName : "") ||
    "Listener";
  const callerPhone =
    call.callerPhone ||
    (typeof call.startedBy === "object" ? call.startedBy?.phone : "");
  const callerAvatar =
    call.callerAvatar ||
    (typeof call.startedBy === "object" ? call.startedBy?.avatar : "");
  const waitSecs = secondsSince(call.waitStartedAt || call.startedAt);

  const callId = call._id || call.callId || "";

  return (
    <div className="p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10 shrink-0 ring-1 ring-border">
          {callerAvatar && (
            <AvatarImage src={resolveUrl(callerAvatar)} alt={callerName} />
          )}
          <AvatarFallback className={`text-xs font-bold ${avatarColor(index)}`}>
            {getInitials(callerName)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {callerName}
          </p>
          {callerPhone && (
            <p className="text-[11px] text-muted-foreground font-mono truncate">
              {callerPhone}
            </p>
          )}
          {/* Wait time badge */}
          <div className="flex items-center gap-1 mt-1">
            <Clock size={10} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono">
              {formatWait(waitSecs)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-2.5">
        {/* Accept / Switch */}
        <button
          onClick={() => onAccept(call)}
          disabled={isAccepting || isDeclining}
          title={isOnCall ? "Switch caller (ends current call)" : "Accept and connect immediately"}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
            text-white text-[11px] font-semibold active:scale-95 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed ${
              isOnCall ? "bg-amber-500 hover:bg-amber-600" : "bg-[#02B2FF] hover:bg-[#00A0E8]"
            }`}
        >
          {isAccepting ? (
            <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : isOnCall ? (
            <ArrowRightLeft size={11} />
          ) : (
            <Phone size={11} />
          )}
          {isOnCall ? "Switch" : "Accept"}
        </button>

        {/* Decline */}
        <button
          onClick={() => onDecline(call)}
          disabled={isAccepting || isDeclining}
          title="Decline & refund caller"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
            border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold
            hover:bg-red-100 active:scale-95 transition-all
            dark:bg-red-950/40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/60
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeclining ? (
            <div className="h-3 w-3 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          ) : (
            <PhoneOff size={11} />
          )}
          Decline
        </button>
      </div>
    </div>
  );
}

/** Active call panel shown in the center when on a live call */
function ActiveCallPanel({
  call,
  duration,
  isMuted,
  isEnding,
  onToggleMute,
  onEnd,
  queueCount,
}: {
  call: ActiveCallData;
  duration: number;
  isMuted: boolean;
  isEnding: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
  queueCount: number;
}) {
  const callerName = call.callerName || "Listener";
  const callerPhone = call.callerPhone;
  const callerAvatar = call.callerAvatar;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
      {/* Live badge & waiting counter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            Live On Air
          </span>
        </div>

        {queueCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Users size={12} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-mono">
              Waiting Calls ({queueCount})
            </span>
          </div>
        )}
      </div>

      {/* Caller avatar — large with animated ring */}
      <div className="relative">
        <Avatar className="w-24 h-24 ring-4 ring-[#02B2FF]/30 ring-offset-2 ring-offset-background">
          {callerAvatar && (
            <AvatarImage src={resolveUrl(callerAvatar)} alt={callerName} />
          )}
          <AvatarFallback className="bg-[#02B2FF] text-white text-2xl font-bold">
            {getInitials(callerName)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 rounded-full border-2 border-[#02B2FF]/40 animate-ping" />
      </div>

      {/* Caller info */}
      <div className="text-center">
        <p className="text-lg font-bold text-foreground">{callerName}</p>
        {callerPhone && (
          <p className="text-sm text-muted-foreground font-mono mt-0.5">
            {callerPhone}
          </p>
        )}
      </div>

      {/* Duration */}
      <div className="text-center">
        <p className="text-3xl font-bold text-foreground font-mono tracking-widest">
          {formatDuration(duration)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Live Call Duration</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onToggleMute}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
            isMuted
              ? "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300"
              : "bg-muted text-foreground hover:bg-muted/80"
          }`}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          onClick={onEnd}
          disabled={isEnding}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
            bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-500/20"
        >
          {isEnding ? (
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <PhoneOff size={16} />
          )}
          End Call
        </button>
      </div>
    </div>
  );
}

/** Idle center panel — no active call */
function IdlePanel({
  queueCount,
  nextCaller,
  onAcceptNext,
  isAcceptingNext,
}: {
  queueCount: number;
  nextCaller?: WaitingCallItem;
  onAcceptNext: (call: WaitingCallItem) => void;
  isAcceptingNext: boolean;
}) {
  const nextName =
    nextCaller?.callerName ||
    (typeof nextCaller?.startedBy === "object" ? nextCaller.startedBy?.fullName : "") ||
    "Caller";

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <Phone size={32} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          No Active Call
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {queueCount > 0
            ? `${queueCount} caller${queueCount !== 1 ? "s" : ""} waiting in the queue`
            : "Waiting for incoming listener calls…"}
        </p>
      </div>

      {queueCount > 0 && nextCaller && (
        <button
          onClick={() => onAcceptNext(nextCaller)}
          disabled={isAcceptingNext}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#02B2FF] text-white text-xs font-bold
            hover:bg-[#00A0E8] active:scale-95 transition-all shadow-lg shadow-[#02B2FF]/20
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAcceptingNext ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Phone size={14} />
          )}
          <span>Connect Next: {nextName}</span>
        </button>
      )}

      {queueCount === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mt-2">
          <span>Incoming calls will ring and appear directly here</span>
        </div>
      )}
    </div>
  );
}

/** History row for the right panel */
function HistoryRow({
  call,
  index,
  timezone,
}: {
  call: any;
  index: number;
  timezone: string;
}) {
  const callerName = getField(call.startedBy, "fullName") || "Listener";
  const callerPhone = getField(call.startedBy, "phone");
  const callerAvatar = getField(call.startedBy, "avatar");

  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
      <Avatar className="w-8 h-8 shrink-0">
        {callerAvatar && (
          <AvatarImage src={resolveUrl(callerAvatar)} alt={callerName} />
        )}
        <AvatarFallback className={`text-[10px] font-bold ${avatarColor(index)}`}>
          {getInitials(callerName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {callerName}
        </p>
        <p className="text-[10px] text-muted-foreground font-mono">
          {formatTime12h(call.startedAt, call.stationTimezone || timezone)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${
            STATUS_COLORS[call.status] || "bg-muted text-muted-foreground"
          }`}
        >
          {call.status}
        </span>
        {call.duration != null && call.duration > 0 && (
          <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
            {formatDuration(call.duration)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CallsContent() {
  const user = useAppSelector((state) => state.auth.user);
  const stationId = (user as any)?.stationId || "";
  const timezone = useTimezone();

  // Consume Global Call Context
  const {
    activeCall,
    isInCall,
    isMuted,
    callDuration,
    waitingCalls,
    waitingCallsCount,
    acceptingId,
    decliningId,
    isEnding,
    toggleMute,
    acceptCall,
    switchCall,
    endActiveCall,
    declineCall,
  } = useCallContext();

  // Live wall-clock tick for wait-time countups
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // RTK Query for Station History & KPIs
  const { data, isLoading, refetch } = useGetStationCallsQuery(
    { stationId, page: 1, limit: 100 },
    { skip: !stationId },
  );

  const allCalls: any[] = (data as any)?.data || [];
  const history = useMemo(
    () =>
      allCalls.filter(
        (c) =>
          c.status === "completed" ||
          c.status === "missed" ||
          c.status === "rejected" ||
          c.status === "cancelled",
      ),
    [allCalls],
  );

  // KPIs
  const answeredToday = useMemo(
    () => allCalls.filter((c) => c.status === "completed" || c.status === "answered").length,
    [allCalls],
  );
  const missedToday = useMemo(
    () => allCalls.filter((c) => c.status === "missed").length,
    [allCalls],
  );

  // Handlers
  const handleAcceptOrSwitch = useCallback(
    async (call: WaitingCallItem) => {
      const id = call._id || call.callId || "";
      if (isInCall) {
        await switchCall(id, {
          callerName: call.callerName || (typeof call.startedBy === "object" ? call.startedBy?.fullName : ""),
          callerPhone: call.callerPhone || (typeof call.startedBy === "object" ? call.startedBy?.phone : ""),
          callerAvatar: call.callerAvatar || (typeof call.startedBy === "object" ? call.startedBy?.avatar : ""),
          showName: call.showName,
        });
      } else {
        await acceptCall(id, {
          callerName: call.callerName || (typeof call.startedBy === "object" ? call.startedBy?.fullName : ""),
          callerPhone: call.callerPhone || (typeof call.startedBy === "object" ? call.startedBy?.phone : ""),
          callerAvatar: call.callerAvatar || (typeof call.startedBy === "object" ? call.startedBy?.avatar : ""),
          showName: call.showName,
        });
      }
    },
    [isInCall, switchCall, acceptCall],
  );

  const handleDecline = useCallback(
    async (call: WaitingCallItem) => {
      const id = call._id || call.callId || "";
      await declineCall(id);
    },
    [declineCall],
  );

  // Guard: no station selected
  if (!stationId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Calls</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage incoming listener calls during live shows
          </p>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          <div className="text-center">
            <Phone size={32} className="mx-auto mb-3 opacity-50" />
            <p>Select a station to view calls</p>
            <p className="text-xs mt-1">
              Station admins, media stations, and presenters see calls automatically
            </p>
          </div>
        </div>
      </div>
    );
  }

  const nextWaitingCaller = waitingCalls[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Live Studio Calls</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Direct 1-click caller connect with real-time waiting queue
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Waiting */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#EFF8FF] dark:bg-[#02B2FF]/20 flex items-center justify-center shrink-0">
            <PhoneIncoming size={16} className="text-[#02B2FF]" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Waiting in Queue
            </p>
            <p className="text-xl font-bold text-[#02B2FF]">
              {waitingCallsCount}
            </p>
          </div>
        </div>
        {/* Answered */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <PhoneCall size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Answered Today
            </p>
            <p className="text-xl font-bold text-emerald-500">
              {answeredToday}
            </p>
          </div>
        </div>
        {/* Missed */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <PhoneOff size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Missed / Timed Out
            </p>
            <p className="text-xl font-bold text-red-500">{missedToday}</p>
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-12 gap-4 h-[580px]">
        {/* ── LEFT: Waiting Queue ───────────────────────────────────────── */}
        <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneIncoming size={14} className="text-[#02B2FF]" />
              <span className="text-xs font-bold text-foreground">
                Waiting Queue
              </span>
            </div>
            {waitingCallsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#02B2FF] text-white text-[10px] font-bold">
                {waitingCallsCount}
              </span>
            )}
          </div>

          {/* Queue list */}
          <div className="flex-1 overflow-y-auto">
            {waitingCallsCount === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4 py-8">
                <CheckCircle size={28} className="text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  No callers waiting
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  New calls appear here in real time
                </p>
              </div>
            )}
            {waitingCalls.map((call, i) => (
              <WaitingCallerCard
                key={call._id || call.callId || i}
                call={call}
                index={i}
                onAccept={handleAcceptOrSwitch}
                onDecline={handleDecline}
                isAccepting={acceptingId === (call._id || call.callId)}
                isDeclining={decliningId === (call._id || call.callId)}
                isOnCall={isInCall}
                tick={tick}
              />
            ))}
          </div>
        </div>

        {/* ── CENTER: Active Call / Idle ────────────────────────────────── */}
        <div className="col-span-6 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isInCall ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Live Call Console
                  </span>
                </>
              ) : (
                <>
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">
                    Call Console
                  </span>
                </>
              )}
            </div>

            {/* Waiting calls notification badge directly in the active call console header */}
            {isInCall && waitingCallsCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5 animate-pulse">
                <Users size={12} />
                Waiting Calls ({waitingCallsCount})
              </span>
            )}
          </div>

          {/* Call content */}
          <div className="flex-1 overflow-hidden">
            {isInCall && activeCall ? (
              <ActiveCallPanel
                call={activeCall}
                duration={callDuration}
                isMuted={isMuted}
                isEnding={isEnding}
                onToggleMute={toggleMute}
                onEnd={endActiveCall}
                queueCount={waitingCallsCount}
              />
            ) : (
              <IdlePanel
                queueCount={waitingCallsCount}
                nextCaller={nextWaitingCaller}
                onAcceptNext={handleAcceptOrSwitch}
                isAcceptingNext={acceptingId === (nextWaitingCaller?._id || nextWaitingCaller?.callId)}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT: Call History ───────────────────────────────────────── */}
        <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <History size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">
              Call History
            </span>
          </div>

          {/* History list */}
          <div className="flex-1 overflow-y-auto px-3">
            {!isLoading && history.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                <XCircle size={28} className="text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  No history yet
                </p>
              </div>
            )}
            {history.map((call, i) => (
              <HistoryRow
                key={call._id}
                call={call}
                index={i}
                timezone={timezone}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
