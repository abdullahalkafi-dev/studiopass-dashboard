"use client";

import { createContext, useContext } from "react";
import { useAppSelector } from "@/store/hooks";
import type { Role } from "@/lib/access/permissions";

const RoleContext = createContext<Role>("super_admin");

export function useRole() {
  const authRole = useAppSelector((state) => state.auth.user?.role);
  return (authRole as Role) ?? "super_admin";
}

export function RoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = useRole();
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}
