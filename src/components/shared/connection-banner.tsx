"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useSocketStatus } from "@/hooks/use-socket";

/**
 * Tells the operator when live data may be out of date.
 *
 * Without it a studio screen whose connection dropped keeps showing the last messages and call queue as if
 * nothing happened, which for a live broadcast is the worst failure: nobody knows a message is missing.
 * The socket must be down for a few seconds before this appears, so a quick reconnect shows nothing.
 */
export function ConnectionBanner() {
  const socketStatus = useSocketStatus();
  const [browserOnline, setBrowserOnline] = useState(true);
  const [socketDownLongEnough, setSocketDownLongEnough] = useState(false);

  useEffect(() => {
    setBrowserOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    const goOnline = () => setBrowserOnline(true);
    const goOffline = () => setBrowserOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (socketStatus === "connected") {
      setSocketDownLongEnough(false);
      return;
    }
    const timer = setTimeout(() => setSocketDownLongEnough(true), 8000);
    return () => clearTimeout(timer);
  }, [socketStatus]);

  if (browserOnline && !socketDownLongEnough) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-2 bg-red-600 px-4 py-1.5 text-xs font-medium text-white"
    >
      <WifiOff size={14} />
      {!browserOnline
        ? "You are offline. What you see may be out of date."
        : "Live updates are disconnected. Reconnecting… new messages and calls may not appear until it is back."}
    </div>
  );
}
