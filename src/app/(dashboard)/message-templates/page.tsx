"use client";

import dynamic from "next/dynamic";

const MessageTemplatesContent = dynamic(() => import("@/components/message-templates-content"), { ssr: false });

export default function MessageTemplatesPage() {
  return <MessageTemplatesContent />;
}
