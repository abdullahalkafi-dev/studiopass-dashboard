"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const PollsDetails = dynamic(() => import("@/components/polls-details"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading poll details...</div>
    </div>
  ),
});

export default function PollDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  return <PollsDetails id={id} />;
}
