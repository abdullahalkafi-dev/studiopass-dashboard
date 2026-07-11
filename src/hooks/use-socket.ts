"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/store/hooks";
import { useDispatch } from "react-redux";
import { messageApi } from "@/features/message/messageApi";
import { callApi } from "@/features/call/callApi";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5003";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      console.log("Dashboard socket connected:", socket.id);

      // Auto-join station room if user has a station
      const stationId = (user as any).stationId;
      if (stationId) {
        socket.emit("join-station", stationId);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Dashboard socket disconnected:", reason);
    });

    socket.on("connect_error", () => {
      // Transient errors during reconnection
    });

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

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id, dispatch]);

  const joinStation = useCallback((stationId: string) => {
    socketRef.current?.emit("join-station", stationId);
  }, []);

  const leaveStation = useCallback((stationId: string) => {
    socketRef.current?.emit("leave-station", stationId);
  }, []);

  const joinShow = useCallback((showId: string) => {
    socketRef.current?.emit("join-show", showId);
  }, []);

  const leaveShow = useCallback((showId: string) => {
    socketRef.current?.emit("leave-show", showId);
  }, []);

  return { joinStation, leaveStation, joinShow, leaveShow };
}
