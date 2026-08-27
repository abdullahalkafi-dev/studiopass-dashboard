"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { resolveUrl } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { formatTime12h, formatDuration } from "@/utils/time-utils";
import {
  useGetStationCallsQuery,
  useAcceptCallMutation,
  useEndCallMutation,
  useRejectCallMutation,
} from "@/features/call/callApi";
import { useAgoraCall } from "@/hooks/use-agora-call";
import { toast } from "sonner";
import { useTimezone } from "@/hooks/use-timezone";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Call {
  _id: string;
  station: { _id: string; name: string; category: string } | string;
  show?: { _id: string; name: string } | string;
  startedBy:
    | { _id: string; fullName: string; phone: string; avatar?: string }
    | string;
  handledBy?: { _id: string; fullName: string } | string;
  status:
    | "queued"
    | "missed"
    | "rejected"
    | "answered"
    | "cancelled"
    | "completed";
  duration?: number;
  creditsUsed: number;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  waitStartedAt?: string;
  stationTimezone?: string;
}

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

/** Returns seconds since a date string (for wait duration display) */
function secondsSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
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
  timezone,
  tick,
}: {
  call: Call;
  index: number;
  onAccept: (call: Call) => void;
  onDecline: (call: Call) => void;
  isAccepting: boolean;
  isDeclining: boolean;
  isOnCall: boolean;
  timezone: string;
  tick: number; // forces re-render every second for live wait time
}) {
  const callerName = getField(call.startedBy, "fullName") || "Unknown";
  const callerPhone = getField(call.startedBy, "phone");
  const callerAvatar = getField(call.startedBy, "avatar");
  const waitSecs = secondsSince(call.waitStartedAt || call.startedAt);

  return (
    <div className="p-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10 shrink-0">
          {callerAvatar && (
            <AvatarImage src={resolveUrl(callerAvatar)} alt={callerName} />
          )}
          <AvatarFallback
            className={`text-xs font-bold ${avatarColor(index)}`}
          >
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
        {/* Accept */}
        <button
          onClick={() => onAccept(call)}
          disabled={isAccepting || isDeclining}
          title={isOnCall ? "Accept & switch (ends current call)" : "Accept call"}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
            bg-[#02B2FF] text-white text-[11px] font-semibold
            hover:bg-[#00A0E8] active:scale-95 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAccepting ? (
            <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
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
  call: Call;
  duration: number;
  isMuted: boolean;
  isEnding: boolean;
  onToggleMute: () => void;
  onEnd: () => void;
  queueCount: number;
}) {
  const callerName = getField(call.startedBy, "fullName") || "Unknown";
  const callerPhone = getField(call.startedBy, "phone");
  const callerAvatar = getField(call.startedBy, "avatar");

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
      {/* Live badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
          Live Call
        </span>
      </div>

      {/* Caller avatar — large */}
      <div className="relative">
        <Avatar className="w-24 h-24 ring-4 ring-[#02B2FF]/30 ring-offset-2 ring-offset-background">
          {callerAvatar && (
            <AvatarImage src={resolveUrl(callerAvatar)} alt={callerName} />
          )}
          <AvatarFallback className="bg-[#02B2FF] text-white text-2xl font-bold">
            {getInitials(callerName)}
          </AvatarFallback>
        </Avatar>
        {/* Animated ring while speaking */}
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
        <p className="text-xs text-muted-foreground mt-1">Call duration</p>
      </div>

      {/* Waiting callers badge */}
      {queueCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
          <Users size={12} className="text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {queueCount} caller{queueCount !== 1 ? "s" : ""} waiting
          </span>
        </div>
      )}

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
            disabled:opacity-50 disabled:cursor-not-allowed"
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
function IdlePanel({ queueCount }: { queueCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <Phone size={32} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          No active call
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {queueCount > 0
            ? `${queueCount} caller${queueCount !== 1 ? "s" : ""} waiting in the queue`
            : "Waiting for incoming calls…"}
        </p>
      </div>
      {queueCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <ChevronRight size={14} />
          <span>Accept a call from the queue on the left</span>
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
  call: Call;
  index: number;
  timezone: string;
}) {
  const callerName = getField(call.startedBy, "fullName") || "Unknown";
  const callerPhone = getField(call.startedBy, "phone");
  const callerAvatar = getField(call.startedBy, "avatar");

  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
      <Avatar className="w-8 h-8 shrink-0">
        {callerAvatar && (
          <AvatarImage src={resolveUrl(callerAvatar)} alt={callerName} />
        )}
        <AvatarFallback
          className={`text-[10px] font-bold ${avatarColor(index)}`}
        >
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
          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${STATUS_COLORS[call.status] || "bg-muted text-muted-foreground"}`}
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

  // Live wall-clock tick for wait-time countups
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Active call state
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const isInCallRef = useRef(false);
  const endingRef = useRef(false);

  // Per-card loading state for accept/decline (key = call._id)
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  activeCallRef.current = activeCall;

  // ─── RTK Query ───────────────────────────────────────────────────────────

  const { data, isLoading, refetch } = useGetStationCallsQuery(
    { stationId, page: 1, limit: 100 },
    { skip: !stationId },
  );

  const [acceptCallMutation] = useAcceptCallMutation();
  const [endCallMutation, { isLoading: isEnding }] = useEndCallMutation();
  const [rejectCallMutation] = useRejectCallMutation();

  // ─── Agora ───────────────────────────────────────────────────────────────

  const {
    joinChannel,
    leaveChannel,
    endCall: leaveAgora,
    toggleMute,
    isInCall,
    isMuted,
  } = useAgoraCall({
    onUserJoined: () => {},
    onUserLeft: async () => {
      if (endingRef.current) return;
      endingRef.current = true;
      const current = activeCallRef.current;
      if (current && (current.status === "answered" || isInCallRef.current)) {
        try {
          await endCallMutation(current._id).unwrap();
          toast.info("Caller disconnected. Call ended.");
        } catch {}
        await leaveAgora();
        setActiveCall(null);
      }
      endingRef.current = false;
    },
    onError: (err) => toast.error(err.message || "Call connection error"),
    onConnectionLost: async () => {
      if (endingRef.current) return;
      endingRef.current = true;
      toast.error("Call connection lost. Ending call.");
      const current = activeCallRef.current;
      if (current && (current.status === "answered" || isInCallRef.current)) {
        try {
          await endCallMutation(current._id).unwrap();
        } catch {}
        await leaveAgora();
        setActiveCall(null);
      }
      endingRef.current = false;
    },
    onLeave: async () => {},
  });

  isInCallRef.current = isInCall;

  // ─── Duration timer ───────────────────────────────────────────────────────

  useEffect(() => {
    if (isInCall) {
      setCallDuration(0);
      durationRef.current = setInterval(
        () => setCallDuration((p) => p + 1),
        1000,
      );
    } else {
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, [isInCall, activeCall?._id]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const allCalls: Call[] = (data as any)?.data || [];
  const queued = allCalls.filter((c) => c.status === "queued");
  const history = allCalls.filter(
    (c) =>
      c.status === "completed" ||
      c.status === "missed" ||
      c.status === "rejected" ||
      c.status === "cancelled",
  );

  // KPIs
  const answeredToday = allCalls.filter(
    (c) => c.status === "completed" || c.status === "answered",
  ).length;
  const missedToday = allCalls.filter((c) => c.status === "missed").length;

  // Sync activeCall with server data
  useEffect(() => {
    if (!activeCall) return;
    const updated = allCalls.find((c) => c._id === activeCall._id);
    if (!updated) {
      // Call no longer in list (cleaned up by server)
      setActiveCall(null);
      return;
    }
    const order = ["queued", "answered", "completed", "missed", "rejected", "cancelled"];
    if (order.indexOf(updated.status) >= order.indexOf(activeCall.status)) {
      setActiveCall(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCalls]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleAccept = useCallback(
    async (call: Call) => {
      setAcceptingId(call._id);
      try {
        // If already on a call → end it first, then wait 500ms before accepting
        if (isInCall && activeCallRef.current) {
          const prev = activeCallRef.current;
          endingRef.current = true;
          try {
            await endCallMutation(prev._id).unwrap();
          } catch {
            // Best effort
          }
          await leaveAgora();
          setActiveCall(null);
          endingRef.current = false;
          await new Promise((r) => setTimeout(r, 500));
        }

        const result = await acceptCallMutation(call._id).unwrap();
        const resData = (result as any)?.data;
        setActiveCall({ ...call, status: "answered" });

        if (resData?.token && resData?.channelName && resData?.operatorUid) {
          try {
            await joinChannel(
              resData.token,
              resData.channelName,
              resData.operatorUid,
            );
            // Verify call is still live after joining
            const current = activeCallRef.current;
            if (
              !current ||
              current._id !== call._id ||
              current.status !== "answered"
            ) {
              await leaveAgora();
              toast.info("Call ended before audio connected.");
              return;
            }
          } catch (agoraErr: any) {
            if (!endingRef.current) {
              endingRef.current = true;
              try {
                await endCallMutation(call._id).unwrap();
              } catch {}
              endingRef.current = false;
            }
            await leaveAgora();
            setActiveCall(null);
            toast.error(
              agoraErr?.message || "Failed to connect audio. Call ended.",
            );
          }
        }
      } catch (err: any) {
        toast.error(
          err?.data?.message || "Failed to accept call.",
        );
      } finally {
        setAcceptingId(null);
      }
    },
    [isInCall, endCallMutation, acceptCallMutation, joinChannel, leaveAgora],
  );

  const handleDecline = useCallback(
    async (call: Call) => {
      setDecliningId(call._id);
      try {
        await rejectCallMutation(call._id).unwrap();
        toast.success("Call declined. Credit refunded to caller.");
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to decline call.");
      } finally {
        setDecliningId(null);
      }
    },
    [rejectCallMutation],
  );

  const handleEndCall = useCallback(async () => {
    if (endingRef.current || !activeCallRef.current) return;
    endingRef.current = true;
    try {
      await endCallMutation(activeCallRef.current._id).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to end call.");
    } finally {
      await leaveAgora();
      setActiveCall(null);
      endingRef.current = false;
    }
  }, [endCallMutation, leaveAgora]);

  // ─── Guard: no station ────────────────────────────────────────────────────

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
              Station admins and media stations see calls automatically
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Live Calls</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage incoming listener calls during live shows
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
              Waiting
            </p>
            <p className="text-xl font-bold text-[#02B2FF]">
              {queued.length}
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
              Answered
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
              Missed
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
            {queued.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#02B2FF] text-white text-[10px] font-bold">
                {queued.length}
              </span>
            )}
          </div>

          {/* Queue list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-24">
                <div className="h-5 w-5 rounded-full border-2 border-[#02B2FF] border-t-transparent animate-spin" />
              </div>
            )}
            {!isLoading && queued.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4 py-8">
                <CheckCircle size={28} className="text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  No callers waiting
                </p>
              </div>
            )}
            {queued.map((call, i) => (
              <WaitingCallerCard
                key={call._id}
                call={call}
                index={i}
                onAccept={handleAccept}
                onDecline={handleDecline}
                isAccepting={acceptingId === call._id}
                isDeclining={decliningId === call._id}
                isOnCall={isInCall}
                timezone={timezone}
                tick={tick}
              />
            ))}
          </div>
        </div>

        {/* ── CENTER: Active Call / Idle ────────────────────────────────── */}
        <div className="col-span-6 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            {isInCall ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Active Call
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

          {/* Call content */}
          <div className="flex-1 overflow-hidden">
            {isInCall && activeCall ? (
              <ActiveCallPanel
                call={activeCall}
                duration={callDuration}
                isMuted={isMuted}
                isEnding={isEnding}
                onToggleMute={toggleMute}
                onEnd={handleEndCall}
                queueCount={queued.length}
              />
            ) : (
              <IdlePanel queueCount={queued.length} />
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
