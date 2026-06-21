"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const ShowDetailContent = dynamic(() => import("@/components/show-detail-content"), { ssr: false });

export default function ShowDetailPage() {
  const params = useParams();
  return <ShowDetailContent id={params.id as string} />;
}
