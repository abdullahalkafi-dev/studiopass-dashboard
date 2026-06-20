"use client";

import dynamic from "next/dynamic";

const CustomerCareContent = dynamic(() => import("@/components/customer-care-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading customer care...</div>
    </div>
  ),
});

export default function CustomerCarePage() {
  return <CustomerCareContent />;
}
