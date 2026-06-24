"use client";

import dynamic from "next/dynamic";

const CallsContent = dynamic(() => import("@/components/calls-content"), { ssr: false });

export default function CallsPage() {
  return <CallsContent />;
}
