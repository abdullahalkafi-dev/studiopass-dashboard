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
import {
  useAcceptCallMutation,
  useRejectCallMutation,
} from "@/features/call/callApi";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [showWarning, setShowWarning] = useState(false);

  // --- Incoming call notifications (media_station only) ---------------------
  const [pendingCalls, setPendingCalls] = useState<IncomingCallData[]>([]);
  const isMediaStation = user?.role === "media_station";

  const [acceptCallMutation] = useAcceptCallMutation();
  const [rejectCallMutation] = useRejectCallMutation();

  useEffect(() => {
    if (!isAuthenticated || !token || !isMediaStation) return;

    const unsubIncoming = subscribeToIncomingCalls((data) => {
      setPendingCalls((prev) => {
        // Deduplicate by callId
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
  }, [isAuthenticated, token, isMediaStation]);

  const handleNotificationAccept = useCallback(
    async (callId: string) => {
      // Remove notification immediately for snappy UX
      setPendingCalls((prev) => prev.filter((c) => c.callId !== callId));
      try {
        await acceptCallMutation(callId).unwrap();
        // Redirect to calls page so the operator can see the live call
        router.push("/calls");
      } catch {
        // Accept may fail (already taken, timeout, etc.) — silently ignore
        // The calls page will show the updated state via RTK Query invalidation
      }
    },
    [acceptCallMutation, router],
  );

  const handleNotificationDecline = useCallback(
    async (callId: string) => {
      setPendingCalls((prev) => prev.filter((c) => c.callId !== callId));
      try {
        await rejectCallMutation(callId).unwrap();
      } catch {
        // Best effort
      }
    },
    [rejectCallMutation],
  );

  const handleNotificationDismiss = useCallback((callId: string) => {
    setPendingCalls((prev) => prev.filter((c) => c.callId !== callId));
  }, []);

  // --- Logout helpers -------------------------------------------------------
  const performLogout = useCallback(() => {
    setShowWarning(false);
    dispatch(logout());
    router.replace("/login");
  }, [dispatch, router]);

  // --- Inactivity timer -----------------------------------------------------
  const { resetTimer } = useInactivityTimer({
    isActive: !!(isAuthenticated && token),
    onWarn:   () => setShowWarning(true),
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
    <>
      {children}

      {/* Session timeout warning */}
      <SessionTimeoutModal
        open={showWarning}
        onStaySignedIn={handleStaySignedIn}
        onLogout={performLogout}
      />

      {/* Global floating incoming-call notifications (media_station only) */}
      {isMediaStation && (
        <IncomingCallNotification
          calls={pendingCalls}
          onAccept={handleNotificationAccept}
          onDecline={handleNotificationDecline}
          onDismiss={handleNotificationDismiss}
        />
      )}
    </>
  );
}

