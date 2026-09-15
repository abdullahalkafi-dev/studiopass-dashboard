"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Phone, PhoneOff, Clock, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { resolveUrl } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IncomingCallData {
  callId: string;
  callerName: string;
  callerPhone?: string;
  callerAvatar?: string;
  showName?: string;
  arrivedAt: number; // Date.now() when the notification was triggered
}

interface IncomingCallNotificationProps {
  /** Queue of pending notifications to show. Parent manages this array. */
  calls: IncomingCallData[];
  /** Whether operator is currently on a live call */
  isOnCall?: boolean;
  /** Called when operator accepts (callId) */
  onAccept: (callId: string) => void;
  /** Called when operator declines (callId) */
  onDecline: (callId: string) => void;
  /** Called when operator dismisses without acting */
  onDismiss: (callId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-[#02B2FF] text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ─── Single notification card ────────────────────────────────────────────────

function CallCard({
  call,
  index,
  isOnCall,
  onAccept,
  onDecline,
  onDismiss,
}: {
  call: IncomingCallData;
  index: number;
  isOnCall?: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [waitSecs, setWaitSecs] = useState(
    Math.floor((Date.now() - call.arrivedAt) / 1000),
  );
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  // Live wait-time counter
  useEffect(() => {
    const id = setInterval(() => {
      setWaitSecs(Math.floor((Date.now() - call.arrivedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [call.arrivedAt]);

  const handleAccept = async () => {
    setIsAccepting(true);
    onAccept(call.callId);
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    onDecline(call.callId);
  };

  return (
    <div
      className={`
        relative bg-card border border-border rounded-xl shadow-lg overflow-hidden
        w-72 animate-in slide-in-from-right-8 fade-in-0 duration-300
      `}
    >
      {/* Accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isOnCall ? "bg-amber-500" : "bg-[#02B2FF]"}`} />

      <div className="pl-4 pr-3 pt-3 pb-3">
        {/* Top row: label + dismiss */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnCall ? "bg-amber-500" : "bg-[#02B2FF]"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${isOnCall ? "text-amber-500" : "text-[#02B2FF]"}`}>
              {isOnCall ? "Incoming (On Air)" : "Incoming Call"}
            </span>
          </div>
          <button
            onClick={() => onDismiss(call.callId)}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground transition-colors"
            title="Dismiss notification"
          >
            <X size={12} />
          </button>
        </div>

        {/* Caller info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-11 h-11 shrink-0 ring-2 ring-[#02B2FF]/30">
            {call.callerAvatar && (
              <AvatarImage
                src={resolveUrl(call.callerAvatar)}
                alt={call.callerName}
              />
            )}
            <AvatarFallback
              className={`text-xs font-bold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
            >
              {getInitials(call.callerName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {call.callerName}
            </p>
            {call.callerPhone && (
              <p className="text-xs text-muted-foreground font-mono truncate">
                {call.callerPhone}
              </p>
            )}
            {call.showName && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                📻 {call.showName}
              </p>
            )}
          </div>
          {/* Wait time */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <Clock size={10} className="text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono">
              {formatWait(waitSecs)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
              text-white text-xs font-semibold active:scale-95 transition-all
              disabled:opacity-60 disabled:cursor-not-allowed ${
                isOnCall ? "bg-amber-500 hover:bg-amber-600" : "bg-[#02B2FF] hover:bg-[#00A0E8]"
              }`}
          >
            {isAccepting ? (
              <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Phone size={11} />
            )}
            {isOnCall ? "Switch" : "Accept"}
          </button>
          <button
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
              border border-red-200 bg-red-50 text-red-600 text-xs font-semibold
              hover:bg-red-100 active:scale-95 transition-all
              dark:bg-red-950/40 dark:border-red-800 dark:text-red-400
              disabled:opacity-60 disabled:cursor-not-allowed"
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
    </div>
  );
}

// ─── Container: stacked cards bottom-right ───────────────────────────────────

export function IncomingCallNotification({
  calls,
  isOnCall,
  onAccept,
  onDecline,
  onDismiss,
}: IncomingCallNotificationProps) {
  if (calls.length === 0) return null;

  // Show up to 3 stacked notifications
  const visible = calls.slice(0, 3);

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[200] flex flex-col gap-2 items-end max-w-[calc(100vw-2rem)]"
      role="region"
      aria-label="Incoming call notifications"
    >
      {visible.map((call, i) => (
        <CallCard
          key={call.callId}
          call={call}
          index={i}
          isOnCall={isOnCall}
          onAccept={onAccept}
          onDecline={onDecline}
          onDismiss={onDismiss}
        />
      ))}
      {/* Overflow indicator */}
      {calls.length > 3 && (
        <div className="text-[10px] text-muted-foreground text-center w-72">
          +{calls.length - 3} more caller{calls.length - 3 !== 1 ? "s" : ""}{" "}
          waiting — see Calls page
        </div>
      )}
    </div>
  );
}
