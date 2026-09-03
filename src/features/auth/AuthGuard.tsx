"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/features/auth/authSlice";
import { useInactivityTimer } from "@/hooks/use-inactivity-timer";
import { SessionTimeoutModal } from "@/components/modals/session-timeout-modal";
import {
  IncomingCallNotification,
  type IncomingCallData,
} from "@/components/modals/incoming-call-notification";
import {
  subscribeToIncomingCalls,
  subscribeToCallRemoved,
} from "@/hooks/use-socket";
import { CallProvider, useCallContext } from "@/contexts/call-context";
import { PersistentCallBar } from "@/components/calls/persistent-call-bar";

function GlobalCallManager() {
  const { isInCall, acceptCall, declineCall } = useCallContext();
  const [pendingCalls, setPendingCalls] = useState<IncomingCallData[]>([]);

  useEffect(() => {
    const unsubIncoming = subscribeToIncomingCalls((data) => {
      setPendingCalls((prev) => {
        if (prev.some((c) => c.callId === data.callId)) return prev;
        return [...prev, data];
      });
    });

    const unsubRemoved = subscribeToCallRemoved((callId) => {
      setPendingCalls((prev) => prev.filter((c) => c.callId !== callId));
    });

    return () => {
      unsubIncoming();
      unsubRemoved();
    };
  }, []);

  const handleNotificationAccept = useCallback(
    async (callId: string) => {
      const match = pendingCalls.find((c) => c.callId === callId);
      setPendingCalls((prev) => prev.filter((c) => c.callId !== callId));
      await acceptCall(callId, {
        callerName: match?.callerName,
        callerPhone: match?.callerPhone,
        callerAvatar: match?.callerAvatar,
        showName: match?.showName,
      });
    },
    [acceptCall, pendingCalls],
  );

  const handleNotificationDecline = useCallback(
    async (callId: string) => {
      setPendingCalls((prev) => prev.filter((c) => c.callId !== callId));
      await declineCall(callId);
    },
    [declineCall],
  );

  const handleNotificationDismiss = useCallback((callId: string) => {
    setPendingCalls((prev) => prev.filter((c) => c.callId !== callId));
  }, []);

  return (
    <>
      <IncomingCallNotification
        calls={pendingCalls}
        isOnCall={isInCall}
        onAccept={handleNotificationAccept}
        onDecline={handleNotificationDecline}
        onDismiss={handleNotificationDismiss}
      />
      <PersistentCallBar />
    </>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [showWarning, setShowWarning] = useState(false);

  // Users who handle studio calls (media stations, presenters, station admins)
  const canTakeCalls = ["media_station", "presenter", "station_admin"].includes(
    user?.role || "",
  );

  // --- Logout helpers -------------------------------------------------------
  const performLogout = useCallback(() => {
    setShowWarning(false);
    dispatch(logout());
    router.replace("/login");
  }, [dispatch, router]);

  // --- Inactivity timer -----------------------------------------------------
  const { resetTimer } = useInactivityTimer({
    isActive: !!(isAuthenticated && token),
    onWarn: () => setShowWarning(true),
    onExpire: performLogout,
  });

  const handleStaySignedIn = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  // --- Redirect unauthenticated users ---------------------------------------
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/login");
    }
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated || !token) return null;

  return (
    <CallProvider>
      {children}

      {/* Session timeout warning */}
      <SessionTimeoutModal
        open={showWarning}
        onStaySignedIn={handleStaySignedIn}
        onLogout={performLogout}
      />

      {/* Global floating incoming-call notifications & persistent in-call dock */}
      {canTakeCalls && <GlobalCallManager />}
    </CallProvider>
  );
}
