"use client";

import { useAppSelector } from "@/store/hooks";

/**
 * Returns the current user's station/partner timezone.
 * For Super Admin, falls back to "Africa/Kampala" (Uganda, UTC+3) where the platform owner lives.
 * Otherwise falls back to "UTC" if no timezone is set.
 * Used by all time formatting functions to ensure consistent timezone display.
 */
export function useTimezone(): string {
  const user = useAppSelector((state) => state.auth.user);
  if (user?.timezone) return user.timezone;
  if (user?.role === "super_admin") return "Africa/Kampala";
  return "UTC";
}
