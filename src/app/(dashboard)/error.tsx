"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Catches an error while a dashboard page renders; the sidebar and header stay usable
export default function DashboardPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard page error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle size={32} className="mb-3 text-amber-500" />
      <h2 className="text-lg font-bold text-foreground">This page could not be shown</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Something went wrong. You can try again, or use the menu to go somewhere else.
      </p>
      <button
        onClick={reset}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#02B2FF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0092D8]"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}
