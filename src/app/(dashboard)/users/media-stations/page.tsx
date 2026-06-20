"use client";

import dynamic from "next/dynamic";

const MediaStationsContent = dynamic(() => import("@/components/media-stations-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading media stations...</div>
    </div>
  ),
});

export default function MediaStationsPage() {
  return <MediaStationsContent />;
}
