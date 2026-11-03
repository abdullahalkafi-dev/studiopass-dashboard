"use client";

import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { useStore } from "react-redux";
import { io, Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { messageApi } from "@/features/message/messageApi";
import { callApi } from "@/features/call/callApi";
import { showApi } from "@/features/show/showApi";
import { supportApi } from "@/features/support/supportApi";
import { notificationApi } from "@/features/notification/notificationApi";
import { refreshSession } from "@/features/api/baseApi";
import { logout } from "@/features/auth/authSlice";
import { toast } from "sonner";
import type { IncomingCallData } from "@/components/modals/incoming-call-notification";

// ─── Module-level subscriber registry ────────────────────────────────────────
// Allows multiple components to listen to incoming-call events without
// re-creating the socket. The registry lives outside React so it survives
// component re-renders and is shared across all hook instances.

type IncomingCallHandler = (data: IncomingCallData) => void;
type CallRemovedHandler = (callId: string) => void;
type CallEndedHandler = (data: { callId: string; reason?: string; message?: string }) => void;

const incomingCallSubscribers = new Set<IncomingCallHandler>();
const callRemovedSubscribers = new Set<CallRemovedHandler>();
const callEndedSubscribers = new Set<CallEndedHandler>();

export function subscribeToIncomingCalls(fn: IncomingCallHandler) {
  incomingCallSubscribers.add(fn);
  return () => incomingCallSubscribers.delete(fn);
}

export function subscribeToCallRemoved(fn: CallRemovedHandler) {
  callRemovedSubscribers.add(fn);
  return () => callRemovedSubscribers.delete(fn);
}

export function subscribeToCallEnded(fn: CallEndedHandler) {
  callEndedSubscribers.add(fn);
  return () => callEndedSubscribers.delete(fn);
}

// ─── Connection status (for the banner and for choosing polling intervals) ───

export type SocketStatus = "connected" | "connecting" | "offline";

let socketStatus: SocketStatus = "offline";
const statusListeners = new Set<() => void>();

function setSocketStatus(next: SocketStatus) {
  if (next === socketStatus) return;
  socketStatus = next;
  statusListeners.forEach((listener) => listener());
}

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** Live connection state of the realtime socket. */
export function useSocketStatus(): SocketStatus {
  return useSyncExternalStore(
    subscribeStatus,
    () => socketStatus,
    () => "offline" as SocketStatus,
  );
}

const getSocketUrl = () => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  return apiUrl.replace(/\/api\/v[0-9]+$/, "");
};

let globalSocket: Socket | null = null;
let globalSocketUserId: string | null = null;
/** The token a (re)connecting socket will present. Kept current without rebuilding the socket. */
let currentToken: string | null = null;
let socketRefCount = 0;
const joinedShows = new Set<string>();

