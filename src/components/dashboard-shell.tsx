"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Wallet, FileText, Megaphone,
  Radio, MessageSquare, Database, BarChart3, Settings,
  ChevronDown, ChevronRight, Phone, Star, LogOut,
  Sun, Moon, Code, CreditCard, Trophy, Headphones,
} from "lucide-react";
import { DevBanner } from "./dev-banner";
import NotificationPanel from "./notifications/notification-panel";
import { RoleProvider } from "@/contexts/role-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/features/auth/authSlice";
import { useSocket } from "@/hooks/use-socket";
import { useTheme } from "next-themes";
import { resolveUrl } from "@/lib/utils";
import { Avatar } from "@/components/shared/section-header";
import { useGetMyProfileQuery } from "@/features/user/userApi";
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
  children?: { id: string; label: string; href?: string; minRole?: Role; roles?: Role[] }[];
}

const ROLE_HIERARCHY: Role[] = ["super_admin", "partner_admin", "station_admin", "customer_care", "media_station", "presenter"];

function canSee(minRole: Role | undefined, currentRole: Role): boolean {
  if (!minRole) return true;
  return ROLE_HIERARCHY.indexOf(currentRole) <= ROLE_HIERARCHY.indexOf(minRole);
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/" },
  { id: "support-tickets", label: "Support Tickets", icon: <Headphones size={18} />, href: "/support", roles: ["customer_care"] },
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
  { id: "mobile-money", label: "Mobile Money", icon: <Wallet size={18} />, href: "/mobile-money", roles: ["super_admin", "partner_admin"] },
  { id: "listener-statement", label: "Listener Statement", icon: <FileText size={18} />, href: "/listener-statement", roles: ["super_admin", "partner_admin", "station_admin", "media_station", "presenter"] },
  {
    id: "campaigns", label: "Campaigns", icon: <Megaphone size={18} />, minRole: "station_admin",
    children: [
      { id: "status-posts", label: "Status Posts", href: "/campaigns/status-posts" },
      { id: "status-performance", label: "Status Performance", href: "/campaigns/status-performance" },
      { id: "polls", label: "Polls", href: "/campaigns/polls" },
    ],
  },
  { id: "challenges", label: "Challenges", icon: <Trophy size={18} />, href: "/channels/challenges", minRole: "station_admin" },
  { id: "channel-polls", label: "Channel Polls", icon: <BarChart3 size={18} />, href: "/channels/polls", minRole: "station_admin" },
  {
    id: "polls-direct", label: "Polls", icon: <BarChart3 size={18} />, href: "/campaigns/polls", roles: ["media_station"],
  },
  {
    id: "station-management", label: "Station Management", icon: <Radio size={18} />, minRole: "station_admin",
    children: [
      { id: "radio-stations", label: "Radio Stations", href: "/station-management/radio", minRole: "partner_admin" },
      { id: "tv-stations", label: "TV Stations", href: "/station-management/tv", minRole: "partner_admin" },
      { id: "channels", label: "Channels", href: "/station-management/channels", minRole: "partner_admin" },
      { id: "shows", label: "Shows", href: "/station-management/shows" },
    ],
  },
  { id: "messages", label: "Messages", icon: <MessageSquare size={18} />, roles: ["super_admin", "partner_admin", "station_admin", "media_station", "presenter"],
    children: [
      { id: "messages-all", label: "All Messages", href: "/messages" },
      { id: "approval-queue", label: "Approval Queue", href: "/messages/approval-queue", roles: ["station_admin", "media_station", "presenter"] },
      { id: "message-templates", label: "Message Templates", href: "/message-templates", roles: ["station_admin", "media_station", "presenter"] },
    ],
  },
  { id: "station-api", label: "Station API", icon: <Code size={18} />, href: "/station-api", roles: ["station_admin"] },
  { id: "crm", label: "CRM", icon: <Database size={18} />, href: "/crm", roles: ["super_admin", "partner_admin", "station_admin"] },
  { id: "disbursements", label: "Disbursements", icon: <CreditCard size={18} />, href: "/disbursements", minRole: "partner_admin" },
  { id: "reports", label: "Reports", icon: <BarChart3 size={18} />, href: "/reports", roles: ["super_admin", "partner_admin", "station_admin", "media_station"] },
  { id: "settings", label: "Settings", icon: <Settings size={18} />, href: "/settings" },
];

