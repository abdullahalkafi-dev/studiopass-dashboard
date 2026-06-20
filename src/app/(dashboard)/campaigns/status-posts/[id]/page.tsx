"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const StatusPostDetailContent = dynamic(() => import("@/components/status-post-detail-content"), { ssr: false });

export default function StatusPostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <StatusPostDetailContent id={id} />;
}
