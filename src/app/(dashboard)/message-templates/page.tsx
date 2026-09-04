"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";

const MessageTemplatesContent = dynamic(() => import("@/components/message-templates-content"), { ssr: false });

export default function MessageTemplatesPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (user && user.role === "media_station") {
      toast.error("Access Denied: Media station accounts cannot access message templates");
      router.replace("/");
    }
  }, [user, router]);

  if (user?.role === "media_station") {
    return null;
  }

  return <MessageTemplatesContent />;
}
