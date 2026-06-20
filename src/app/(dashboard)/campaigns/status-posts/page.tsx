"use client";

import dynamic from "next/dynamic";

const StatusPostsContent = dynamic(() => import("@/components/status-posts-content"), { ssr: false });

export default function StatusPostsPage() {
  return <StatusPostsContent />;
}