export function useSocket() {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const store = useStore();

  const stationIdRef = useRef<string | null>(null);
  const roleRef = useRef<string | null>(null);
  const countryIdRef = useRef<string | null>(null);

  // A refreshed token must reach the socket WITHOUT tearing it down: rebuilding dropped every room for a
  // moment and, for an operator on a call, started the server's disconnect grace for no reason.
  useEffect(() => {
    currentToken = token;
    // A socket that was refused for an expired token is retried now that a new one exists
    if (token && globalSocket && !globalSocket.connected) {
      globalSocket.connect();
    }
  }, [token]);

  const isLoggedIn = !!token && !!user;

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    stationIdRef.current = (user as any).stationId ?? null;
    roleRef.current = user.role ?? null;
    countryIdRef.current = (user as any).countryId ?? null;
    currentToken = token;

    socketRefCount++;

    // Only create a new socket when none exists or the signed-in user changed (never for a mere token refresh)
    if (!globalSocket || globalSocketUserId !== user.id) {
      if (globalSocket) {
        globalSocket.disconnect();
      }

      globalSocketUserId = user.id;
      setSocketStatus("connecting");

      const socket = io(getSocketUrl(), {
        // A function: evaluated on EVERY connection attempt, so a reconnect after hours offline presents
        // the current token, not the one that existed when the page was opened.
        auth: (cb) => cb({ token: currentToken }),
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: Infinity,
      });

      globalSocket = socket;

      /** Get a new token, then connect again. Signs out only when the server refuses the refresh token. */
      let recovering = false;
      const recoverSession = async () => {
        if (recovering) return;
        recovering = true;
        try {
          const outcome = await refreshSession(store);
          if (outcome === "rejected") {
            toast.error("Your session has ended. Please sign in again.");
            dispatch(logout());
            if (typeof window !== "undefined") window.location.href = "/login";
          } else if (outcome === "ok") {
            // The token effect above reconnects with the new token; this is the fallback
            if (!socket.connected) socket.connect();
          } else {
            // Server unreachable right now: try again shortly
            setTimeout(() => {
              if (!socket.connected) socket.connect();
            }, 10000);
          }
        } finally {
          recovering = false;
        }
      };

      socket.on("connect", () => {
        setSocketStatus("connected");
        const stationId = stationIdRef.current;
        if (stationId) {
          socket.emit("join-station", stationId);
        }
        for (const showId of joinedShows) {
          socket.emit("join-show", showId);
        }
        if (["customer_care", "super_admin", "partner_admin"].includes(roleRef.current ?? "")) {
          socket.emit("join-support-queue", { countryId: countryIdRef.current });
        }
        // Catch up on everything that may have happened while disconnected: new messages, the call queue,
        // approvals, the live show, support tickets and notifications.
        dispatch(messageApi.util.invalidateTags(["Thread", "Pending", "Message"]));
        dispatch(showApi.util.invalidateTags(["LiveStats", "Show"]));
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(supportApi.util.invalidateTags(["SupportTicket", "SupportMessage"]));
        dispatch(notificationApi.util.invalidateTags(["Notification"]));
      });

      socket.on("disconnect", (reason) => {
        setSocketStatus(reason === "io client disconnect" ? "offline" : "connecting");
        // "io server disconnect": the server closed us and the library does NOT reconnect by itself
        if (reason === "io server disconnect") void recoverSession();
      });

      socket.on("connect_error", (err: any) => {
        setSocketStatus("connecting");
        const code = err?.data?.code as string | undefined;
        if (code === "SESSION_REVOKED" || code === "ACCOUNT_BLOCKED") {
          toast.error(err?.message || "Your session has ended.");
          dispatch(logout());
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        // Older servers send only the text
        if (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN" || /Invalid token/i.test(err?.message ?? "")) {
          void recoverSession();
        }
      });

      socket.on("force-logout", (data: any) => {
        const mySessionId = (user as any)?.sessionId;
        if (!data?.sessionId || data?.sessionId === mySessionId) {
          toast.error(data?.reason || "Your session was terminated remotely by an administrator.");
          dispatch(logout());
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      });

      let msgInvalidateTimer: NodeJS.Timeout | null = null;
      const debouncedThreadRefresh = () => {
        if (msgInvalidateTimer) return;
        msgInvalidateTimer = setTimeout(() => {
          dispatch(messageApi.util.invalidateTags(["Thread"]));
          msgInvalidateTimer = null;
        }, 1500);
      };

      socket.on("new-user-message", (data: any) => {
        const msg = data?.message;
        if (msg && msg.stationId && msg.msisdn) {
          (dispatch as any)(
            messageApi.util.updateQueryData("getThread" as any, { stationId: msg.stationId, msisdn: msg.msisdn } as any, (draft: any) => {
              const list = draft?.data?.messages || draft?.data;
              if (Array.isArray(list)) {
                if (!list.some((m: any) => (m._id || m.id) === (msg._id || msg.id))) {
                  list.push(msg);
                }
              }
            })
          );
        }
        debouncedThreadRefresh();
      });

      socket.on("new-message", (data: any) => {
        const msg = data?.message;
        if (msg && msg.stationId && msg.msisdn) {
          (dispatch as any)(
            messageApi.util.updateQueryData("getThread" as any, { stationId: msg.stationId, msisdn: msg.msisdn } as any, (draft: any) => {
              const list = draft?.data?.messages || draft?.data;
              if (Array.isArray(list)) {
                if (!list.some((m: any) => (m._id || m.id) === (msg._id || msg.id))) {
                  list.push(msg);
                }
              }
            })
          );
        }
        debouncedThreadRefresh();
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
      });

      socket.on("message-approved", () => {
        dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
      });

      socket.on("message-rejected", () => {
        dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
      });

      socket.on("message-sent-to-output", () => {
        dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
      });

      socket.on("show-started", () => {
        dispatch(showApi.util.invalidateTags(["Show", "LiveStats"]));
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
      });

      socket.on("show-ended", () => {
        dispatch(showApi.util.invalidateTags(["Show", "LiveStats"]));
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
      });

      socket.on("incoming-call", (data) => {
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
        // Broadcast to all subscribers (e.g. floating notification)
        const notification: IncomingCallData = {
          callId: data.callId,
          callerName: data.callerName || "Unknown",
          callerPhone: data.callerPhone || "",
          callerAvatar: data.callerAvatar || "",
          showName: data.showName || "",
          arrivedAt: Date.now(),
        };
        incomingCallSubscribers.forEach((fn) => fn(notification));
      });

      socket.on("call-removed", (data) => {
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
        // Broadcast removal so notification can be dismissed
        callRemovedSubscribers.forEach((fn) => fn(data.callId));
      });

      socket.on("call-ended", (data) => {
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
        callRemovedSubscribers.forEach((fn) => fn(data.callId));
        callEndedSubscribers.forEach((fn) => fn(data));
      });

      socket.on("call-cancelled", (data) => {
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
        callRemovedSubscribers.forEach((fn) => fn(data.callId));
        callEndedSubscribers.forEach((fn) => fn(data));
      });

      socket.on("new-support-message", () => {
        dispatch(supportApi.util.invalidateTags(["SupportTicket", "SupportMessage"]));
      });

      socket.on("new-ticket-conversation", () => {
        dispatch(supportApi.util.invalidateTags(["SupportTicket"]));
      });

      socket.on("ticket-status-changed", () => {
        dispatch(supportApi.util.invalidateTags(["SupportTicket", "SupportMessage"]));
      });
    }

    // Ping interval for operator online status
    const pingInterval = setInterval(() => {
      if (globalSocket?.connected) {
        globalSocket.emit("ping");
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      socketRefCount--;
      // Only disconnect if all components unmounted (app unmount / user logout)
      if (socketRefCount <= 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        globalSocketUserId = null;
        socketRefCount = 0;
        setSocketStatus("offline");
      }
    };
    // The token is deliberately not a dependency: see the token effect above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id, user?.role, dispatch, store]);

  const joinStation = useCallback((stationId: string) => {
    globalSocket?.emit("join-station", stationId);
  }, []);

  const leaveStation = useCallback((stationId: string) => {
    globalSocket?.emit("leave-station", stationId);
  }, []);

  const joinShow = useCallback((showId: string) => {
    joinedShows.add(showId);
    globalSocket?.emit("join-show", showId);
  }, []);

  const leaveShow = useCallback((showId: string) => {
    joinedShows.delete(showId);
    globalSocket?.emit("leave-show", showId);
  }, []);

  const joinSupportQueue = useCallback((countryId?: string) => {
    globalSocket?.emit("join-support-queue", { countryId });
  }, []);

  const joinSupportConversation = useCallback((conversationId: string) => {
    globalSocket?.emit("join-support-conversation", conversationId);
  }, []);

  const leaveSupportConversation = useCallback((conversationId: string) => {
    globalSocket?.emit("leave-support-conversation", conversationId);
  }, []);

  return {
    joinStation,
    leaveStation,
    joinShow,
    leaveShow,
    joinSupportQueue,
    joinSupportConversation,
    leaveSupportConversation,
  };
}
