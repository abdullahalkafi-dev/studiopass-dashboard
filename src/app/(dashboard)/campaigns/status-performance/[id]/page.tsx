"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const StatusPerformanceDetails = dynamic(() => import("@/components/status-performance-details"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading campaign details...</div>
    </div>
  ),
});

export default function CampaignDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  return <StatusPerformanceDetails id={id} />;
}
