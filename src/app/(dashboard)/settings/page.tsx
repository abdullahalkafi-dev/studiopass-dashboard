"use client";

import dynamic from "next/dynamic";

const SettingsContent = dynamic(() => import("@/components/settings-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading settings...</div>
    </div>
  ),
});

export default function SettingsPage() {
  return <SettingsContent />;
}
