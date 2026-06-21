"use client";

import dynamic from "next/dynamic";

const ChannelsContent = dynamic(() => import("@/components/channels-content"), { ssr: false });

export default function ChannelsPage() {
  return <ChannelsContent />;
}
