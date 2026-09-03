"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, PhoneOff, Mic, MicOff, Users, ExternalLink, Radio } from "lucide-react";
import { useCallContext } from "@/contexts/call-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveUrl } from "@/lib/utils";
import { formatDuration } from "@/utils/time-utils";

export function PersistentCallBar() {
  const pathname = usePathname();
  const {
    isInCall,
    activeCall,
    callDuration,
    isMuted,
    isEnding,
    waitingCallsCount,
    toggleMute,
    endActiveCall,
  } = useCallContext();

  // Only show when in a call and not currently on the dedicated /calls page
  if (!isInCall || !activeCall || pathname === "/calls") {
    return null;
  }

  const callerName = activeCall.callerName || "Listener";
  const callerPhone = activeCall.callerPhone;
  const callerAvatar = activeCall.callerAvatar;

  const initials = callerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-2xl
        bg-background/90 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl
        p-3.5 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-6 duration-300"
      role="region"
      aria-label="Active voice call bar"
    >
      {/* Left: Live indicator + Caller info */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Pulsing On-Air Indicator */}
        <div className="relative shrink-0">
          <Avatar className="w-11 h-11 ring-2 ring-[#02B2FF]/40 ring-offset-2 ring-offset-background">
            {callerAvatar && (
              <AvatarImage src={resolveUrl(callerAvatar)} alt={callerName} />
            )}
            <AvatarFallback className="bg-[#02B2FF] text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-background" />
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live On Air
            </span>
            <span className="text-xs font-mono font-bold text-foreground">
              {formatDuration(callDuration)}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground truncate mt-0.5">
            {callerName}
          </p>
          {callerPhone && (
            <p className="text-[11px] text-muted-foreground font-mono truncate">
              {callerPhone}
            </p>
          )}
        </div>
      </div>

      {/* Center: Waiting calls indicator */}
      {waitingCallsCount > 0 && (
        <Link
          href="/calls"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400
            hover:bg-amber-500/20 transition-colors shrink-0"
          title="View waiting queue in Call Console"
        >
          <Users size={13} className="animate-pulse" />
          <span className="text-xs font-semibold">
            Waiting Calls ({waitingCallsCount})
          </span>
        </Link>
      )}

      {/* Right: Call controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className={`p-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isMuted
              ? "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300"
              : "bg-muted text-foreground hover:bg-muted/80"
          }`}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* End Call */}
        <button
          onClick={endActiveCall}
          disabled={isEnding}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold
            bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-500/20"
          title="End live call"
        >
          {isEnding ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <PhoneOff size={14} />
          )}
          <span>End</span>
        </button>

        {/* Open full console */}
        <Link
          href="/calls"
          className="p-2.5 rounded-xl bg-[#02B2FF]/10 text-[#02B2FF] hover:bg-[#02B2FF]/20
            border border-[#02B2FF]/30 transition-all active:scale-95"
          title="Open Call Console"
        >
          <ExternalLink size={16} />
        </Link>
      </div>
    </div>
  );
}
