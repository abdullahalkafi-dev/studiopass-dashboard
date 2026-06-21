"use client";

import dynamic from "next/dynamic";

const TvStationsContent = dynamic(() => import("@/components/tv-stations-content"), { ssr: false });

export default function TvStationsPage() {
  return <TvStationsContent />;
}
