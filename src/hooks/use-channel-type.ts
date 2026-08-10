"use client";

import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery } from "@/features/user/userApi";

export function useChannelType() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: profileData } = useGetMyProfileQuery();
  const liveUser = profileData?.data || user;

  const rawCat =
    (liveUser as any)?.stationCategory ||
    (liveUser as any)?.station?.category ||
    (user as any)?.stationCategory ||
    (user as any)?.station?.category ||
    "radio";

  const stationCategory = rawCat === "channels" || rawCat === "channel" ? "channel" : rawCat;

  const rawStation = (liveUser as any)?.station || (liveUser as any)?.stationId || (user as any)?.station || (user as any)?.stationId;
  const stationId = typeof rawStation === "object" ? (rawStation?._id || rawStation?.id || "") : (rawStation || "");

  const channelType =
    (liveUser as any)?.channelType ||
    (liveUser as any)?.station?.channelType ||
    (typeof rawStation === "object" ? rawStation?.channelType : null) ||
    (user as any)?.channelType ||
    (user as any)?.station?.channelType ||
    (user as any)?.user?.channelType ||
    null;

  const isPollChannel = stationCategory === "channel" && channelType === "polls";
  const isChallengeChannel = stationCategory === "channel" && channelType === "challenges";
  const isMessageChannel = stationCategory !== "channel" || channelType === "message_chat" || !channelType;

  return {
    stationCategory,
    channelType,
    stationId,
    isPollChannel,
    isChallengeChannel,
    isMessageChannel,
    liveUser,
  };
}
