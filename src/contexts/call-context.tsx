"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import {
  useGetStationCallsQuery,
  useAcceptCallMutation,
  useEndCallMutation,
  useRejectCallMutation,
} from "@/features/call/callApi";
import {
  subscribeToIncomingCalls,
  subscribeToCallRemoved,
} from "@/hooks/use-socket";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

export interface ActiveCallData {
  callId: string;
  channelName: string;
  token: string;
  operatorUid: number | string;
  callerName: string;
  callerPhone?: string;
  callerAvatar?: string;
  showName?: string;
  status: string;
  answeredAt?: string;
}

export interface WaitingCallItem {
  _id: string;
  callId?: string;
  station?: any;
  show?: any;
  startedBy?: {
    _id?: string;
    fullName?: string;
    phone?: string;
    avatar?: string;
  } | string;
  status: string;
  startedAt: string;
  waitStartedAt?: string;
  callerName?: string;
  callerPhone?: string;
  callerAvatar?: string;
  showName?: string;
}

interface CallContextType {
  activeCall: ActiveCallData | null;
  isInCall: boolean;
  isMuted: boolean;
  callDuration: number;
  waitingCalls: WaitingCallItem[];
  waitingCallsCount: number;
  acceptingId: string | null;
  decliningId: string | null;
  isEnding: boolean;
  toggleMute: () => Promise<void>;
  acceptCall: (callId: string, infoOverride?: Partial<ActiveCallData>) => Promise<void>;
  switchCall: (newCallId: string, infoOverride?: Partial<ActiveCallData>) => Promise<void>;
  endActiveCall: () => Promise<void>;
  declineCall: (callId: string) => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  const stationId = (user as any)?.stationId || "";

  // ─── Active Call & Agora State ──────────────────────────────────────────
  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const activeCallRef = useRef<ActiveCallData | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingRef = useRef(false);

  activeCallRef.current = activeCall;

  // ─── RTK Query Mutations & Queries ──────────────────────────────────────
  const { data: stationCallsData, refetch: refetchCalls } = useGetStationCallsQuery(
    { stationId, page: 1, limit: 100 },
    { skip: !stationId },
  );

  const [acceptCallMutation] = useAcceptCallMutation();
  const [endCallMutation, { isLoading: isEndingMutation }] = useEndCallMutation();
  const [rejectCallMutation] = useRejectCallMutation();

  // ─── Waiting Calls Queue (Real-Time Synchronized) ──────────────────────
  const [realtimeQueue, setRealtimeQueue] = useState<WaitingCallItem[]>([]);

  // Sync with RTK Query whenever stationCallsData updates
  useEffect(() => {
    const rawCalls: any[] = (stationCallsData as any)?.data || [];
    const serverQueued: WaitingCallItem[] = rawCalls.filter(
      (c) => c.status === "queued",
    );
    setRealtimeQueue(serverQueued);
  }, [stationCallsData]);

  // Real-time socket listeners for incoming / removed calls
  useEffect(() => {
    const unsubIncoming = subscribeToIncomingCalls((data) => {
      setRealtimeQueue((prev) => {
        if (prev.some((c) => (c._id === data.callId || c.callId === data.callId))) {
          return prev;
        }
        const newItem: WaitingCallItem = {
          _id: data.callId,
          callId: data.callId,
          callerName: data.callerName,
          callerPhone: data.callerPhone,
          callerAvatar: data.callerAvatar,
          showName: data.showName,
          startedAt: new Date(data.arrivedAt).toISOString(),
          waitStartedAt: new Date(data.arrivedAt).toISOString(),
          status: "queued",
          startedBy: {
            fullName: data.callerName,
            phone: data.callerPhone,
            avatar: data.callerAvatar,
          },
        };
        return [newItem, ...prev];
      });
    });

    const unsubRemoved = subscribeToCallRemoved((callId) => {
      setRealtimeQueue((prev) => prev.filter((c) => c._id !== callId && c.callId !== callId));
      // If current active call was ended remotely
      if (activeCallRef.current && activeCallRef.current.callId === callId) {
        handleRemoteUserDisconnected();
      }
    });

    return () => {
      unsubIncoming();
      unsubRemoved();
    };
  }, []);

