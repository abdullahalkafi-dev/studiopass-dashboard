"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/store/hooks";
import { useDispatch } from "react-redux";
import { messageApi } from "@/features/message/messageApi";
import { callApi } from "@/features/call/callApi";
import { supportApi } from "@/features/support/supportApi";
import { toast } from "sonner";

const getSocketUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith("http")) {
    return envUrl.replace(/\/api\/v[0-9]+\/?$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5000";
};

let globalSocket: Socket | null = null;
let globalSocketToken: string | null = null;
let globalSocketUserId: string | null = null;
let socketRefCount = 0;
const joinedShows = new Set<string>();

export function useSocket() {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useDispatch();

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
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: 15,
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
      });

      socket.on("disconnect", (reason) => {
        console.log("Dashboard socket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        console.warn("Dashboard socket connect_error:", err.message);
      });

      socket.on("new-user-message", () => {
        dispatch(messageApi.util.invalidateTags(["Message", "Thread", "Pending"]));
      });

      socket.on("new-message", () => {
        dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
      });

      socket.on("message-approved", () => {
        dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
      });

      socket.on("message-rejected", () => {
        dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
      });

      socket.on("message-sent-to-output", () => {
        dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
      });

      socket.on("show-started", (data) => {
        console.log("Show started:", data);
        dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
      });

      socket.on("show-ended", (data) => {
        console.log("Show ended:", data);
        dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
      });

      socket.on("incoming-call", (data) => {
        console.log("Incoming call:", data);
        dispatch(callApi.util.invalidateTags(["Call"]));
      });

      socket.on("call-removed", (data) => {
        console.log("Call removed from queue:", data);
        dispatch(callApi.util.invalidateTags(["Call"]));
      });

      socket.on("call-ended", (data) => {
        console.log("Call ended:", data);
        dispatch(callApi.util.invalidateTags(["Call"]));
      });

      socket.on("call-cancelled", (data) => {
        console.log("Call cancelled:", data);
        dispatch(callApi.util.invalidateTags(["Call"]));
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
