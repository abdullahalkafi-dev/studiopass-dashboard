"use client";

import dynamic from "next/dynamic";

const MobileMoneyContent = dynamic(() => import("@/components/mobile-money-content"), { ssr: false });

export default function MobileMoneyPage() {
  return <MobileMoneyContent />;
}
