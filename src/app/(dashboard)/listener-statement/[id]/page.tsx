"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const StatementDetailContent = dynamic(() => import("@/components/statement-detail-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  ),
});

export default function StatementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <StatementDetailContent id={id} />;
}
