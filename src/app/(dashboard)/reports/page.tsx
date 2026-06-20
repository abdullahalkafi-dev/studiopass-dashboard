"use client";

import dynamic from "next/dynamic";

const ReportsContent = dynamic(() => import("@/components/reports-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading reports...</div>
    </div>
  ),
});

export default function ReportsPage() {
  return <ReportsContent />;
}
