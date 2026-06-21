"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const MessageDetailContent = dynamic(() => import("@/components/message-detail-content"), { ssr: false });

export default function MessageDetailPage() {
  const params = useParams();
  return <MessageDetailContent id={params.id as string} />;
}
