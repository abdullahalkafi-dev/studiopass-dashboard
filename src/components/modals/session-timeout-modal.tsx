"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WARNING_DURATION_MS } from "@/hooks/use-inactivity-timer";
import { ShieldAlert, Clock } from "lucide-react";

interface SessionTimeoutModalProps {
  open: boolean;
  onStaySignedIn: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({
  open,
  onStaySignedIn,
  onLogout,
}: SessionTimeoutModalProps) {
  const totalSeconds = Math.round(WARNING_DURATION_MS / 1000);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  // Reset and start a countdown whenever the modal opens.
  useEffect(() => {
    if (!open) {
      setSecondsLeft(totalSeconds);
      return;
    }

    setSecondsLeft(totalSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, totalSeconds]);

  // Percentage for the circular progress ring (0→1).
  const progress = secondsLeft / totalSeconds;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const isUrgent = secondsLeft <= 10;

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(_open, details) => {
        // Block Escape key and any other automatic dismiss reason.
        details?.cancel?.();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
      >
        <DialogHeader className="items-center text-center gap-3 pt-2">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 ring-4 ring-amber-200 dark:ring-amber-800/40">
            <ShieldAlert className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>

          <DialogTitle className="text-xl font-semibold">
            Session Expiring Soon
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground max-w-xs">
            Your session is about to expire due to inactivity. Would you like
            to stay signed in?
          </DialogDescription>
        </DialogHeader>

        {/* Countdown ring */}
        <div className="flex flex-col items-center gap-1 py-4">
          <div className="relative flex items-center justify-center">
            <svg width="72" height="72" className="-rotate-90">
              {/* Background track */}
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                strokeWidth="5"
                className="stroke-muted"
              />
              {/* Progress arc */}
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={
                  isUrgent
                    ? "stroke-destructive transition-all duration-1000"
                    : "stroke-amber-500 transition-all duration-1000"
                }
              />
            </svg>
            {/* Number in the centre */}
            <span
              className={`absolute text-lg font-bold tabular-nums ${
                isUrgent
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {secondsLeft}
            </span>
          </div>

          {/* Label below the ring */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isUrgent
                ? "Logging you out very soon…"
                : `Logging out in ${secondsLeft} second${secondsLeft !== 1 ? "s" : ""}…`}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pb-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onLogout}
          >
            Logout
          </Button>
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
            onClick={onStaySignedIn}
          >
            Stay Signed In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
