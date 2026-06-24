"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/login");
    }
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated || !token) return null;
  return <>{children}</>;
}
