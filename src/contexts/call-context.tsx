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
import type { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import {
  useGetStationCallsQuery,
  useAcceptCallMutation,
  useEndCallMutation,
  useRejectCallMutation,
  useRenewCallTokenMutation,
} from "@/features/call/callApi";
import {
  subscribeToIncomingCalls,
  subscribeToCallRemoved,
  subscribeToCallEnded,
} from "@/hooks/use-socket";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

/** How long to wait for a caller whose connection dropped (Agora "ServerTimeOut") before ending. */
const REMOTE_RECONNECT_GRACE_MS = 8000;

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
  /** Take a waiting caller. If a caller is already on air this switches to the new caller. */
  acceptCall: (callId: string, infoOverride?: Partial<ActiveCallData>) => Promise<void>;
  /** Same as acceptCall — kept so every "Switch" button goes through one code path. */
  switchCall: (newCallId: string, infoOverride?: Partial<ActiveCallData>) => Promise<void>;
  /** End the call on air, or (with an id) end a specific call this account is handling. */
  endActiveCall: (callId?: string) => Promise<void>;
  declineCall: (callId: string) => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// The Agora web SDK is ~1.5 MB (405 KB compressed). Importing it at the top made EVERY user download it on the
// login page, including roles that never take a call. It is loaded on demand and cached; for the one role that
// takes calls it is warmed up right after login, so "Accept" is not delayed.
let agoraModule: Promise<typeof import("agora-rtc-sdk-ng")> | null = null;
const loadAgora = async () => {
  agoraModule = agoraModule || import("agora-rtc-sdk-ng");
  return (await agoraModule).default;
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  const stationId = (user as any)?.stationId || "";
  // Only Media Station accounts take calls
  const canTakeCalls = user?.role === "media_station";

  // Warm up the SDK for the role that takes calls (idle, not blocking the first paint)
  useEffect(() => {
    if (canTakeCalls) void loadAgora().catch(() => undefined);
  }, [canTakeCalls]);

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
  const remoteLeftTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingRef = useRef(false);
  /** True while accept/switch is running (blocks double clicks). */
  const isTakingCallRef = useRef(false);
  /** The call we are switching AWAY from; its call-ended / user-left events are expected and ignored. */
  const switchingFromCallIdRef = useRef<string | null>(null);

  activeCallRef.current = activeCall;

  // ─── RTK Query Mutations & Queries ──────────────────────────────────────
  // Only the waiting queue is needed here (history / KPIs have their own query on the Calls page)
  const { data: stationCallsData, refetch: refetchCalls } = useGetStationCallsQuery(
    { stationId, status: "queued", page: 1, limit: 50 },
    { skip: !stationId || !canTakeCalls },
  );

  const [acceptCallMutation] = useAcceptCallMutation();
  const [endCallMutation, { isLoading: isEndingMutation }] = useEndCallMutation();
  const [rejectCallMutation] = useRejectCallMutation();
  const [renewTokenMutation] = useRenewCallTokenMutation();
  // The Agora handler below is created once per call; the ref gives it the current mutation
  const renewTokenRef = useRef(renewTokenMutation);
  renewTokenRef.current = renewTokenMutation;

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
  const clearRemoteLeftTimer = useCallback(() => {
    if (remoteLeftTimerRef.current) {
      clearTimeout(remoteLeftTimerRef.current);
      remoteLeftTimerRef.current = null;
    }
  }, []);

  /**
   * Leave the current Agora channel.
   * The client / microphone references are detached FIRST, so a leave that is still running can
   * never wipe out the client of a call we joined meanwhile (that race made the UI show "no call"
   * while the microphone was still live).
   * With keepMic the microphone track stays open and is re-used for the next caller.
   */
  const leaveAgora = useCallback(async (options?: { keepMic?: boolean }) => {
    const keepMic = Boolean(options?.keepMic);
    const client = clientRef.current;
    const track = localAudioTrackRef.current;

    clearRemoteLeftTimer();
    clientRef.current = null;
    if (!keepMic) localAudioTrackRef.current = null;

    try {
      if (client) {
        client.removeAllListeners();
        if (keepMic && track) {
          await client.unpublish([track]).catch(() => undefined);
        }
        await client.leave();
      }
      if (!keepMic && track) {
        track.stop();
        track.close();
      }
    } catch (err) {
      console.warn("[CallContext] Error leaving Agora:", err);
    } finally {
      if (!keepMic) {
        setIsInCall(false);
        setIsMuted(false);
      }
    }
  }, [clearRemoteLeftTimer]);

  /** Server said the call is over (caller hung up, timeout, show ended, switched…): local clean-up only. */
  const handleServerEnded = useCallback(
    async (data: { callId: string; reason?: string; message?: string }) => {
      if (data.callId === switchingFromCallIdRef.current) return; // expected while switching
      const current = activeCallRef.current;
      if (!current || current.callId !== data.callId) return;
      if (isEndingRef.current) return;

      isEndingRef.current = true;
      try {
        toast.info(
          data.reason === "show_ended"
            ? "The show has ended. The call was ended."
            : data.message || "Call ended.",
        );
        await leaveAgora();
        setActiveCall(null);
      } finally {
        isEndingRef.current = false;
      }
    },
    [leaveAgora],
  );

  /**
   * The caller left the audio channel. The server does not know yet, so tell it —
   * otherwise the call stays "answered", the operator stays "on call" and the caller
   * cannot call again. /call/end is idempotent, so a second request is harmless.
   */
  const handleRemoteLeft = useCallback(
    async (callId: string) => {
      if (callId === switchingFromCallIdRef.current) return;
      if (activeCallRef.current?.callId !== callId) return;
      if (isEndingRef.current) return;

      isEndingRef.current = true;
      try {
        toast.info("The caller left. Call ended.");
        await endCallMutation(callId).unwrap().catch((err: unknown) => {
          console.warn("[CallContext] Could not confirm call end with server:", err);
        });
        await leaveAgora();
        setActiveCall(null);
        refetchCalls();
      } finally {
        isEndingRef.current = false;
      }
    },
    [endCallMutation, leaveAgora, refetchCalls],
  );

  // Latest handlers for the long-lived socket subscriptions below
  const handlersRef = useRef({ handleServerEnded });
  handlersRef.current = { handleServerEnded };

  // Real-time socket listeners for incoming / removed / ended calls
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
    });

    const unsubEnded = subscribeToCallEnded((data) => {
      handlersRef.current.handleServerEnded(data);
    });

    return () => {
      unsubIncoming();
      unsubRemoved();
      unsubEnded();
    };
  }, []);

  // Release the microphone if the provider goes away (logout, navigation away from the app shell)
  useEffect(() => {
    return () => {
      void leaveAgora();
    };
  }, [leaveAgora]);

  /** Join the Agora channel of `callId`. Re-uses the open microphone track when there is one. */
  const joinAgoraChannel = useCallback(
    async (callId: string, token: string, channelName: string, operatorUid: number | string) => {
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

      // Never keep two clients alive
      if (clientRef.current) {
        await leaveAgora({ keepMic: true });
      }

      const AgoraRTC = await loadAgora();
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (remoteUser, mediaType) => {
        if (clientRef.current !== client) return;
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "audio") {
          try {
            remoteUser.audioTrack?.setVolume(100);
            remoteUser.audioTrack?.play();
          } catch (playErr) {
            console.warn("[CallContext] Remote audio playback warning:", playErr);
          }
        }
      });

      client.on("user-unpublished", (remoteUser, mediaType) => {
        if (mediaType === "audio") {
          remoteUser.audioTrack?.stop();
        }
      });

      // The caller came back (network blip) — cancel the pending "caller left"
      client.on("user-joined", () => {
        clearRemoteLeftTimer();
      });

      client.on("user-left", (_remoteUser, reason) => {
        if (clientRef.current !== client) return; // stale client from a previous call
        clearRemoteLeftTimer();
        if (reason === "ServerTimeOut") {
          // Connection dropped: give the caller a few seconds to come back
          remoteLeftTimerRef.current = setTimeout(() => {
            void handleRemoteLeft(callId);
          }, REMOTE_RECONNECT_GRACE_MS);
        } else {
          void handleRemoteLeft(callId);
        }
      });

      // Agora tells us 30 s before the one-hour token runs out. Without a new token a long call is cut.
      client.on("token-privilege-will-expire", async () => {
        try {
          const res: any = await renewTokenRef.current(callId).unwrap();
          const newToken = res?.data?.token as string | undefined;
          if (newToken) await client.renewToken(newToken);
        } catch (err) {
          console.warn("[CallContext] Could not renew the Agora token:", err);
          toast.error("The call connection will expire soon. If audio stops, end the call and accept it again.");
        }
      });

      client.on("connection-state-change", (curState) => {
        if (curState === "DISCONNECTED") {
          console.warn("[CallContext] Agora connection state: DISCONNECTED");
        }
      });

      await client.join(AGORA_APP_ID, channelName, token || null, operatorUid);

      let track = localAudioTrackRef.current;
      if (!track) {
        track = await (await loadAgora()).createMicrophoneAudioTrack({
          encoderConfig: "high_quality_stereo",
          AEC: true,
          ANS: true,
          AGC: true,
        });
        track.setVolume(100);
        localAudioTrackRef.current = track;
      }
      await client.publish([track]);

      setIsInCall(true);
      // Show the real state of the microphone (a muted mic stays muted across a switch)
      setIsMuted(track.muted);
    },
    [leaveAgora, clearRemoteLeftTimer, handleRemoteLeft],
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

  // ─── Actions: take a caller (accept, or switch when already on air) ────
  const takeCall = useCallback(
    async (callId: string, infoOverride?: Partial<ActiveCallData>) => {
      if (isTakingCallRef.current) return;
      isTakingCallRef.current = true;
      setAcceptingId(callId);

      const previousCallId = activeCallRef.current?.callId ?? null;
      let serverAccepted = false;

      // From the moment we ask the server, events about the call we are leaving are expected
      // (the old caller's app disconnects as soon as the server ends that call).
      if (previousCallId && previousCallId !== callId) {
        switchingFromCallIdRef.current = previousCallId;
      }

      try {
        // Cheap local checks first — nothing on air is touched yet
        await ensureMicrophonePermission();

        // 1) Ask the SERVER first. If the caller already left / was taken, this throws and the
        //    caller currently on air is left completely untouched.
        const response = await acceptCallMutation(callId).unwrap();
        const resData = (response as any)?.data;
        serverAccepted = true;

        if (!resData?.token || !resData?.channelName || !resData?.operatorUid) {
          throw new Error("Invalid call credentials from server.");
        }

        setRealtimeQueue((prev) => prev.filter((c) => c._id !== callId && c.callId !== callId));

        const queueMatch = realtimeQueue.find((c) => c._id === callId || c.callId === callId);
        const startedByObj = typeof queueMatch?.startedBy === "object" ? queueMatch.startedBy : undefined;
        const callerName =
          infoOverride?.callerName || queueMatch?.callerName || startedByObj?.fullName || "Listener";
        const callerPhone =
          infoOverride?.callerPhone || queueMatch?.callerPhone || startedByObj?.phone || "";
        const callerAvatar =
          infoOverride?.callerAvatar || queueMatch?.callerAvatar || startedByObj?.avatar || "";
        const showName = infoOverride?.showName || queueMatch?.showName || "";

        // 2) Leave the previous channel (microphone stays open for the next caller)
        if (clientRef.current) {
          await leaveAgora({ keepMic: true });
        }

        setActiveCall({
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
        });

        // 3) Join the new caller's channel
        await joinAgoraChannel(callId, resData.token, resData.channelName, resData.operatorUid);

        toast.success(
          previousCallId && previousCallId !== callId
            ? `Switched live to ${callerName}!`
            : `Connected to ${callerName}!`,
        );
      } catch (err: any) {
        toast.error(err?.data?.message || err?.message || "Failed to connect call.");

        if (serverAccepted) {
          // The server already moved to this caller but the audio could not be joined:
          // end it properly instead of leaving a ghost call on air.
          await endCallMutation(callId).unwrap().catch(() => undefined);
          await leaveAgora();
          setActiveCall(null);
        }
        refetchCalls();
      } finally {
        switchingFromCallIdRef.current = null;
        isTakingCallRef.current = false;
        setAcceptingId(null);
      }
    },
    [
      ensureMicrophonePermission,
      acceptCallMutation,
      endCallMutation,
      joinAgoraChannel,
      leaveAgora,
      realtimeQueue,
      refetchCalls,
    ],
  );

  // ─── Actions: End Call ─────────────────────────────────────────────────
  const endActiveCall = useCallback(
    async (callIdOverride?: string) => {
      // onClick={endActiveCall} would pass a click event here — only accept a real id
      const explicitId = typeof callIdOverride === "string" ? callIdOverride : undefined;
      const callId = explicitId ?? activeCallRef.current?.callId;
      if (!callId) return;

      const isOnAirCall = activeCallRef.current?.callId === callId;
      // The server will also push call-ended for this call: don't handle it a second time
      if (isOnAirCall) isEndingRef.current = true;
      try {
        // Tell the server first — it notifies the caller and updates the queue / dashboards
        await endCallMutation(callId).unwrap();
        toast.success("Call ended.");
      } catch (err: any) {
        console.warn("[CallContext] End call API notice:", err);
        toast.error(err?.data?.message || "Could not confirm the call end with the server. Retrying…");
        // One quiet retry so the server does not keep a ghost call
        setTimeout(() => {
          void endCallMutation(callId).unwrap().catch(() => undefined);
        }, 3000);
      } finally {
        if (isOnAirCall) {
          // Always release the microphone, even when the API call failed
          await leaveAgora();
          setActiveCall(null);
          isEndingRef.current = false;
        }
        refetchCalls();
      }
    },
    [endCallMutation, leaveAgora, refetchCalls],
  );

  // ─── Actions: Decline Waiting Call ─────────────────────────────────────
  const declineCall = useCallback(
    async (callId: string) => {
      setDecliningId(callId);
      try {
        setRealtimeQueue((prev) => prev.filter((c) => c._id !== callId && c.callId !== callId));
        await rejectCallMutation(callId).unwrap();
        toast.info("Call declined. Credit refunded to the caller.");
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
          const localAudio = await (await loadAgora()).createMicrophoneAudioTrack();
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
      isEnding: isEndingMutation,
      toggleMute,
      acceptCall: takeCall,
      switchCall: takeCall,
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
      takeCall,
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
