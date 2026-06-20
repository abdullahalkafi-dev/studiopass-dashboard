"use client";

import { useState } from "react";
import { ChevronDown, Eye, Shield, Radio, Tv, Music } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/access/permissions";
import type { Category } from "@/lib/access/category";

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: "super_admin", label: "Super Admin", color: "bg-emerald-100 text-emerald-700" },
  { value: "partner_admin", label: "Partner Admin", color: "bg-blue-100 text-blue-700" },
  { value: "customer_care", label: "Customer Care", color: "bg-purple-100 text-purple-700" },
  { value: "station_admin", label: "Station Admin", color: "bg-amber-100 text-amber-700" },
  { value: "media_station", label: "Media Station", color: "bg-rose-100 text-rose-700" },
  { value: "presenter", label: "Presenter", color: "bg-cyan-100 text-cyan-700" },
];

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "radio", label: "Radio", icon: <Radio className="h-3.5 w-3.5" /> },
  { value: "tv", label: "TV", icon: <Tv className="h-3.5 w-3.5" /> },
  { value: "channels", label: "Channels", icon: <Music className="h-3.5 w-3.5" /> },
];

interface DevRoleSwitcherProps {
  role: Role;
  category: Category;
  onRoleChange: (role: Role) => void;
  onCategoryChange: (category: Category) => void;
}

export function DevRoleSwitcher({
  role,
  category,
  onRoleChange,
  onCategoryChange,
}: DevRoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const currentRole = ROLES.find((r) => r.value === role);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${currentRole?.color}`}>
          {currentRole?.label}
        </Badge>
        {(role === "station_admin" || role === "media_station" || role === "presenter") && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {category.toUpperCase()}
          </Badge>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 text-xs">
            <Shield className="h-3.5 w-3.5" />
            Dev Role Preview
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {ROLES.map((r) => (
          <DropdownMenuItem
            key={r.value}
            onClick={() => onRoleChange(r.value)}
            className="flex items-center gap-2 text-xs"
          >
            <div className={`w-2 h-2 rounded-full ${r.color.split(" ")[0]}`} />
            {r.label}
            {r.value === role && <span className="ml-auto text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
        {(role === "station_admin" || role === "media_station" || role === "presenter") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Category
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            {CATEGORIES.map((c) => (
              <DropdownMenuItem
                key={c.value}
                onClick={() => onCategoryChange(c.value)}
                className="flex items-center gap-2 text-xs"
              >
                {c.icon}
                {c.label}
                {c.value === category && <span className="ml-auto text-muted-foreground">✓</span>}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
