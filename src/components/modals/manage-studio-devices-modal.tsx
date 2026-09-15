"use client";

import { useState } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Globe,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  useGetUserSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllUserSessionsMutation,
  useToggleDeviceApprovalMutation,
  DeviceSessionItem,
} from "@/features/device-session/deviceSessionApi";
import { toast } from "sonner";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

interface ManageStudioDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    fullName: string;
    role?: string;
    stationName?: string;
  } | null;
}

function getDeviceIcon(os?: string) {
  const lower = (os || "").toLowerCase();
  if (lower.includes("ios") || lower.includes("android")) {
    return <Smartphone className="text-[#02B2FF]" size={18} />;
  }
  if (lower.includes("ipad") || lower.includes("tablet")) {
    return <Tablet className="text-violet-400" size={18} />;
  }
  if (lower.includes("mac") || lower.includes("laptop")) {
    return <Laptop className="text-emerald-400" size={18} />;
  }
  return <Monitor className="text-[#02B2FF]" size={18} />;
}

export function ManageStudioDevicesModal({
  isOpen,
  onClose,
  user,
}: ManageStudioDevicesModalProps) {
  const timezone = useTimezone();
  const userId = user?.id || "";

  const { data, isLoading, isFetching, refetch } = useGetUserSessionsQuery(userId, {
    skip: !isOpen || !userId,
  });

  const [revokeSession, { isLoading: isRevokingOne }] = useRevokeSessionMutation();
  const [revokeAllSessions, { isLoading: isRevokingAll }] = useRevokeAllUserSessionsMutation();
  const [toggleApproval, { isLoading: isTogglingApproval }] = useToggleDeviceApprovalMutation();

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [togglingSessionId, setTogglingSessionId] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const sessions = data?.data || [];
  const activeSessions = sessions.filter((s) => s.status === "active");

  const handleRevokeSingle = async (session: DeviceSessionItem) => {
    setRevokingSessionId(session.sessionId);
    try {
      await revokeSession(session.sessionId).unwrap();
      toast.success(`Remote logout triggered for ${session.deviceName}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to terminate session");
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm(`Are you sure you want to log out all ${activeSessions.length} active sessions for ${user.fullName}?`)) {
      return;
    }
    try {
      await revokeAllSessions(user.id).unwrap();
      toast.success(`All active sessions terminated for ${user.fullName}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to terminate all sessions");
    }
  };

  const handleToggleApproval = async (session: DeviceSessionItem) => {
    setTogglingSessionId(session.sessionId);
    const newStatus = !session.isApprovedStudioDevice;
    try {
      await toggleApproval({
        sessionId: session.sessionId,
        isApproved: newStatus,
      }).unwrap();
      toast.success(
        newStatus
          ? `Device "${session.deviceName}" approved as official studio terminal (inactivity logout disabled).`
          : `Studio device approval revoked for "${session.deviceName}" (standard 30-min inactivity applies).`
      );
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update device approval");
    } finally {
      setTogglingSessionId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center">
              <Monitor size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Devices & Active Sessions
              </h3>
              <p className="text-xs text-muted-foreground">
                {user.fullName} {user.stationName ? `· ${user.stationName}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Header Bar */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {isLoading || isFetching
              ? "Checking connected devices..."
              : `${activeSessions.length} active session${activeSessions.length === 1 ? "" : "s"} (${sessions.length} total history)`}
          </span>
          {activeSessions.length > 0 && (
            <button
              onClick={handleRevokeAll}
              disabled={isRevokingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 transition-all disabled:opacity-50"
            >
              {isRevokingAll ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <LogOut size={13} />
              )}
              Log Out All Devices
            </button>
          )}
        </div>

        {/* Sessions List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 size={24} className="animate-spin text-[#02B2FF]" />
              <span className="text-xs">Loading studio device records...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Monitor className="mx-auto opacity-30" size={36} />
              <p className="text-sm font-medium text-foreground">No active or recorded devices</p>
              <p className="text-xs max-w-sm mx-auto">
                Devices will be listed here automatically when someone signs into this account.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.status === "active";
              const isToggling = togglingSessionId === session.sessionId;
              const isRevoking = revokingSessionId === session.sessionId;

              return (
                <div
                  key={session.sessionId || session._id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? "bg-card border-border hover:border-[#02B2FF]/40 shadow-sm"
                      : "bg-muted/10 border-border/40 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Device info */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-lg bg-muted/40 border border-border">
                        {getDeviceIcon(session.os)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {session.deviceName || `${session.os} (${session.browser})`}
                          </span>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Now
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                              Revoked
                            </span>
                          )}

                          {/* Approved Studio Device Badge */}
                          {session.isApprovedStudioDevice ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#02B2FF]/10 text-[#02B2FF] border border-[#02B2FF]/30">
                              <ShieldCheck size={11} />
                              Approved Studio Terminal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertTriangle size={11} />
                              General Device (30m Inactivity Timeout)
                            </span>
                          )}
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Globe size={11} />
                            {session.ipAddress || "Unknown IP"}
                          </span>
                          <span>·</span>
                          <span>
                            {session.browser} on {session.os}
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} />
                            Last active: {session.lastActiveAt ? formatDate(session.lastActiveAt, timezone) : "Recently"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isActive && (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Toggle Studio Terminal Approval */}
                        <button
                          onClick={() => handleToggleApproval(session)}
                          disabled={isToggling || isTogglingApproval}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                            session.isApprovedStudioDevice
                              ? "text-amber-400 hover:bg-amber-500/10 border-amber-500/30"
                              : "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                          } disabled:opacity-50`}
                          title={
                            session.isApprovedStudioDevice
                              ? "Revoke studio approval (device will use 30-min inactivity timeout)"
                              : "Approve as official studio terminal (device will stay signed in 24/7)"
                          }
                        >
                          {isToggling ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : session.isApprovedStudioDevice ? (
                            <ShieldAlert size={12} />
                          ) : (
                            <ShieldCheck size={12} />
                          )}
                          {session.isApprovedStudioDevice ? "Revoke Studio Approval" : "Approve as Studio Device"}
                        </button>

                        {/* Remote Logout Button */}
                        <button
                          onClick={() => handleRevokeSingle(session)}
                          disabled={isRevoking || isRevokingOne}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 transition-all disabled:opacity-50"
                          title="Remotely terminate this device session immediately"
                        >
                          {isRevoking ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <LogOut size={12} />
                          )}
                          Remote Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            💡 <strong>Approved Studio Terminals</strong> stay logged in 24/7 during live broadcasts.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-muted/40 hover:bg-muted text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