const MEDIA_STATION_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/" },
  {
    id: "messages", label: "Messages", icon: <MessageSquare size={18} />,
    children: [
      { id: "messages-all", label: "All Messages", href: "/messages" },
      { id: "approval-queue", label: "Approval Queue", href: "/messages/approval-queue", roles: ["station_admin", "media_station", "presenter"] },
      { id: "message-templates", label: "Message Templates", href: "/message-templates", roles: ["station_admin", "media_station", "presenter"] },
    ],
  },
  { id: "calls", label: "Calls", icon: <Phone size={18} />, href: "/calls" },
  { id: "shows", label: "Shows", icon: <Radio size={18} />, href: "/station-management/shows" },
  { id: "polls", label: "Polls", icon: <BarChart3 size={18} />, href: "/campaigns/polls" },
  { id: "top-fans", label: "Top Fans", icon: <Star size={18} />, href: "/top-fans" },
  { id: "settings", label: "Settings", icon: <Settings size={18} />, href: "/settings" },
];

const PRESENTER_NAV: NavItem[] = [
  { id: "my-show", label: "My Show", icon: <Radio size={18} />, href: "/presenter" },
  { id: "messages", label: "Messages", icon: <MessageSquare size={18} />, href: "/presenter/messages" },
  { id: "listener-statements", label: "Listener Statements", icon: <FileText size={18} />, href: "/presenter/listener-statements" },
  { id: "settings", label: "Settings", icon: <Settings size={18} />, href: "/settings" },
];

const PG_LABEL: Record<string, string> = {
  "/": "Dashboard",
  "/reports": "Reports",
  "/billing": "Billing",
  "/mobile-money": "Mobile Money",
  "/listener-statement": "Listener Statement",
  "/messages": "Messages",
  "/messages/create": "Compose Message",
  "/messages/approval-queue": "Approval Queue",
  "/station-api": "Station API",
  "/crm": "CRM",
  "/calls": "Calls",
  "/top-fans": "Top Fans",
  "/disbursements": "Disbursements",
  "/channels/challenges": "Challenges",
  "/channels/challenges/create": "Create Challenge",
  "/channels/polls": "Channel Polls",
  "/channels/polls/create": "Create Channel Poll",
  "/channels/analytics": "Channel Analytics",
  "/station-management/radio": "Radio Stations",
  "/station-management/radio/create": "Create Radio Station",
  "/station-management/tv": "TV Stations",
  "/station-management/tv/create": "Create TV Station",
  "/station-management/shows": "Shows",
  "/station-management/shows/create": "Add Show",
  "/station-management/channels": "Channels",
  "/station-management/channels/create": "Create Channel",
  "/station-management/create": "Create Station",
  "/users/partner-admins": "Partner Admins",
  "/users/partner-admins/create": "Create Partner Admin",
  "/users/station-admins": "Station Admins",
  "/users/station-admins/create": "Create Station Admin",
  "/users/media-stations": "Media Stations",
  "/users/media-stations/create": "Create Media Station",
  "/users/presenters": "Presenters",
  "/users/presenters/create": "Create Presenter",
  "/users/customer-care": "Customer Care",
  "/campaigns/status-posts": "Status Posts",
  "/campaigns/status-posts/create": "Create Status Post",
  "/campaigns/status-performance": "Status Performance",
  "/campaigns/polls": "Polls",
  "/campaigns/polls/create": "Create Poll",
  "/settings": "Settings",
  "/presenter": "My Show",
  "/presenter/messages": "Messages",
  "/presenter/listener-statements": "Listener Statements",
};

