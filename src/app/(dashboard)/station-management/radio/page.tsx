"use client";

import dynamic from "next/dynamic";

const RadioStationsContent = dynamic(() => import("@/components/radio-stations-content"), { ssr: false });

export default function RadioStationsPage() {
  return <RadioStationsContent />;
}
