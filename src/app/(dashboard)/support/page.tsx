"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";

const SupportInbox = dynamic(() => import("@/components/support/support-inbox"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-sm text-muted-foreground">Loading Support Inbox...</div>
  ),
});

export default function SupportPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (user && user.role !== "customer_care") {
      toast.error("Access Denied: Only Customer Care agents can access Support Tickets");
      router.replace("/");
    }
  }, [user, router]);

  if (!user || user.role !== "customer_care") {
    return null;
  }

  return <SupportInbox />;
}
