"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Role } from "@/lib/access/permissions";
import type { Category } from "@/lib/access/category";

export interface DevSession {
  role: Role;
  category: Category;
  /** Scoped entity IDs for mock data filtering */
  partnerId?: string;
  stationId?: string;
}

const DevSessionContext = createContext<DevSession>({
  role: "super_admin",
  category: "radio",
});

export function useDevSession() {
  return useContext(DevSessionContext);
}

export function DevSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DevSession>({
    role: "super_admin",
    category: "radio",
  });

  return (
    <DevSessionContext.Provider value={session}>
      {children}
    </DevSessionContext.Provider>
  );
}

export function useDevSessionActions() {
  const [session, setSession] = useState<DevSession>({
    role: "super_admin",
    category: "radio",
  });

  const setRole = (role: Role) => setSession((s) => ({ ...s, role }));
  const setCategory = (category: Category) => setSession((s) => ({ ...s, category }));
  const setScope = (scope: { partnerId?: string; stationId?: string }) =>
    setSession((s) => ({ ...s, ...scope }));

  return { session, setRole, setCategory, setScope };
}
