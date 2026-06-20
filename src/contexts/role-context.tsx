"use client";

import { createContext, useContext } from "react";
import type { Role } from "@/lib/access/permissions";

const RoleContext = createContext<Role>("super_admin");

export function useRole() {
  return useContext(RoleContext);
}

export function RoleProvider({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
  );
}
