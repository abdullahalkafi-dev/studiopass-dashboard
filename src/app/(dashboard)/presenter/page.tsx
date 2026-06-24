"use client";

import dynamic from "next/dynamic";

const PresenterMyShowContent = dynamic(() => import("@/components/presenter-my-show-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  ),
});

export default function PresenterMyShowPage() {
  return <PresenterMyShowContent />;
}
