"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const InteractionHistoryContent = dynamic(() => import("@/components/interaction-history-content"), { ssr: false });

export default function InteractionHistoryPage() {
  const params = useParams();
  return <InteractionHistoryContent listenerId={params.id as string} />;
}
