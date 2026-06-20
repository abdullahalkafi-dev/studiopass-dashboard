"use client";

import dynamic from "next/dynamic";

const PartnerAdminsContent = dynamic(() => import("@/components/partner-admins-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading partner admins...</div>
    </div>
  ),
});

export default function PartnerAdminsPage() {
  return <PartnerAdminsContent />;
}
