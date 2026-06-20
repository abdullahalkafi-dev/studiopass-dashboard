"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Wallet, FileText, Megaphone,
  Radio, MessageSquare, Database, BarChart3, Settings,
  Search, Bell, ChevronDown, ChevronRight,
} from "lucide-react";
import { DevBanner } from "./dev-banner";
import { RoleProvider } from "@/contexts/role-context";
import type { Role } from "@/lib/access/permissions";
import type { Category } from "@/lib/access/category";

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  partner_admin: "Partner Admin",
  station_admin: "Station Admin",
  media_station: "Media Station",
  presenter: "Presenter",
  customer_care: "Customer Care",
};

export type Page =
  | "dashboard"
  | "partner-admins" | "station-admins" | "media-stations-pg"
  | "presenters-pg" | "customer-care"
  | "radio-stations" | "tv-stations" | "channels" | "shows"
  | "messages-pg" | "mobile-money"
  | "listener-statement" | "status-posts" | "status-performance"
  | "reports" | "crm-pg" | "settings"
  | "station-management";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  minRole?: Role;
  roles?: Role[];
  children?: { id: string; label: string; href?: string; minRole?: Role }[];
}

const ROLE_HIERARCHY: Role[] = ["super_admin", "partner_admin", "station_admin", "customer_care", "media_station", "presenter"];

