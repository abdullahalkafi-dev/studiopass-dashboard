"use client";

import dynamic from "next/dynamic";

const PollsCreateContent = dynamic(() => import("@/components/polls-create-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading poll form...</div>
    </div>
  ),
});

export default function PollsCreatePage() {
  return <PollsCreateContent />;
}
