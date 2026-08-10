"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/store/hooks";
import { useDispatch } from "react-redux";
import { messageApi } from "@/features/message/messageApi";
import { callApi } from "@/features/call/callApi";
import { supportApi } from "@/features/support/supportApi";
import { toast } from "sonner";

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/api\/v[0-9]+\/?$/, "");

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const joinedShowsRef = useRef<Set<string>>(new Set());
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 15,
    });

    socket.on("connect", () => {
      console.log("Dashboard socket connected:", socket.id);

      // Auto-join station room if user has a station
      const stationId = (user as any).stationId;
      if (stationId) {
        socket.emit("join-station", stationId);
      }

      // Re-join all show rooms
      for (const showId of joinedShowsRef.current) {
        socket.emit("join-show", showId);
      }
      // Auto-join support queue for customer_care and admins
      if (["customer_care", "super_admin", "partner_admin"].includes(user.role)) {
        socket.emit("join-support-queue", { countryId: (user as any).countryId });
      }
    });

    // Custom ping to refresh operator online status on server (Redis 60s TTL)
    const pingInterval = setInterval(() => {
      if (socket.connected && !paused) {
        socket.emit("ping");
      }
    }, 30000);

    socket.on("disconnect", (reason) => {
      console.log("Dashboard socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("Dashboard socket connect_error:", err.message);
      toast.error("Connection error. Retrying...", { duration: 3000 });
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log(`Dashboard socket reconnect attempt ${attempt}`);
    });

    socket.on("reconnect_failed", () => {
      console.error("Dashboard socket reconnection exhausted");
      toast.error("Connection lost. Please refresh the page.", {
        duration: Infinity,
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
    });

    // ─── Visibility change: pause/resume ping in background tabs ───
    let paused = false;
    const handleVisibility = () => {
      if (document.hidden) {
        paused = true;
      } else {
        paused = false;
        // Immediately send a ping when tab becomes visible again
        if (socket.connected) {
          socket.emit("ping");
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // ─── Before unload: notify server of graceful disconnect ───
    const handleBeforeUnload = () => {
      if (socket.connected) {
        socket.emit("ping"); // Final ping to extend TTL
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // New user message from listener — invalidate caches for real-time update
    socket.on("new-user-message", () => {
      dispatch(messageApi.util.invalidateTags(["Message", "Thread", "Pending"]));
    });

    // Station reply sent — invalidate caches
    socket.on("new-message", () => {
      dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
    });

    // TV moderation events — invalidate pending queue + threads
    socket.on("message-approved", () => {
      dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
    });

    socket.on("message-rejected", () => {
      dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
    });

    socket.on("message-sent-to-output", () => {
      dispatch(messageApi.util.invalidateTags(["Pending", "Message", "Thread"]));
    });

    // Show lifecycle events
    socket.on("show-started", (data) => {
      console.log("Show started:", data);
      dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
    });

    socket.on("show-ended", (data) => {
      console.log("Show ended:", data);
      dispatch(messageApi.util.invalidateTags(["Message", "Thread"]));
    });

    // ─── Call Events ─────────────────────────────────────────────────────
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

    // ─── Support Ticket Events ──────────────────────────────────────────
    socket.on("new-support-message", () => {
      dispatch(supportApi.util.invalidateTags(["SupportTicket", "SupportMessage"]));
    });

    socket.on("new-ticket-conversation", () => {
      dispatch(supportApi.util.invalidateTags(["SupportTicket"]));
    });

    socket.on("ticket-status-changed", () => {
      dispatch(supportApi.util.invalidateTags(["SupportTicket", "SupportMessage"]));
    });

    socketRef.current = socket;

    return () => {
      clearInterval(pingInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id, (user as any)?.stationId, user?.role, dispatch]);

  const joinStation = useCallback((stationId: string) => {
    socketRef.current?.emit("join-station", stationId);
  }, []);

  const leaveStation = useCallback((stationId: string) => {
    socketRef.current?.emit("leave-station", stationId);
  }, []);

  const joinShow = useCallback((showId: string) => {
    joinedShowsRef.current.add(showId);
    socketRef.current?.emit("join-show", showId);
  }, []);

  const leaveShow = useCallback((showId: string) => {
    joinedShowsRef.current.delete(showId);
    socketRef.current?.emit("leave-show", showId);
  }, []);

  const joinSupportQueue = useCallback((countryId?: string) => {
    socketRef.current?.emit("join-support-queue", { countryId });
  }, []);

  const joinSupportConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("join-support-conversation", conversationId);
  }, []);

  const leaveSupportConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("leave-support-conversation", conversationId);
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