const PG_CRUMB: Record<string, string> = {
  "/": "Dashboard",
  "/reports": "Dashboard / Reports",
  "/billing": "Dashboard / Billing",
  "/mobile-money": "Dashboard / Mobile Money",
  "/listener-statement": "Dashboard / Listener Statement",
  "/messages": "Dashboard / Messages",
  "/messages/create": "Dashboard / Messages / Compose",
  "/messages/approval-queue": "Dashboard / Messages / Approval Queue",
  "/station-api": "Dashboard / Station API",
  "/crm": "Dashboard / CRM",
  "/calls": "Dashboard / Calls",
  "/top-fans": "Dashboard / Top Fans",
  "/channels/polls": "Dashboard / Channels / Polls",
  "/channels/polls/create": "Dashboard / Channels / Polls / Create",
  "/channels/analytics": "Dashboard / Channels / Analytics",
  "/channels/challenges": "Dashboard / Channels / Challenges",
  "/channels/challenges/create": "Dashboard / Channels / Challenges / Create",
  "/station-management/radio": "Dashboard / Station Management / Radio Stations",
  "/station-management/radio/create": "Dashboard / Station Management / Radio Stations / Add",
  "/station-management/tv": "Dashboard / Station Management / TV Stations",
  "/station-management/tv/create": "Dashboard / Station Management / TV Stations / Add",
  "/station-management/shows": "Dashboard / Station Management / Shows",
  "/station-management/shows/create": "Dashboard / Station Management / Shows / Add",
  "/station-management/channels": "Dashboard / Station Management / Channels",
  "/station-management/channels/create": "Dashboard / Station Management / Channels / Add",
  "/station-management/create": "Dashboard / Station Management / Create",
  "/users/partner-admins": "Dashboard / Users / Partner Admins",
  "/users/partner-admins/create": "Dashboard / Users / Partner Admins / Create",
  "/users/station-admins": "Dashboard / Users / Station Admins",
  "/users/station-admins/create": "Dashboard / Users / Station Admins / Create",
  "/users/media-stations": "Dashboard / Users / Media Stations",
  "/users/media-stations/create": "Dashboard / Users / Media Stations / Create",
  "/users/presenters": "Dashboard / Users / Presenters",
  "/users/presenters/create": "Dashboard / Users / Presenters / Create",
  "/users/customer-care": "Dashboard / Users / Customer Care",
  "/campaigns/status-posts": "Dashboard / Campaigns / Status Posts",
  "/campaigns/status-posts/create": "Dashboard / Campaigns / Status Posts / Create",
  "/campaigns/status-performance": "Dashboard / Campaigns / Status Performance",
  "/campaigns/polls": "Dashboard / Campaigns / Polls",
  "/campaigns/polls/create": "Dashboard / Campaigns / Polls / Create",
  "/settings": "Dashboard / Settings",
  "/presenter": "Dashboard / My Show",
  "/presenter/messages": "Dashboard / Messages",
  "/presenter/listener-statements": "Dashboard / Listener Statements",
};

