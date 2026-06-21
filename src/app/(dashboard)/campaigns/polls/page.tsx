"use client";

import dynamic from "next/dynamic";

const PollsContent = dynamic(() => import("@/components/polls-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading polls...</div>
    </div>
  ),
});

export default function PollsPage() {
  return <PollsContent />;
}
