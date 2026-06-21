"use client";

import dynamic from "next/dynamic";

const ShowsContent = dynamic(() => import("@/components/shows-content"), { ssr: false });

export default function ShowsPage() {
  return <ShowsContent />;
}
