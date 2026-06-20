"use client";

import dynamic from "next/dynamic";

const DashboardContent = dynamic(() => import("@/components/dashboard-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading dashboard...</div>
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardContent />;
}
