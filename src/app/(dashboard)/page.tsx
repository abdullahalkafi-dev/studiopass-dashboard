"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/store/hooks";
import { getRoleHomePath } from "@/lib/role-home";

const DashboardContent = dynamic(() => import("@/components/dashboard-content"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading dashboard...</div>
    </div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const role = useAppSelector((state) => state.auth.user?.role);

  // Presenter must not use root `/` — studio ops / revenue live here
  useEffect(() => {
    if (role === "presenter") {
      router.replace(getRoleHomePath(role));
    }
  }, [role, router]);

  if (role === "presenter") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Redirecting to My Show…</div>
      </div>
    );
  }

  return <DashboardContent />;
}
