"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ConnectionState,
} from "agora-rtc-sdk-ng";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

interface UseAgoraCallOptions {
  onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  onUserLeft?: (user: IAgoraRTCRemoteUser) => void;
  onError?: (error: Error) => void;
  onLeave?: () => Promise<void>;
  onConnectionLost?: () => void;
}

export function useAgoraCall(options: UseAgoraCallOptions = {}) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const optionsRef = useRef(options);
  const endedRef = useRef(false);
  const joiningRef = useRef(false);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInCallRef = useRef(false);
  optionsRef.current = options;

  // Keep isInCallRef in sync with state
  useEffect(() => {
    isInCallRef.current = isInCall;
  }, [isInCall]);

  useEffect(() => {
    return () => {
      // Clear disconnect timer on unmount
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      // Use ref for cleanup check (state is stale in [] deps cleanup)
      if (isInCallRef.current && !endedRef.current && !joiningRef.current) {
        endedRef.current = true;
        optionsRef.current.onLeave?.();
      }
      // Force leave Agora channel — fire-and-forget with catch to prevent unhandled rejection
      try {
        localAudioTrackRef.current?.close();
        localAudioTrackRef.current = null;
        clientRef.current?.leave().catch(() => {});
        clientRef.current = null;
      } catch {}
    };
  }, []);

  const joinChannel = useCallback(
    async (token: string, channelName: string, uid: number | string) => {
      if (!AGORA_APP_ID) {
        optionsRef.current.onError?.(new Error("Agora App ID not configured"));
        return;
      }

      if (joiningRef.current) return;
      joiningRef.current = true;

      try {
        endedRef.current = false;
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          console.log("[Agora] user-published:", user.uid, mediaType);
          await client.subscribe(user, mediaType);
          console.log("[Agora] subscribed, audioTrack:", user.audioTrack);
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
          setRemoteUsers((prev) => {
            const exists = prev.find((u) => u.uid === user.uid);
            if (exists) return prev;
            return [...prev, user];
          });
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "audio") {
            user.audioTrack?.stop();
          }
        });

        client.on("user-left", (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          optionsRef.current.onUserLeft?.(user);
        });

        client.on("user-joined", (user) => {
          optionsRef.current.onUserJoined?.(user);
        });

        // Handle connection state changes — attempt reconnect before giving up
        client.on("connection-state-change", (curState, prevState, reason) => {
          console.log(`[Agora] Connection state: ${prevState} → ${curState} (reason: ${reason})`);
          if (curState === "DISCONNECTED" && prevState === "CONNECTED") {
            console.warn("[Agora] Connection lost, waiting for auto-reconnect...");
            // Give Agora 10 seconds to auto-reconnect before notifying
            disconnectTimerRef.current = setTimeout(() => {
              if (clientRef.current && !endedRef.current) {
                console.error("[Agora] Connection lost for 10s, notifying");
                optionsRef.current.onConnectionLost?.();
              }
              disconnectTimerRef.current = null;
            }, 10000);
          } else if (curState === "CONNECTED") {
            // Reconnected — cancel disconnect timer
            if (disconnectTimerRef.current) {
              clearTimeout(disconnectTimerRef.current);
              disconnectTimerRef.current = null;
            }
          }
        });

        await client.join(AGORA_APP_ID, channelName, token || null, uid);

        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = localAudioTrack;
        await client.publish([localAudioTrack]);

        setIsInCall(true);
      } catch (error) {
        console.error("[Agora] Failed to join channel:", error);
        optionsRef.current.onError?.(error as Error);
        await leaveChannel();
        throw error;
      } finally {
        joiningRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const leaveChannel = useCallback(async () => {
    try {
      // Clear disconnect timer
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }

      localAudioTrackRef.current?.close();
      localAudioTrackRef.current = null;

      await clientRef.current?.leave();
      clientRef.current = null;

      setRemoteUsers([]);
      setIsInCall(false);
      setIsMuted(false);
    } catch (error) {
      console.error("[Agora] Error leaving channel:", error);
      // Force cleanup even if leave() threw
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      clientRef.current = null;
      setRemoteUsers([]);
      setIsInCall(false);
      setIsMuted(false);
    }
  }, []);

  const endCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    await leaveChannel();
    await optionsRef.current.onLeave?.();
  }, [leaveChannel]);

  const toggleMute = useCallback(async () => {
    if (localAudioTrackRef.current) {
      const newMuted = !isMuted;
      await localAudioTrackRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  return {
    joinChannel,
    leaveChannel,
    endCall,
    toggleMute,
    isInCall,
    isMuted,
    remoteUsers,
  };
}
