"use client";

import dynamic from "next/dynamic";

const StationApiContent = dynamic(() => import("@/components/station-api-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading Station API...</div>
    </div>
  ),
});

export default function StationApiPage() {
  return <StationApiContent />;
}
