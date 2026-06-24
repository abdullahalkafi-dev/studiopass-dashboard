"use client";

import { useState } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  SectionHeader,
  StatusBadge,
  sv,
  Avatar,
  ChartFilter,
} from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Building2,
  Radio,
  Users,
  MessageSquare,
  Phone,
  CreditCard,
  CheckCircle2,
  UserPlus,
  Monitor,
  Mic,
  BarChart3,
  ArrowUpRight,
  Activity,
  AlertCircle,
  Eye,
  Megaphone,
  PhoneIncoming,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Globe,
  ChevronRight,
  Star,
  Plus,
  TrendingUp,
} from "lucide-react";
import { chartData as CHART_DATA } from "@/mock/dashboard.json";
import { useRole } from "@/contexts/role-context";

const allQuickActions = [
  { label: "Add Partner",       href: "/users/partner-admins/create",  icon: <Building2 size={20}/>,  color: "text-[#02B2FF]", bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10", minRole: "super_admin" as const },
  { label: "Add Station",       href: "/station-management/radio/create", icon: <Radio size={20}/>,      color: "text-violet-500", bg: "bg-violet-50 hover:bg-violet-100", minRole: "partner_admin" as const },
  { label: "Add Presenter",     href: "/users/presenters/create",      icon: <Mic size={20}/>,        color: "text-emerald-500", bg: "bg-emerald-50 hover:bg-emerald-100", minRole: "station_admin" as const },
  { label: "Add Media Station", href: "/users/media-stations/create",  icon: <Monitor size={20}/>,    color: "text-amber-500",  bg: "bg-amber-50 hover:bg-amber-100", minRole: "station_admin" as const },
  { label: "Add Shows",         href: "/station-management/shows/create", icon: <Mic size={20}/>,      color: "text-[#02B2FF]",  bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10", minRole: "station_admin" as const },
  { label: "View Reports",      href: "/reports",                      icon: <BarChart3 size={20}/>,  color: "text-rose-500",   bg: "bg-rose-50 hover:bg-rose-100", minRole: "station_admin" as const },
  { label: "Manage Billing",    href: "/billing",                      icon: <CreditCard size={20}/>, color: "text-teal-500",   bg: "bg-teal-50 hover:bg-teal-100", minRole: "super_admin" as const },
];

const roleDistribution = [
  { role: "Partner Admins", count: 248, pct: 0.8, color: "bg-[#02B2FF]" },
  { role: "Station Admins", count: 1842, pct: 3.5, color: "bg-violet-500" },
  { role: "Media Stations", count: 3104, pct: 5.9, color: "bg-amber-500" },
  { role: "Presenters", count: 28640, pct: 54.6, color: "bg-emerald-500" },
  { role: "Customer Care", count: 18582, pct: 35.4, color: "bg-rose-500" },
];

const stationRows = [
  { name: "Capital FM Kenya", country: "Kenya", shows: 12, messages: 1840, calls: 520, status: "Active" },
  { name: "Radio Uganda", country: "Uganda", shows: 8, messages: 1210, calls: 380, status: "Active" },
  { name: "Joy FM Ghana", country: "Ghana", shows: 10, messages: 980, calls: 290, status: "Active" },
  { name: "Citizen TV", country: "Kenya", shows: 15, messages: 2100, calls: 680, status: "Active" },
  { name: "NTV Uganda", country: "Uganda", shows: 9, messages: 760, calls: 210, status: "Inactive" },
  { name: "Peace FM", country: "Ghana", shows: 6, messages: 540, calls: 160, status: "Active" },
  { name: "Hot 96", country: "Tanzania", shows: 7, messages: 620, calls: 185, status: "Active" },
];

const recentActivities = [
  { name: "Amara Osei",    initials: "AO", action: "sent a message to Capital FM",     time: "2 min ago",  color: "bg-[#EFF8FF] text-[#02B2FF]" },
  { name: "James Mwangi",  initials: "JM", action: "joined as Station Admin",           time: "8 min ago",  color: "bg-[#EFF8FF] text-[#02B2FF]" },
  { name: "Fatima Diallo", initials: "FD", action: "called into Joy FM Ghana",          time: "15 min ago", color: "bg-[#EFF8FF] text-[#02B2FF]" },
  { name: "Kofi Asante",   initials: "KA", action: "created new campaign",              time: "23 min ago", color: "bg-[#EFF8FF] text-[#02B2FF]" },
  { name: "Ngozi Eze",     initials: "NE", action: "submitted listener statement",      time: "31 min ago", color: "bg-[#EFF8FF] text-[#02B2FF]" },
  { name: "David Mutua",   initials: "DM", action: "added Radio Uganda station",        time: "45 min ago", color: "bg-[#EFF8FF] text-[#02B2FF]" },
  { name: "Aisha Kamara",  initials: "AK", action: "called into Peace FM",              time: "1 hr ago",   color: "bg-[#EFF8FF] text-[#02B2FF]" },
  { name: "Emmanuel Kweku",initials: "EK", action: "registered as Presenter",           time: "2 hr ago",   color: "bg-[#EFF8FF] text-[#02B2FF]" },
];

const topStations = [
  { rank: 1, name: "Citizen TV",       country: "Kenya",    score: 98.4, messages: 2100 },
  { rank: 2, name: "Capital FM Kenya", country: "Kenya",    score: 94.2, messages: 1840 },
  { rank: 3, name: "Radio Uganda",     country: "Uganda",   score: 87.6, messages: 1210 },
  { rank: 4, name: "Joy FM Ghana",     country: "Ghana",    score: 82.1, messages: 980 },
  { rank: 5, name: "Hot 96",           country: "Tanzania", score: 76.8, messages: 620 },
];

const recentUsers = [
  { name: "Amara Osei",    email: "amara@capitalfm.ke",    initials: "AO", color: "bg-[#EFF8FF] text-[#02B2FF]", role: "Partner Admin", station: "Capital FM Kenya", status: "Active",   lastActive: "2 min ago" },
  { name: "James Mwangi",  email: "james@radiouganda.ug",  initials: "JM", color: "bg-[#EFF8FF] text-[#02B2FF]", role: "Station Admin", station: "Radio Uganda",     status: "Active",   lastActive: "8 min ago" },
  { name: "Fatima Diallo", email: "fatima@joyfm.gh",       initials: "FD", color: "bg-[#EFF8FF] text-[#02B2FF]", role: "Presenter",     station: "Joy FM Ghana",     status: "Active",   lastActive: "15 min ago" },
  { name: "Kofi Asante",   email: "kofi@citizentv.ke",     initials: "KA", color: "bg-[#EFF8FF] text-[#02B2FF]", role: "Station Admin", station: "Citizen TV",       status: "Active",   lastActive: "23 min ago" },
  { name: "Ngozi Eze",     email: "ngozi@peacefm.gh",      initials: "NE", color: "bg-[#EFF8FF] text-[#02B2FF]", role: "Customer Care", station: "Peace FM",         status: "Inactive", lastActive: "1 hr ago" },
  { name: "David Mutua",   email: "david@hot96.tz",        initials: "DM", color: "bg-[#EFF8FF] text-[#02B2FF]", role: "Presenter",     station: "Hot 96",           status: "Active",   lastActive: "2 hr ago" },
];

const countryRevenue = [
  {
    name: "Kenya",
    flag: "🇰🇪",
    stations: 420,
    messages: "1.8M",
    calls: "420K",
    revenue: "$98,400",
    growth: "+24.2%",
    up: true,
  },
  {
    name: "Uganda",
    flag: "🇺🇬",
    stations: 310,
    messages: "1.2M",
    calls: "310K",
    revenue: "$62,400",
    growth: "+18.6%",
    up: true,
  },
  {
    name: "Ghana",
    flag: "🇬🇭",
    stations: 280,
    messages: "980K",
    calls: "280K",
    revenue: "$41,200",
    growth: "+15.4%",
    up: true,
  },
  {
    name: "Tanzania",
    flag: "🇹🇿",
    stations: 240,
    messages: "640K",
    calls: "180K",
    revenue: "$22,800",
    growth: "+12.1%",
    up: true,
  },
  {
    name: "Nigeria",
    flag: "🇳🇬",
    stations: 360,
    messages: "820K",
    calls: "240K",
    revenue: "$14,400",
    growth: "+9.8%",
    up: true,
  },
  {
    name: "Rwanda",
    flag: "🇷🇼",
    stations: 232,
    messages: "420K",
    calls: "120K",
    revenue: "$9,200",
    growth: "+7.2%",
    up: true,
  },
];

const ROLE_HIERARCHY = ["super_admin", "partner_admin", "station_admin", "customer_care", "media_station", "presenter"];

export default function DashboardPage() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const [period, setPeriod] = useState("monthly");

  const quickActions = allQuickActions.filter((a) => {
    const minIdx = ROLE_HIERARCHY.indexOf(a.minRole);
    const curIdx = ROLE_HIERARCHY.indexOf(role);
    return curIdx <= minIdx;
  });

  return (
    <div className="space-y-7">
      {/* Section 1: Executive Overview */}
      <section>
        <SectionHeader title="Executive Overview" sub="Platform-wide performance at a glance" />
        <div className={`mt-4 grid gap-4 ${isStationAdmin ? "grid-cols-4" : isPartnerAdmin ? "grid-cols-5" : "grid-cols-6"}`}>
          {isSuperAdmin && (
            <KpiCard label="Total Partners" value="248" sub="Across 14 countries" trend={{val:"+12",up:true}} icon={<Building2 size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
          )}
          {!isStationAdmin && (
            <KpiCard label="Total Stations" value="1,842" sub="Radio & TV" trend={{val:"+34",up:true}} icon={<Radio size={16} className="text-violet-500"/>} iconBg="bg-violet-50"/>
          )}
          <KpiCard label="Total Users" value="52,416" sub="All roles" trend={{val:"+840",up:true}} icon={<Users size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
          <KpiCard label="Total Messages" value="4.8M" sub="This year" trend={{val:"+18%",up:true}} icon={<MessageSquare size={16} className="text-amber-500"/>} iconBg="bg-amber-50"/>
          <KpiCard label="Total Calls" value="1.3M" sub="This year" trend={{val:"+9%",up:true}} icon={<Phone size={16} className="text-rose-500"/>} iconBg="bg-rose-50"/>
          <KpiCard label="Total Revenue" value="$248K" sub="USD this year" trend={{val:"+22%",up:true}} icon={<CreditCard size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
        </div>
      </section>

      {/* Section 2: Quick Management */}
      <section>
        <SectionHeader title="Quick Management" sub="Click a card to navigate to the corresponding workflow" />
        <div className="mt-4 grid grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className={`${action.bg} rounded-xl py-6 px-4 flex flex-col items-center gap-3 border border-border hover:border-transparent hover:shadow-md transition-all group cursor-pointer`}>
                <div className={`${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</div>
                <span className="text-xs font-semibold text-foreground text-center leading-tight">{action.label}</span>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 3: Partner Overview + User Role Distribution */}
      {isSuperAdmin && (
      <section>
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          {/* Left: Partner Overview */}
          <div>
            <SectionHeader title="Partner Overview" sub="Partner health and growth metrics" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <KpiCard label="Total Partners" value="248" icon={<Building2 size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
              <KpiCard label="Active Partners" value="231" sub="93.1% active" trend={{val:"+4",up:true}} icon={<CheckCircle2 size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
              <KpiCard label="New This Month" value="18" trend={{val:"+3 vs last",up:true}} icon={<UserPlus size={16} className="text-violet-500"/>} iconBg="bg-violet-50"/>
              <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top Partner</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">CF</div>
                  <div><div className="text-sm font-bold text-foreground">Capital FM</div><div className="text-[10px] text-muted-foreground">Kenya · 14 stations</div></div>
                  <Star size={14} className="text-amber-400 ml-auto"/>
                </div>
              </div>
            </div>
          </div>

          {/* Right: User Role Distribution */}
          <div>
            <SectionHeader title="User Role Distribution" sub="Active users by role" />
            <div className="mt-4 grid grid-cols-1 gap-2">
              {roleDistribution.map((item) => (
                <button key={item.role} className="bg-card rounded-xl border border-border px-4 py-3 shadow-sm flex items-center gap-3 hover:border-[#02B2FF]/30 hover:shadow-md transition-all text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{item.role}</span>
                      <span className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace]">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(item.pct * 1.7, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace] ml-1">{item.pct}%</span>
                  <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Section 4: Platform Performance */}
      <section>
        <SectionHeader title="Platform Performance">
          <ChartFilter
            value={period}
            onChange={setPeriod}
          />
        </SectionHeader>
        <div className="mt-4 grid grid-cols-1 gap-7 lg:grid-cols-2">
          {/* Message Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold">Message Activity</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA[period as keyof typeof CHART_DATA]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="n"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="m"
                      stroke="#02B2FF"
                      fill="#02B2FF"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Call Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold">Call Activity</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CHART_DATA[period as keyof typeof CHART_DATA]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="n"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="c"
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 5: Listener Statement Summary */}
      <section>
        <SectionHeader title="Listener Statement Summary" sub="Aggregated listener interaction data" />
        <div className="mt-4 grid grid-cols-3 gap-4">
          <KpiCard label="Total Messages" value="4,821,640" trend={{val:"+18.4%",up:true}} icon={<MessageSquare size={16} className="text-amber-500"/>} iconBg="bg-amber-50"/>
          <KpiCard label="Total Calls" value="1,284,920" trend={{val:"+9.1%",up:true}} icon={<Phone size={16} className="text-rose-500"/>} iconBg="bg-rose-50"/>
          <KpiCard label="Total Paid Interactions" value="892,400" trend={{val:"+24.8%",up:true}} icon={<CreditCard size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
        </div>
      </section>

      {/* Section 6: Campaign Overview */}
      <section>
        <SectionHeader title="Campaign Overview" sub="Active and historical campaign metrics" />
        <div className="mt-4 grid grid-cols-4 gap-4">
          <KpiCard label="Active Campaigns" value="84" trend={{val:"+11",up:true}} icon={<Activity size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
          <KpiCard label="Expired Campaigns" value="312" sub="All-time" icon={<AlertCircle size={16} className="text-slate-400"/>} iconBg="bg-slate-100"/>
          <KpiCard label="Campaign Views" value="12.4M" trend={{val:"+31%",up:true}} icon={<Eye size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top Campaign</div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Megaphone size={15} className="text-amber-600"/></div>
              <div><div className="text-sm font-bold text-foreground leading-tight">Ramadan Greetings</div><div className="text-[10px] text-muted-foreground">2.8M views · 94% CTR</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Station Overview */}
      <section>
        <SectionHeader title="Station Overview" sub="Live station performance metrics" />
        <div className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station Name</th>
                {isSuperAdmin && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                )}
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Shows</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages Today</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calls Today</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {stationRows.map((row) => (
                <tr key={row.name} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF8FF] flex items-center justify-center">
                        <Radio size={13} className="text-[#02B2FF]" />
                      </div>
                      <span className="font-semibold text-foreground text-xs">{row.name}</span>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{row.country}</td>
                  )}
                  <td className="px-5 py-3.5 text-xs text-right font-['JetBrains_Mono',monospace] font-medium text-foreground">{row.shows}</td>
                  <td className="px-5 py-3.5 text-xs text-right font-['JetBrains_Mono',monospace] font-medium text-foreground">{row.messages.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-xs text-right font-['JetBrains_Mono',monospace] font-medium text-foreground">{row.calls.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge label={row.status} variant={sv(row.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 8: Call Operations Overview */}
      <section>
        <SectionHeader title="Call Operations Overview" sub="Inbound call handling performance" />
        <div className="mt-4 grid grid-cols-4 gap-4 mb-4">
          <KpiCard label="Incoming Calls" value="48,420" trend={{val:"+6.2%",up:true}} icon={<PhoneIncoming size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
          <KpiCard label="Answered Calls" value="41,840" sub="86.4% rate" trend={{val:"+3.1%",up:true}} icon={<PhoneCall size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
          <KpiCard label="Missed Calls" value="4,280" sub="8.8% rate" trend={{val:"-1.4%",up:false}} icon={<PhoneMissed size={16} className="text-amber-500"/>} iconBg="bg-amber-50"/>
          <KpiCard label="Rejected Calls" value="2,300" sub="4.8% rate" trend={{val:"-0.7%",up:false}} icon={<PhoneOff size={16} className="text-red-500"/>} iconBg="bg-red-50"/>
        </div>

        {/* Circular Gauges */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center justify-center gap-6 p-6">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                className="-rotate-90"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${86.4 * 3.14159} ${314.159}`}
                />
              </svg>
              <div>
                <p className="text-sm text-muted-foreground">Call Success Rate</p>
                <p className="text-3xl font-bold text-emerald-600">86.4%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-center gap-6 p-6">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                className="-rotate-90"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#02B2FF"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${91.2 * 3.14159} ${314.159}`}
                />
              </svg>
              <div>
                <p className="text-sm text-muted-foreground">
                  Call Response Rate
                </p>
                <p className="text-3xl font-bold text-[#02B2FF]">91.2%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 9: Recent Activity + Top Performing Stations */}
      <section>
        <div className={`grid gap-5 ${isStationAdmin ? "grid-cols-1" : "grid-cols-5"}`}>
          {/* Recent Activity */}
          <div className={isStationAdmin ? "col-span-1" : "col-span-3"}>
            <SectionHeader title="Recent Activity" sub="Latest platform events" />
            <div className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center text-xs font-bold shrink-0`}>{activity.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">{activity.name}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Stations */}
          {!isStationAdmin && (
          <div className="col-span-2">
            <SectionHeader title="Top Performing Stations" sub="By engagement score" />
            <div className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {topStations.map((station) => (
                <div key={station.rank} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${station.rank===1?"bg-amber-100 text-amber-600":station.rank===2?"bg-slate-100 text-slate-500":"bg-orange-50 text-orange-400"}`}>{station.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{station.name}</div>
                    <div className="text-[10px] text-muted-foreground">{station.country}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace]">{station.score}</div>
                    <div className="text-[10px] text-muted-foreground">{station.messages.toLocaleString()} msgs</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Section 10: Recent Users */}
      {!isStationAdmin && (
      <section>
        <SectionHeader title="Recent Users" sub="Newly registered and recently active users" />
        <div className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr key={user.email} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF] text-xs font-bold">{user.initials}</div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{user.name}</div>
                        <div className="text-[10px] text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-foreground">{user.role}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{user.station}</td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge label={user.status} variant={sv(user.status)} />
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">{user.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* Section 11: Billing & Credits Overview */}
      {!isStationAdmin && (
      <section>
        <SectionHeader title="Billing & Credits Overview" sub="Platform-wide financial metrics" />
        <div className="mt-4 grid grid-cols-5 gap-4">
          <KpiCard label="Credits Purchased" value="8.4M" trend={{val:"+14%",up:true}} icon={<Plus size={16} className="text-[#02B2FF]"/>} iconBg="bg-[#EFF8FF]"/>
          <KpiCard label="Credits Used" value="7.1M" sub="84.5% utilisation" icon={<Activity size={16} className="text-violet-500"/>} iconBg="bg-violet-50"/>
          <KpiCard label="Successful Txns" value="124,840" trend={{val:"+8.2%",up:true}} icon={<CheckCircle2 size={16} className="text-emerald-500"/>} iconBg="bg-emerald-50"/>
          <KpiCard label="Failed Txns" value="2,140" sub="1.7% failure" trend={{val:"-0.4%",up:false}} icon={<AlertCircle size={16} className="text-red-500"/>} iconBg="bg-red-50"/>
          <KpiCard label="Revenue Generated" value="$248,400" trend={{val:"+22.1%",up:true}} icon={<TrendingUp size={16} className="text-teal-500"/>} iconBg="bg-teal-50"/>
        </div>
      </section>
      )}

      {/* Section 12: Country Revenue Overview */}
      {isSuperAdmin && (
      <section>
        <SectionHeader title="Country Revenue Overview" />
        <div className="mt-4 overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Country
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Stations
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Messages
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Calls
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody>
                {countryRevenue.map((row) => (
                  <tr key={row.name} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{row.flag}</span>
                        <span className="font-medium">{row.name}</span>
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.stations.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.messages}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.calls}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {row.revenue}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-emerald-600">
                        {row.growth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      )}

      <div className="h-4" />
    </div>
  );
}
