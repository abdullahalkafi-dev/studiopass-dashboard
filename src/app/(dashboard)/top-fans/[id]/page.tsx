"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const FanDetailContent = dynamic(() => import("@/components/fan-detail-content"), { ssr: false });

export default function FanDetailPage() {
  const params = useParams();
  return <FanDetailContent id={params.id as string} />;
}
