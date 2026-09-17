"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { messageApi } from "@/features/message/messageApi";
import { callApi } from "@/features/call/callApi";
import { showApi } from "@/features/show/showApi";
import { supportApi } from "@/features/support/supportApi";
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

const getSocketUrl = () => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  return apiUrl.replace(/\/api\/v[0-9]+$/, "");
};

let globalSocket: Socket | null = null;
let globalSocketToken: string | null = null;
let globalSocketUserId: string | null = null;
let socketRefCount = 0;
const joinedShows = new Set<string>();

export function useSocket() {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const stationIdRef = useRef<string | null>(null);
  const roleRef = useRef<string | null>(null);
  const countryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    stationIdRef.current = (user as any).stationId ?? null;
    roleRef.current = user.role ?? null;
    countryIdRef.current = (user as any).countryId ?? null;

    socketRefCount++;

    // Only create a new socket if token or user changed or no socket exists
    if (!globalSocket || globalSocketToken !== token || globalSocketUserId !== user.id) {
      if (globalSocket) {
        globalSocket.disconnect();
      }

      globalSocketToken = token;
      globalSocketUserId = user.id;

      const socket = io(getSocketUrl(), {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: Infinity,
      });

      globalSocket = socket;

      socket.on("connect", () => {
        console.log("Dashboard socket connected:", socket.id);
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
        // Seamless catch-up on socket reconnection (WhatsApp Web style)
        dispatch(messageApi.util.invalidateTags(["Thread"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
      });

      socket.on("disconnect", (reason) => {
        console.log("Dashboard socket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        console.warn("Dashboard socket connect_error:", err.message);
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

      socket.on("show-started", (data) => {
        console.log("Show started:", data);
        dispatch(showApi.util.invalidateTags(["Show", "LiveStats"]));
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
      });

      socket.on("show-ended", (data) => {
        console.log("Show ended:", data);
        dispatch(showApi.util.invalidateTags(["Show", "LiveStats"]));
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
      });

      socket.on("incoming-call", (data) => {
        console.log("Incoming call:", data);
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
        console.log("Call removed from queue:", data);
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
        // Broadcast removal so notification can be dismissed
        callRemovedSubscribers.forEach((fn) => fn(data.callId));
      });

      socket.on("call-ended", (data) => {
        console.log("Call ended:", data);
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
        callRemovedSubscribers.forEach((fn) => fn(data.callId));
        callEndedSubscribers.forEach((fn) => fn(data));
      });

      socket.on("call-cancelled", (data) => {
        console.log("Call cancelled:", data);
        dispatch(callApi.util.invalidateTags(["Call"]));
        dispatch(showApi.util.invalidateTags(["LiveStats"]));
        callRemovedSubscribers.forEach((fn) => fn(data.callId));
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
        globalSocketToken = null;
        globalSocketUserId = null;
        socketRefCount = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, user?.role, dispatch]);

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
