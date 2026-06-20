"use client";

import dynamic from "next/dynamic";

const StatusPerformanceContent = dynamic(() => import("@/components/status-performance-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading status performance...</div>
    </div>
  ),
});

export default function StatusPerformancePage() {
  return <StatusPerformanceContent />;
}
