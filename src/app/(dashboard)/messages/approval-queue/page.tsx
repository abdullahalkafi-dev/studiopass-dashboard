"use client";

import dynamic from "next/dynamic";

const ApprovalQueueContent = dynamic(() => import("@/components/approval-queue-content"), { ssr: false });

export default function ApprovalQueuePage() {
  return <ApprovalQueueContent />;
}
