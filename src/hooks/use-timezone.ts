"use client";

import { useAppSelector } from "@/store/hooks";

/**
 * Returns the current user's station/partner timezone.
 * Falls back to "UTC" if no timezone is set.
 * Used by all time formatting functions to ensure consistent timezone display.
 */
export function useTimezone(): string {
  const timezone = useAppSelector(
    (state) => state.auth.user?.timezone || "UTC"
  );
  return timezone;
}
