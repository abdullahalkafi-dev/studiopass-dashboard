"use client";

import dynamic from "next/dynamic";

const StationAdminsContent = dynamic(() => import("@/components/station-admins-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading station admins...</div>
    </div>
  ),
});

export default function StationAdminsPage() {
  return <StationAdminsContent />;
}
