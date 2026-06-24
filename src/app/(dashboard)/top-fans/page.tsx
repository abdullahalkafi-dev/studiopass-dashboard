"use client";

import dynamic from "next/dynamic";

const TopFansContent = dynamic(() => import("@/components/top-fans-content"), { ssr: false });

export default function TopFansPage() {
  return <TopFansContent />;
}