function Sidebar({ pathname, role }: { pathname: string; role: Role }) {
  const user = useAppSelector((state) => state.auth.user);
  const { data: profileData } = useGetMyProfileQuery();
  const liveUser = profileData?.data || user;

  const isStationRole = role === "station_admin" || role === "media_station" || role === "presenter";
  const stationName = isStationRole
    ? (liveUser?.stationName || liveUser?.station?.name || (typeof liveUser?.stationId === "object" ? liveUser?.stationId?.name : null) || null)
    : null;
  const stationLogoRaw = isStationRole
    ? (liveUser?.stationLogo || liveUser?.station?.logo || (typeof liveUser?.stationId === "object" ? liveUser?.stationId?.logo : null) || liveUser?.avatar || null)
    : null;
  const stationLogoUrl = stationLogoRaw ? resolveUrl(stationLogoRaw) : null;

  const rawCat = (liveUser as any)?.stationCategory || (liveUser as any)?.station?.category || (user as any)?.stationCategory || (user as any)?.station?.category || "radio";
  const stationCategory = (rawCat === "channels" || rawCat === "channel") ? "channel" : rawCat;
  const initials = liveUser?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || role.slice(0, 2).toUpperCase();
  const isMediaStation = role === "media_station";
  const isPresenter = role === "presenter";
  const navItems = isMediaStation ? MEDIA_STATION_NAV : isPresenter ? PRESENTER_NAV : NAV_ITEMS;

  const channelType = (liveUser as any)?.channelType || (liveUser as any)?.station?.channelType || (typeof (liveUser as any)?.stationId === "object" ? (liveUser as any)?.stationId?.channelType : null) || (user as any)?.channelType || (user as any)?.station?.channelType;

  const visibleItems = navItems.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;

    // Challenges link
    if (item.id === "challenges") {
      if (stationCategory !== "channel" && !["super_admin", "partner_admin"].includes(role)) {
        return false;
      }
      if (stationCategory === "channel" && channelType && channelType !== "challenges") {
        return false;
      }
    }

    // Channel-specific item hiding
    if (stationCategory === "channel") {
      if (item.id === "station-api") return false;
      // Hide Messages menu if channelType is strictly polls or challenges
      if (item.id === "messages" && (channelType === "polls" || channelType === "challenges")) {
        return false;
      }
    }

    if (item.id === "station-api" && stationCategory !== "tv") return false;
    return canSee(item.minRole, role);
  }).map((item) => ({
    ...item,
    children: item.children?.filter((c) => {
      if (c.roles && !c.roles.includes(role)) return false;

      // Channel-specific child hiding
      if (stationCategory === "channel") {
        // Hide Shows, Radio, TV under Station Management for channel admins
        if (["shows", "radio-stations", "tv-stations"].includes(c.id) && role === "station_admin") {
          return false;
        }
        // Hide Presenters & Media Stations under Users for channel admins
        if (["presenters", "media-stations"].includes(c.id) && role === "station_admin") {
          return false;
        }
        // Hide Message Templates for channel stations
        if (c.id === "message-templates") {
          return false;
        }
        // For channel stations, hide normal polls under Campaigns (Channel Polls is used instead)
        if (c.id === "polls") {
          return false;
        }
      }

      if (c.id === "approval-queue" && stationCategory !== "tv") return false;
      return canSee(c.minRole, role);
    }),
  })).filter((item) => {
    // Filter out parent items whose children array was defined but is now empty
    if (item.children && item.children.length === 0) {
      return false;
    }
    return true;
  });

  const usersItem = visibleItems.find((item) => item.id === "users");
  const USER_HREFS = (usersItem?.children ?? []).map((c) => c.href).filter(Boolean) as string[];
  const STATION_HREFS = ["/station-management"];

  const initOpen: string[] = [];
  if (pathname.startsWith("/messages") || pathname.startsWith("/message-templates")) initOpen.push("messages");
  if (!isMediaStation && !isPresenter) {
    if (USER_HREFS.some((h) => pathname.startsWith(h))) initOpen.push("users");
    if (STATION_HREFS.some((h) => pathname.startsWith(h))) initOpen.push("station-management");
    if (pathname.startsWith("/campaigns")) initOpen.push("campaigns");
  }

  const [open, setOpen] = useState<string[]>(initOpen);
  const tog = (id: string) => setOpen((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const isChildActive = (children: { href?: string }[]) =>
    children.some((c) => c.href && (pathname === c.href || pathname.startsWith(c.href + "/")));

  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-border flex flex-col h-full overflow-y-auto">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#02B2FF] flex items-center justify-center overflow-hidden shrink-0 border border-border/40 shadow-sm">
            {stationLogoUrl ? (
              <img src={stationLogoUrl} alt={stationName || "Station Logo"} className="w-full h-full object-cover" />
            ) : (
              <Radio size={16} className="text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-foreground leading-tight truncate">
              {stationName || (isMediaStation ? "StudioPass" : isPresenter ? "RadioPro" : "MediaHub")}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight truncate">{ROLE_LABEL[role]}</div>
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
                    highlighted ? "bg-[#EFF8FF] text-[#02B2FF] dark:bg-[#02B2FF]/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className={highlighted ? "text-[#02B2FF]" : "text-muted-foreground"}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
              ) : (
                <button
                  onClick={() => tog(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                    highlighted ? "bg-[#EFF8FF] text-[#02B2FF] dark:bg-[#02B2FF]/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className={highlighted ? "text-[#02B2FF]" : "text-muted-foreground"}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.children && (
                    <ChevronDown size={14} className={`transition-transform text-muted-foreground ${isOpen ? "rotate-180" : ""}`} />
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
                          ? "text-[#02B2FF] font-semibold bg-[#EFF8FF]/60 dark:bg-[#02B2FF]/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <ChevronRight size={12} className={c.href && pathname === c.href ? "text-[#02B2FF]" : "text-border"} />
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {isMediaStation && (
        <div className="p-3 border-t border-border">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EFF8FF] dark:bg-[#02B2FF]/10 text-[#02B2FF] text-xs font-semibold hover:bg-[#DAF0FF] dark:hover:bg-[#02B2FF]/20 transition-colors">
            <Radio size={14} /> Radio Control
          </button>
        </div>
      )}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-all">
          <Avatar
            src={stationLogoRaw || liveUser?.avatar}
            initials={initials}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{liveUser?.fullName || ROLE_LABEL[role]}</div>
            <div className="text-[10px] text-muted-foreground truncate">{liveUser?.role ? ROLE_LABEL[liveUser.role as Role] : ROLE_LABEL[role]}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AppHeader({ pathname, role }: { pathname: string; role: Role }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: profileData } = useGetMyProfileQuery();
  const liveUser = profileData?.data || user;

  const isStationRole = role === "station_admin" || role === "media_station" || role === "presenter";
  const stationLogoRaw = isStationRole
    ? (liveUser?.stationLogo || liveUser?.station?.logo || (typeof liveUser?.stationId === "object" ? liveUser?.stationId?.logo : null) || liveUser?.avatar || null)
    : liveUser?.avatar;

  const [showDropdown, setShowDropdown] = useState(false);
  const { theme, setTheme } = useTheme();
  const initials = liveUser?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || role.slice(0, 2).toUpperCase();
  const isStatusPostDetail = /^\/campaigns\/status-posts\/[^/]+$/.test(pathname) && !pathname.endsWith("/create");
  const isShowDetail = /^\/station-management\/shows\/[^/]+$/.test(pathname) && !pathname.endsWith("/create");
  const isMessageDetail = /^\/messages\/[^/]+$/.test(pathname);
  const isCrmInteractions = /^\/crm\/[^/]+\/interactions$/.test(pathname);
  const isCrmDetail = /^\/crm\/[^/]+$/.test(pathname) && !isCrmInteractions;
  const isChallengeDetail = /^\/channels\/challenges\/[^/]+$/.test(pathname) && !pathname.endsWith("/create");
  const isChallengeEdit = /^\/channels\/challenges\/[^/]+\/edit$/.test(pathname);
  const isPollDetail = /^\/channels\/polls\/[^/]+$/.test(pathname) && !pathname.endsWith("/create");
  const isChannelDetail = /^\/station-management\/channels\/[^/]+$/.test(pathname) && !pathname.endsWith("/create");
  const isDetail = isStatusPostDetail || isShowDetail || isMessageDetail || isCrmDetail || isCrmInteractions || isChallengeDetail || isChallengeEdit || isPollDetail || isChannelDetail;
  const label = isStatusPostDetail ? "Status Post Details" : isShowDetail ? "Show Details" : isMessageDetail ? "Message Details" : isCrmInteractions ? "Interaction History" : isCrmDetail ? "Listener Profile" : isChallengeEdit ? "Edit Challenge" : isChallengeDetail ? "Challenge Details" : isPollDetail ? "Poll Details" : isChannelDetail ? "Channel Details" : PG_LABEL[pathname] || "Dashboard";
  const crumb = isStatusPostDetail ? "Dashboard / Campaigns / Status Posts / View" : isShowDetail ? "Dashboard / Station Management / Shows / View" : isMessageDetail ? "Dashboard / Messages / Details" : isCrmInteractions ? "Dashboard / CRM / Listener Profile / Interactions" : isCrmDetail ? "Dashboard / CRM / Listener Profile" : isChallengeEdit ? "Dashboard / Channels / Challenges / Edit" : isChallengeDetail ? "Dashboard / Channels / Challenges / View" : isPollDetail ? "Dashboard / Channels / Polls / View" : isChannelDetail ? "Dashboard / Station Management / Channels / View" : PG_CRUMB[pathname] || "Dashboard";

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <header className="h-14 bg-background border-b border-border flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1">
        <h1 className="text-base font-bold text-foreground">{label}</h1>
        <p className="text-[11px] text-muted-foreground leading-none">{crumb}</p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationPanel />
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        >
          {theme === "dark" ? <Sun size={15} className="text-muted-foreground" /> : <Moon size={15} className="text-muted-foreground" />}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1 transition-colors"
          >
            <Avatar
              src={stationLogoRaw}
              initials={initials}
              size="sm"
            />
            <div className="text-xs font-semibold text-foreground">{ROLE_LABEL[role]}</div>
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function checkRoutePermission(pathname: string, role: Role): boolean {
  if (pathname === "/" || pathname.startsWith("/settings")) return true;

  if (role === "media_station") {
    const allowed = ["/", "/messages", "/calls", "/station-management/shows", "/campaigns/polls", "/top-fans", "/settings"];
    return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }

  if (role === "presenter") {
    const allowed = ["/presenter", "/presenter/messages", "/presenter/listener-statements", "/settings"];
    return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }

  for (const item of NAV_ITEMS) {
    if (item.href && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
      if (item.roles && !item.roles.includes(role)) return false;
      if (item.minRole && !canSee(item.minRole, role)) return false;
      return true;
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.href && (pathname === child.href || pathname.startsWith(child.href + "/"))) {
          if (item.roles && !item.roles.includes(role)) return false;
          if (item.minRole && !canSee(item.minRole, role)) return false;
          if (child.roles && !child.roles.includes(role)) return false;
          if (child.minRole && !canSee(child.minRole, role)) return false;
          return true;
        }
      }
    }
  }

  return true;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAppSelector((state) => (state.auth.user?.role ?? "super_admin") as Role);

  // Initialize socket connection for real-time updates
  useSocket();

  const isAuthorized = checkRoutePermission(pathname, role);

  useEffect(() => {
    if (!isAuthorized) {
      router.replace("/");
    }
  }, [isAuthorized, router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h2 className="text-lg font-bold text-red-500">403 — Access Denied</h2>
          <p className="text-sm text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <RoleProvider>
      <div className="flex h-screen overflow-hidden bg-background font-sans">
        <Sidebar pathname={pathname} role={role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader pathname={pathname} role={role} />
          <main className="flex-1 overflow-y-auto px-6 py-5">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
