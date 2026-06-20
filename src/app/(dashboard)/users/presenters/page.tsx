"use client";

import dynamic from "next/dynamic";

const PresentersContent = dynamic(() => import("@/components/presenters-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading presenters...</div>
    </div>
  ),
});

export default function PresentersPage() {
  return <PresentersContent />;
}
