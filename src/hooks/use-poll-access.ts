"use client";

import { useRole } from "@/contexts/role-context";
import { useChannelType } from "@/hooks/use-channel-type";

/**
 * Who sees and creates which kind of poll (owner decision, 2026-11-11):
 *  - Quick show polls (A/B question): Radio and TV. Created by super admin, partner admin and the station admin.
 *    The Media Station only reads them.
 *  - Channel polls (categories and nominees): Channels of type "polls". Created by super admin, partner admin and
 *    that Channel's admin. A Channel has no Media Station or Presenter.
 * The server enforces the same rules; this only keeps the dashboard from offering what the server refuses.
 */
export function usePollAccess() {
  const role = useRole();
  const { stationCategory, channelType } = useChannelType();

  const isSuperOrPartner = role === "super_admin" || role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const isChannelAdmin = isStationAdmin && stationCategory === "channel";
  // Channels made before types existed have none: still treated as polls-capable, like the server does
  const channelRunsPolls = !channelType || channelType === "polls";

  return {
    role,
    isChannelAdmin,
    showStationPolls: isSuperOrPartner || !isChannelAdmin,
    showChannelPolls: isSuperOrPartner || (isChannelAdmin && channelRunsPolls),
    canCreateQuickPoll: isSuperOrPartner || (isStationAdmin && !isChannelAdmin),
    canCreateChannelPoll: isSuperOrPartner || (isChannelAdmin && channelRunsPolls),
  };
}
