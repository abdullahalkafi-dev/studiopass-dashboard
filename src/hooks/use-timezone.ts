"use client";

import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery } from "@/features/user/userApi";
import { pickTimezone } from "@/utils/time-utils";

/**
 * Returns the station/partner timezone for the logged-in dashboard user.
 * Priority: profile (station→country) → Redux auth user → super_admin default → UTC.
 */
export function useTimezone(): string {
  const user = useAppSelector((state) => state.auth.user);
  const { data: profileData } = useGetMyProfileQuery();
  const profile = profileData?.data as any;

  const profileTz =
    profile?.timezone ??
    profile?.station?.country?.timezone ??
    null;

  if (user?.role === "super_admin" && !profileTz && !user?.timezone) {
    return "Africa/Kampala";
  }

  return pickTimezone(profileTz, user?.timezone);
}
