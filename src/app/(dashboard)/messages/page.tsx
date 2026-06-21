"use client";

import dynamic from "next/dynamic";

const MessagesContent = dynamic(() => import("@/components/messages-content"), { ssr: false });

export default function MessagesPage() {
  return <MessagesContent />;
}
