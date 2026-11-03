"use client";

import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface QueryStateProps {
  /** First load, nothing to show yet (RTK Query `isLoading`) */
  isLoading: boolean;
  /** The request failed (RTK Query `isError`) */
  isError: boolean;
  /** Whether there is data to show, even stale data */
  hasData: boolean;
  /** Called by the Retry button (RTK Query `refetch`) */
  onRetry?: () => void;
  /** Shown while loading; default is a few grey lines */
  skeleton?: ReactNode;
  /** Message shown in the error card */
  errorMessage?: string;
  children: ReactNode;
}

/**
 * Decides between skeleton, error and content so a screen never shows an empty table for a failed request.
 * Data that is already on screen always wins: a failed refresh keeps it and adds a small notice instead.
 */
export function QueryState({
  isLoading,
  isError,
  hasData,
  onRetry,
  skeleton,
  errorMessage = "We couldn't load this. Check your connection and try again.",
  children,
}: QueryStateProps) {
  if (hasData) {
    return (
      <>
        {isError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle size={14} />
            <span className="flex-1">Couldn&apos;t refresh. Showing the last loaded data.</span>
            {onRetry && (
              <button onClick={onRetry} className="font-semibold underline underline-offset-2">
                Retry
              </button>
            )}
          </div>
        )}
        {children}
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        {skeleton ?? (
          <div className="space-y-3" role="status" aria-label="Loading">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <AlertTriangle size={32} className="mb-3 text-amber-500" />
        <p className="max-w-sm text-sm text-muted-foreground">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#02B2FF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0092D8]"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
