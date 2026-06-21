"use client";

import dynamic from "next/dynamic";

const CrmContent = dynamic(() => import("@/components/crm-content"), { ssr: false });

export default function CrmPage() {
  return <CrmContent />;
}
