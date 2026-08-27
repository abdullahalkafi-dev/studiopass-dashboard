"use client";

import { useEffect, useRef, useCallback } from "react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION_MS = 30 * 1000;        // 30-second warning countdown

interface UseInactivityTimerOptions {
  /** Whether the timer is active (should be true only when the user is authenticated). */
  isActive: boolean;
  /** Called when the warning period begins (30 min of inactivity reached). */
  onWarn: () => void;
  /** Called when the warning countdown finishes without user interaction. */
  onExpire: () => void;
  /** Called when the user dismisses the warning ("Stay Signed In"). */
  onReset?: () => void;
}

/**
 * Tracks user activity (mouse, keyboard, click, touch) and fires:
 *  - `onWarn`   after INACTIVITY_TIMEOUT_MS of silence
 *  - `onExpire` after an additional WARNING_DURATION_MS if still idle
 *
 * Call `resetTimer()` to cancel both timers and restart the inactivity clock
 * (e.g. when the user clicks "Stay Signed In").
 */
export function useInactivityTimer({
  isActive,
  onWarn,
  onExpire,
  onReset,
}: UseInactivityTimerOptions) {
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWarningRef  = useRef(false);

  // Store latest callbacks in refs so they never trigger re-renders or cancel active timers
  const onWarnRef   = useRef(onWarn);
  const onExpireRef = useRef(onExpire);
  const onResetRef  = useRef(onReset);

  useEffect(() => {
    onWarnRef.current   = onWarn;
    onExpireRef.current = onExpire;
    onResetRef.current  = onReset;
  }, [onWarn, onExpire, onReset]);

  const clearAllTimers = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    if (warningRef.current)    clearTimeout(warningRef.current);
    inactivityRef.current = null;
    warningRef.current    = null;
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearAllTimers();
    isWarningRef.current = false;

    inactivityRef.current = setTimeout(() => {
      isWarningRef.current = true;
      onWarnRef.current();

      warningRef.current = setTimeout(() => {
        onExpireRef.current();
      }, WARNING_DURATION_MS);
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearAllTimers]);

  /** Public method — call this when the user clicks "Stay Signed In". */
  const resetTimer = useCallback(() => {
    startInactivityTimer();
    onResetRef.current?.();
  }, [startInactivityTimer]);

  useEffect(() => {
    if (!isActive) {
      clearAllTimers();
      return;
    }

    const ACTIVITY_EVENTS = [
      "mousemove",
      "keypress",
      "click",
      "touchstart",
    ] as const;

    const handleActivity = () => {
      // Ignore activity events while the warning modal is visible — the
      // user must explicitly click "Stay Signed In" to reset.
      if (isWarningRef.current) return;
      startInactivityTimer();
    };

    // Start the timer immediately on mount.
    startInactivityTimer();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [isActive, startInactivityTimer, clearAllTimers]);

  return { resetTimer };
}

export { WARNING_DURATION_MS };