  // ─── Duration Counter ──────────────────────────────────────────────────
  useEffect(() => {
    if (isInCall) {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [isInCall, activeCall?.callId]);

  // ─── Agora Lifecycle Helpers ───────────────────────────────────────────
  const leaveAgora = useCallback(async () => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
    } catch (err) {
      console.warn("[CallContext] Error leaving Agora:", err);
    } finally {
      setIsInCall(false);
      setIsMuted(false);
    }
  }, []);

  const handleRemoteUserDisconnected = useCallback(async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    toast.info("Call ended.");
    await leaveAgora();
    setActiveCall(null);
    isEndingRef.current = false;
  }, [leaveAgora]);

  const joinAgoraChannel = useCallback(
    async (token: string, channelName: string, operatorUid: number | string) => {
      if (!AGORA_APP_ID) {
        throw new Error("Agora App ID not configured.");
      }

      if (typeof window !== "undefined") {
        const isSecure =
          window.isSecureContext ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        if (!navigator.mediaDevices?.getUserMedia || !isSecure) {
          throw new Error("Microphone access requires HTTPS or browser permission.");
        }
      }

      // Cleanup any previous client
      await leaveAgora();

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "audio") {
          remoteUser.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (remoteUser, mediaType) => {
        if (mediaType === "audio") {
          remoteUser.audioTrack?.stop();
        }
      });

      client.on("user-left", () => {
        handleRemoteUserDisconnected();
      });

      client.on("connection-state-change", (curState) => {
        if (curState === "DISCONNECTED") {
          console.warn("[CallContext] Agora connection state: DISCONNECTED");
        }
      });

      await client.join(AGORA_APP_ID, channelName, token || null, operatorUid);

      const localAudio = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = localAudio;
      await client.publish([localAudio]);

      setIsInCall(true);
      setIsMuted(false);
    },
    [leaveAgora, handleRemoteUserDisconnected],
  );

  // ─── Microphone Permission Pre-flight ─────────────────────────────────
  const ensureMicrophonePermission = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Your browser does not support microphone capture (getUserMedia).");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (err: any) {
      console.error("[CallContext] Microphone permission error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error("Microphone permission was denied. Please allow microphone access in your browser to talk on air.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        throw new Error("No microphone was detected on your device. Please connect a microphone and try again.");
      }
      throw new Error("Could not access microphone: " + (err.message || "Permission required"));
    }
  }, []);

  // ─── Actions: 1-Click Accept ───────────────────────────────────────────
  const acceptCall = useCallback(
    async (callId: string, infoOverride?: Partial<ActiveCallData>) => {
      setAcceptingId(callId);
      try {
        // Immediate mic permission check right on user click gesture
        await ensureMicrophonePermission();

        // Remove from waiting queue immediately for responsive UX
        setRealtimeQueue((prev) => prev.filter((c) => c._id !== callId && c.callId !== callId));

        const response = await acceptCallMutation(callId).unwrap();
        const resData = (response as any)?.data;

        if (!resData?.token || !resData?.channelName || !resData?.operatorUid) {
          throw new Error("Invalid call credentials from server.");
        }

        // Find caller info if available
        const queueMatch = realtimeQueue.find((c) => c._id === callId || c.callId === callId);
        const callerName =
          infoOverride?.callerName ||
          queueMatch?.callerName ||
          (typeof queueMatch?.startedBy === "object" ? queueMatch.startedBy?.fullName : "") ||
          "Listener";
        const callerPhone =
          infoOverride?.callerPhone ||
          queueMatch?.callerPhone ||
          (typeof queueMatch?.startedBy === "object" ? queueMatch.startedBy?.phone : "");
        const callerAvatar =
          infoOverride?.callerAvatar ||
          queueMatch?.callerAvatar ||
          (typeof queueMatch?.startedBy === "object" ? queueMatch.startedBy?.avatar : "");
        const showName = infoOverride?.showName || queueMatch?.showName || "";

        const newActive: ActiveCallData = {
          callId,
          channelName: resData.channelName,
          token: resData.token,
          operatorUid: resData.operatorUid,
          callerName,
          callerPhone,
          callerAvatar,
          showName,
          status: "answered",
          answeredAt: new Date().toISOString(),
        };

        setActiveCall(newActive);

        // Join Agora audio channel immediately
        await joinAgoraChannel(resData.token, resData.channelName, resData.operatorUid);
        toast.success(`Connected to ${callerName}!`);
      } catch (err: any) {
        toast.error(err?.data?.message || err?.message || "Failed to connect call.");
        refetchCalls();
      } finally {
        setAcceptingId(null);
      }
    },
    [ensureMicrophonePermission, acceptCallMutation, joinAgoraChannel, realtimeQueue, refetchCalls],
  );

  // ─── Actions: 1-Click Caller Switching ─────────────────────────────────
  const switchCall = useCallback(
    async (newCallId: string, infoOverride?: Partial<ActiveCallData>) => {
      await ensureMicrophonePermission();
      // Backend automatically completes previous call in acceptCall
      await acceptCall(newCallId, infoOverride);
    },
    [ensureMicrophonePermission, acceptCall],
  );

  // ─── Actions: End Call ─────────────────────────────────────────────────
  const endActiveCall = useCallback(async () => {
    if (!activeCall) return;
    const callId = activeCall.callId;

    try {
      await leaveAgora();
      setActiveCall(null);
      await rejectCallMutation(callId).unwrap();
      toast.success("Call ended. Caller disconnected.");
      refetchCalls();
    } catch (err: any) {
      console.warn("[CallContext] End call API notice:", err);
      setActiveCall(null);
      refetchCalls();
    }
  }, [activeCall, leaveAgora, rejectCallMutation, refetchCalls]);

  // ─── Actions: Decline Waiting Call ─────────────────────────────────────
  const declineCall = useCallback(
    async (callId: string) => {
      setDecliningId(callId);
      try {
        setRealtimeQueue((prev) => prev.filter((c) => c._id !== callId && c.callId !== callId));
        await rejectCallMutation(callId).unwrap();
        toast.info("Call declined.");
        refetchCalls();
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to decline call.");
        refetchCalls();
      } finally {
        setDecliningId(null);
      }
    },
    [rejectCallMutation, refetchCalls],
  );

  // ─── Actions: Toggle Mute ──────────────────────────────────────────────
  const toggleMute = useCallback(async () => {
    if (!localAudioTrackRef.current) {
      if (isInCall && clientRef.current) {
        try {
          const localAudio = await AgoraRTC.createMicrophoneAudioTrack();
          localAudioTrackRef.current = localAudio;
          await clientRef.current.publish([localAudio]);
          setIsMuted(false);
          toast.success("Microphone track re-connected.");
          return;
        } catch (e: any) {
          toast.error("Microphone unavailable. Please allow microphone access in your browser.");
          return;
        }
      }
      return;
    }
    try {
      const nextMuted = !isMuted;
      await localAudioTrackRef.current.setMuted(nextMuted);
      setIsMuted(nextMuted);
    } catch (err: any) {
      console.warn("[CallContext] Error setting mute:", err);
    }
  }, [isMuted, isInCall]);

  const value = useMemo(
    () => ({
      activeCall,
      isInCall,
      isMuted,
      callDuration,
      waitingCalls: realtimeQueue,
      waitingCallsCount: realtimeQueue.length,
      acceptingId,
      decliningId,
      isEnding: isEndingMutation || isEndingRef.current,
      toggleMute,
      acceptCall,
      switchCall,
      endActiveCall,
      declineCall,
    }),
    [
      activeCall,
      isInCall,
      isMuted,
      callDuration,
      realtimeQueue,
      acceptingId,
      decliningId,
      isEndingMutation,
      toggleMute,
      acceptCall,
      switchCall,
      endActiveCall,
      declineCall,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return context;
}