function canSee(minRole: Role | undefined, currentRole: Role): boolean {
  if (!minRole) return true;
  return ROLE_HIERARCHY.indexOf(currentRole) <= ROLE_HIERARCHY.indexOf(minRole);
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/" },
  {
    id: "users", label: "Users", icon: <Users size={18} />, minRole: "station_admin",
    children: [
      { id: "partner-admins", label: "Partner Admins", href: "/users/partner-admins", minRole: "super_admin" },
      { id: "station-admins", label: "Station Admins", href: "/users/station-admins", minRole: "partner_admin" },
      { id: "media-stations", label: "Media Stations", href: "/users/media-stations" },
      { id: "presenters", label: "Presenters", href: "/users/presenters" },
      { id: "customer-care", label: "Customer Care", href: "/users/customer-care", minRole: "partner_admin" },
    ],
  },
  { id: "mobile-money", label: "Mobile Money", icon: <Wallet size={18} />, href: "/mobile-money", roles: ["super_admin", "partner_admin", "customer_care"] },
  { id: "listener-statement", label: "Listener Statement", icon: <FileText size={18} />, href: "/listener-statement" },
  {
    id: "campaigns", label: "Campaigns", icon: <Megaphone size={18} />,
    children: [
      { id: "status-posts", label: "Status Posts", href: "/campaigns/status-posts" },
      { id: "status-performance", label: "Status Performance", href: "/campaigns/status-performance" },
    ],
  },
  {
    id: "station-management", label: "Station Management", icon: <Radio size={18} />,
    children: [
      { id: "radio-stations", label: "Radio Stations", href: "/station-management/radio" },
      { id: "tv-stations", label: "TV Stations", href: "/station-management/tv" },
      { id: "channels", label: "Channels", href: "/station-management/channels" },
      { id: "shows", label: "Shows", href: "/station-management/shows" },
    ],
  },
  { id: "messages", label: "Messages", icon: <MessageSquare size={18} />, href: "/messages" },
  { id: "crm", label: "CRM", icon: <Database size={18} />, href: "/crm" },
  { id: "reports", label: "Reports", icon: <BarChart3 size={18} />, href: "/reports" },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

const PG_LABEL: Record<string, string> = {
  "/": "Dashboard",
  "/reports": "Reports",
  "/billing": "Billing",
  "/mobile-money": "Mobile Money",
  "/listener-statement": "Listener Statement",
  "/messages": "Messages",
  "/crm": "CRM",
  "/station-management/create": "Create Station",
  "/users/partner-admins": "Partner Admins",
  "/users/partner-admins/create": "Create Partner Admin",
  "/users/station-admins": "Station Admins",
  "/users/station-admins/create": "Create Station Admin",
  "/users/media-stations": "Media Stations",
  "/users/media-stations/create": "Create Media Station",
  "/users/presenters": "Presenters",
  "/users/presenters/create": "Create Presenter",
};

const PG_CRUMB: Record<string, string> = {
  "/": "Dashboard",
  "/reports": "Dashboard / Reports",
  "/billing": "Dashboard / Billing",
  "/mobile-money": "Dashboard / Mobile Money",
  "/listener-statement": "Dashboard / Listener Statement",
  "/messages": "Dashboard / Messages",
  "/crm": "Dashboard / CRM",
  "/station-management/create": "Dashboard / Station Management / Create",
  "/users/partner-admins": "Dashboard / Users / Partner Admins",
  "/users/partner-admins/create": "Dashboard / Users / Partner Admins / Create",
  "/users/station-admins": "Dashboard / Users / Station Admins",
  "/users/station-admins/create": "Dashboard / Users / Station Admins / Create",
  "/users/media-stations": "Dashboard / Users / Media Stations",
  "/users/media-stations/create": "Dashboard / Users / Media Stations / Create",
  "/users/presenters": "Dashboard / Users / Presenters",
  "/users/presenters/create": "Dashboard / Users / Presenters / Create",
};

function Sidebar({ pathname, role }: { pathname: string; role: Role }) {
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    return canSee(item.minRole, role);
  }).map((item) => ({
    ...item,
    children: item.children?.filter((c) => canSee(c.minRole, role)),
  }));

  const usersItem = visibleItems.find((item) => item.id === "users");
  const USER_HREFS = (usersItem?.children ?? []).map((c) => c.href).filter(Boolean) as string[];
  const STATION_HREFS = ["/station-management"];

  const initOpen: string[] = [];
  if (USER_HREFS.some((h) => pathname.startsWith(h))) initOpen.push("users");
  if (STATION_HREFS.some((h) => pathname.startsWith(h))) initOpen.push("station-management");
  if (pathname.startsWith("/campaigns")) initOpen.push("campaigns");

  const [open, setOpen] = useState<string[]>(initOpen);
  const tog = (id: string) => setOpen((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const isChildActive = (children: { href?: string }[]) =>
    children.some((c) => c.href && (pathname === c.href || pathname.startsWith(c.href + "/")));

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-border flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#02B2FF] flex items-center justify-center">
            <Radio size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">MediaHub</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{ROLE_LABEL[role]}</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-3">
        {visibleItems.map((item) => {
          const isActive = item.href ? pathname === item.href : false;
          const childActive = item.children ? isChildActive(item.children) : false;
          const isOpen = open.includes(item.id);
          const highlighted = isActive || childActive;
          return (
            <div key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                    highlighted ? "bg-[#EFF8FF] text-[#02B2FF]" : "text-slate-600 hover:bg-slate-50 hover:text-foreground"
                  }`}
                >
                  <span className={highlighted ? "text-[#02B2FF]" : "text-slate-400"}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
              ) : (
                <button
                  onClick={() => tog(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                    highlighted ? "bg-[#EFF8FF] text-[#02B2FF]" : "text-slate-600 hover:bg-slate-50 hover:text-foreground"
                  }`}
                >
                  <span className={highlighted ? "text-[#02B2FF]" : "text-slate-400"}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.children && (
                    <ChevronDown size={14} className={`transition-transform text-slate-400 ${isOpen ? "rotate-180" : ""}`} />
                  )}
                </button>
              )}
              {item.children && isOpen && (
                <div className="ml-8 mb-1">
                  {item.children.map((c) => (
                    <Link
                      key={c.id}
                      href={c.href || "#"}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                        c.href && pathname === c.href
                          ? "text-[#02B2FF] font-semibold bg-[#EFF8FF]/60"
                          : "text-slate-500 hover:text-foreground hover:bg-slate-50"
                      }`}
                    >
                      <ChevronRight size={12} className={c.href && pathname === c.href ? "text-[#02B2FF]" : "text-slate-300"} />
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
          <div className="w-7 h-7 rounded-full bg-[#02B2FF] flex items-center justify-center text-white text-xs font-bold">SA</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{ROLE_LABEL[role]}</div>
            <div className="text-[10px] text-muted-foreground truncate">admin@mediahub.com</div>
          </div>
          <ChevronDown size={12} className="text-slate-400" />
        </div>
      </div>
    </aside>
  );
}

function AppHeader({ pathname, role }: { pathname: string; role: Role }) {
  const label = PG_LABEL[pathname] || "Dashboard";
  const crumb = PG_CRUMB[pathname] || "Dashboard";
  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1">
        <h1 className="text-base font-bold text-foreground">{label}</h1>
        <p className="text-[11px] text-muted-foreground leading-none">{crumb}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 w-56">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input type="text" placeholder="Search anything..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full" />
        </div>
        <button className="relative w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-slate-200 transition-colors">
          <Bell size={15} className="text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        <button className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors">
          <div className="w-7 h-7 rounded-full bg-[#02B2FF] flex items-center justify-center text-white text-xs font-bold">SA</div>
          <div className="text-xs font-semibold text-foreground">{ROLE_LABEL[role]}</div>
          <ChevronDown size={12} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>("super_admin");
  const [category, setCategory] = useState<Category>("radio");

  return (
    <RoleProvider role={role}>
      <div className="flex h-screen overflow-hidden bg-background font-sans">
        <Sidebar pathname={pathname} role={role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader pathname={pathname} role={role} />
          <main className="flex-1 overflow-y-auto px-6 py-5">{children}</main>
        </div>
        <DevBanner role={role} category={category} onRoleChange={setRole} onCategoryChange={setCategory} />
      </div>
    </RoleProvider>
  );
}
