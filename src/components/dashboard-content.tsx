"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
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
  Mic,
  BarChart3,
  Activity,
  Filter,
  Search,
  RotateCcw,
  X,
  FileText,
  Clock,
  PhoneCall,
  Globe,
  Loader2,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery } from "@/features/user/userApi";
import CustomerCareDashboard from "@/components/customer-care-dashboard";
import ChannelAdminDashboard from "@/components/channel-admin-dashboard";
import MediaStationDashboard from "@/components/media-station-dashboard";
import {
  useGetDashboardStatsQuery,
  useGetCallOperationsStatsQuery,
} from "@/features/dashboard/dashboardApi";
import { useSearchSupportEntitiesQuery } from "@/features/support/supportApi";
import { EntityDetailsModal } from "@/components/support/entity-details-modal";
import { DashboardFilterModal } from "@/components/modals/dashboard-filter-modal";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { useTimezone } from "@/hooks/use-timezone";

const ROLE_HIERARCHY = ["super_admin", "partner_admin", "station_admin", "customer_care", "media_station", "presenter"];

// ─── Null Safety Helpers ──────────────────────────────────────────────
function safeNumber(val: any, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function safeArray<T = any>(val: any): T[] {
  return Array.isArray(val) ? val : [];
}

function safeCashFlow(val: any) {
  const defaults = {
    today: { amount: 0, previousAmount: 0, percentChange: 0 },
    yesterday: { amount: 0, previousAmount: 0, percentChange: 0 },
    thisWeek: { amount: 0, previousAmount: 0, percentChange: 0 },
    lastWeek: { amount: 0, previousAmount: 0, percentChange: 0 },
    thisMonth: { amount: 0, previousAmount: 0, percentChange: 0 },
    lastMonth: { amount: 0, previousAmount: 0, percentChange: 0 },
  };
  if (!val || typeof val !== "object") return defaults;
  return { ...defaults, ...val };
}

// ─── Constants ────────────────────────────────────────────────────────
const DAY_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899",
];

const CASH_FLOW_CARDS: {
  key: string;
  label: string;
  gradient: string;
  trendPrefix: string;
}[] = [
  { key: "today", label: "Today", gradient: "from-emerald-600 to-emerald-800", trendPrefix: "vs yesterday" },
  { key: "yesterday", label: "Yesterday", gradient: "from-blue-600 to-blue-800", trendPrefix: "vs previous day" },
  { key: "thisWeek", label: "This Week", gradient: "from-purple-600 to-purple-800", trendPrefix: "vs last week" },
  { key: "lastWeek", label: "Last Week", gradient: "from-indigo-800 to-indigo-950", trendPrefix: "vs previous week" },
  { key: "thisMonth", label: "This Month", gradient: "from-teal-600 to-teal-800", trendPrefix: "vs last month" },
  { key: "lastMonth", label: "Last Month", gradient: "from-orange-600 to-orange-800", trendPrefix: "vs previous month" },
];

const allQuickActions = [
  { label: "Add Partner", href: "/users/partner-admins/create", icon: <Building2 size={18} />, color: "text-[#02B2FF]", bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10 dark:bg-[#02B2FF]/10 dark:hover:bg-[#02B2FF]/20", minRole: "super_admin" as const },
  { label: "Add Station", href: "/station-management/create", icon: <Radio size={18} />, color: "text-violet-500", bg: "bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/50", minRole: "partner_admin" as const },
  { label: "Add Presenter", href: "/users/presenters/create", icon: <Mic size={18} />, color: "text-emerald-500", bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50", minRole: "station_admin" as const },
  { label: "Add Shows", href: "/station-management/shows/create", icon: <Mic size={18} />, color: "text-[#02B2FF]", bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10 dark:bg-[#02B2FF]/10 dark:hover:bg-[#02B2FF]/20", minRole: "station_admin" as const },
  { label: "View Reports", href: "/reports", icon: <BarChart3 size={18} />, color: "text-rose-500", bg: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50", minRole: "station_admin" as const },
  { label: "Manage Billing", href: "/billing", icon: <CreditCard size={18} />, color: "text-teal-500", bg: "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50", minRole: "super_admin" as const },
];

export default function DashboardPage() {
  const role = useRole();
  const timezone = useTimezone();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const isMediaStation = role === "media_station";
  const isPresenter = role === "presenter";
  const isCustomerCare = role === "customer_care";
  const user = useAppSelector((state) => state.auth.user);
  const { data: profileData } = useGetMyProfileQuery();
  const liveUser = profileData?.data || user;

  // ─── Global Search ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 700);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isFetching: isSearching } = useSearchSupportEntitiesQuery(
    debouncedSearch,
    { skip: !debouncedSearch || debouncedSearch.length < 2 }
  );

  // ─── Filters ────────────────────────────────────────────────────────
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    country?: string;
    partnerId?: string;
    stationId?: string;
    startDate?: string;
    endDate?: string;
    dateRange?: string;
  }>({});

  const [dailyPeriod, setDailyPeriod] = useState<"week" | "month" | "quarter">("week");

  const effectiveStationId = isStationAdmin
    ? (liveUser?.stationId?._id || liveUser?.stationId?.toString() || filters.stationId)
    : filters.stationId;

  const effectivePartnerId = isPartnerAdmin
    ? (liveUser?.partnerId?._id || liveUser?.partnerId?.toString() || filters.partnerId)
    : filters.partnerId;

  const queryParams = {
    period: dailyPeriod,
    country: filters.country,
    partnerId: effectivePartnerId,
    stationId: effectiveStationId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    dateRange: filters.dateRange,
  };

  const isDelegateRole = isMediaStation || isPresenter || isCustomerCare;

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(queryParams, { skip: isDelegateRole });
  const { data: callOpsStats } = useGetCallOperationsStatsQuery(queryParams, { skip: isDelegateRole });

  const { data: countriesData } = useGetCountriesQuery(undefined, { skip: !filters.country });
  const { data: partnersData } = useGetPartnersQuery(undefined, { skip: !filters.partnerId });
  const { data: stationsData } = useGetStationsQuery({ limit: 100 }, { skip: !filters.stationId });

  const activeCountryName = (countriesData?.data || []).find(
    (c: any) => c.id === filters.country || c._id === filters.country
  )?.name;
  const activePartnerName = (partnersData?.data || []).find(
    (p: any) => p.id === filters.partnerId || p._id === filters.partnerId
  )?.name;
  const activeStationName = (stationsData?.data || []).find(
    (s: any) => s.id === filters.stationId || s._id === filters.stationId
  )?.name;

  // ─── Role-based delegate dashboards ─────────────────────────────────
  if (isMediaStation) return <MediaStationDashboard />;
  // Presenter never uses root `/` — shell/page redirect to /presenter
  if (isPresenter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Open My Show from the sidebar.</div>
      </div>
    );
  }
  if (isCustomerCare) return <CustomerCareDashboard />;

  const rawCat = (liveUser as any)?.stationCategory || (liveUser as any)?.station?.category;
  const isChannelStation = rawCat === "channel" || rawCat === "channels";
  if (isStationAdmin && isChannelStation) return <ChannelAdminDashboard />;

  const quickActions = allQuickActions.filter((a) => {
    const minIdx = ROLE_HIERARCHY.indexOf(a.minRole);
    const curIdx = ROLE_HIERARCHY.indexOf(role);
    return curIdx <= minIdx;
  });

  const hasActiveFilters =
    Boolean(filters.country) || Boolean(filters.partnerId) || Boolean(filters.stationId) ||
    Boolean(filters.startDate) || Boolean(filters.endDate) || Boolean(filters.dateRange);

  const activeFilterCount = [filters.country, filters.partnerId, filters.stationId, filters.startDate || filters.dateRange].filter(Boolean).length;

  const handleClearFilters = () => setFilters({});

  const usersList = searchResults?.data?.users || [];
  const stationsList = searchResults?.data?.stations || [];
  const txList = searchResults?.data?.transactions || [];
  const stmtList = searchResults?.data?.statements || [];
  const hasSearchResults = usersList.length > 0 || stationsList.length > 0 || txList.length > 0 || stmtList.length > 0;

  // ─── Derived data (null-safe) ───────────────────────────────────────
  const stats = statsData?.data;
  const hourlyData = safeArray(stats?.hourlyTransactions);
  const cashFlow = safeCashFlow(stats?.cashFlow);
  const dailyCollections = safeArray(stats?.dailyCollections);
  const dailyDisbursements = safeArray(stats?.dailyDisbursements);
  const callOps = callOpsStats?.data || {};
  const totalCalls = safeNumber(stats?.totalCalls);
  const answeredCalls = safeNumber(callOps?.completed ?? callOps?.answeredCalls);
  const queuedCalls = safeNumber(callOps?.queued ?? callOps?.queuedCalls);
  const rejectedCalls = safeNumber(callOps?.rejected ?? callOps?.rejectedCalls);
  const callSuccessPct = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;
  const queuedPct = totalCalls > 0 ? Math.round((queuedCalls / totalCalls) * 100) : 0;
  const rejectedPct = totalCalls > 0 ? Math.round((rejectedCalls / totalCalls) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Executive Control Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#02B2FF]/10 text-[#02B2FF] uppercase tracking-wider">
              {isSuperAdmin ? "Global Operations" : isPartnerAdmin ? "Regional Portfolio" : "Station Executive"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isStationAdmin
              ? `Operational metrics for ${(liveUser as any)?.stationName || "your station"}`
              : isPartnerAdmin
              ? `Multi-station performance for ${(liveUser as any)?.partnerName || "your partner portfolio"}`
              : "Platform-wide listener engagement, call throughput, and financial performance"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div ref={searchRef} className="relative w-full sm:w-80">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                placeholder="Search users, stations, txns..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF] shadow-sm transition-all"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              )}
            </div>
            {searchOpen && debouncedSearch.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    <Loader2 size={16} className="animate-spin mx-auto mb-1 text-[#02B2FF]" />Searching records...
                  </div>
                ) : !hasSearchResults ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No results found for &ldquo;{debouncedSearch}&rdquo;</div>
                ) : (
                  <div className="divide-y divide-border text-xs">
                    {usersList.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Users size={11} /> Users & Presenters</div>
                        {usersList.slice(0, 5).map((u: any) => (
                          <div key={u._id} onClick={() => { setSelectedEntity({ ...u, entityType: "user" }); setSearchOpen(false); }} className="px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate">{u.fullName || u.phone || u.email}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{u.email || u.phone}</p>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] uppercase font-mono shrink-0">{u.role ? u.role.replace(/_/g, " ") : "User"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {stationsList.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Radio size={11} /> Stations</div>
                        {stationsList.slice(0, 3).map((st: any) => (
                          <div key={st._id} onClick={() => { setSelectedEntity({ ...st, entityType: "station" }); setSearchOpen(false); }} className="px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between">
                            <span className="font-semibold text-foreground truncate">{st.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{st.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {txList.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><CreditCard size={11} /> Credit Transactions</div>
                        {txList.slice(0, 3).map((t: any) => (
                          <div key={t._id} onClick={() => { setSelectedEntity({ ...t, entityType: "transaction" }); setSearchOpen(false); }} className="px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between">
                            <span className="font-mono text-foreground truncate">{t.paymentReference || t._id}</span>
                            <span className="text-[10px] font-bold text-emerald-500">+{t.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {stmtList.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><FileText size={11} /> Statements</div>
                        {stmtList.slice(0, 3).map((s: any) => (
                          <div key={s._id} onClick={() => { setSelectedEntity({ ...s, entityType: "statement" }); setSearchOpen(false); }} className="px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between">
                            <span className="font-mono text-foreground truncate">{s.ticket || s.msisdn}</span>
                            <span className="text-[10px] text-muted-foreground capitalize">{s.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {!isStationAdmin && (
            <button
              onClick={() => setFilterModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${hasActiveFilters ? "border-[#02B2FF] bg-[#02B2FF]/10 text-[#02B2FF]" : "border-border bg-card text-foreground hover:bg-muted"}`}
            >
              <Filter size={14} /><span>Filter</span>
              {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full bg-[#02B2FF] text-white text-[9px] flex items-center justify-center font-bold">{activeFilterCount}</span>}
            </button>
          )}
        </div>
      </div>

      {/* ─── ACTIVE FILTER PILLS ─────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-muted/40 p-2.5 rounded-xl border border-border">
          <span className="text-muted-foreground font-semibold text-[11px] mr-1">Active Filters:</span>
          {filters.country && <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium flex items-center gap-1 text-[11px]"><Globe size={11} className="text-[#02B2FF]" /> Country: {activeCountryName || filters.country}</span>}
          {filters.partnerId && <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium flex items-center gap-1 text-[11px]"><Building2 size={11} className="text-violet-500" /> Partner: {activePartnerName || filters.partnerId}</span>}
          {filters.stationId && <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium flex items-center gap-1 text-[11px]"><Radio size={11} className="text-emerald-500" /> Station: {activeStationName || filters.stationId}</span>}
          {(filters.dateRange || filters.startDate) && <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium flex items-center gap-1 text-[11px]"><Clock size={11} className="text-amber-500" /> Range: {filters.dateRange || `${filters.startDate} to ${filters.endDate}`}</span>}
          <button onClick={handleClearFilters} className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 font-semibold transition-colors"><RotateCcw size={11} /> Reset Filters</button>
        </div>
      )}

      {/* ─── SECTION 1: CORE KPI CARDS ──────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <KpiCard
            label="Total Messages"
            value={safeNumber(stats?.totalMessages).toLocaleString()}
            sub={isStationAdmin ? "At this station" : "All listener SMS"}
            trend={isStationAdmin ? undefined : { val: "vs last week", up: true }}
            icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
            iconBg="bg-[#EFF8FF] dark:bg-[#02B2FF]/10"
          />
          <KpiCard
            label="Total Calls"
            value={safeNumber(stats?.totalCalls).toLocaleString()}
            sub={isStationAdmin ? "Station callers" : "Inbound phone calls"}
            trend={isStationAdmin ? undefined : { val: "vs last week", up: true }}
            icon={<Phone size={16} className="text-violet-500" />}
            iconBg="bg-violet-50 dark:bg-violet-950/30"
          />
          <KpiCard
            label="Listeners"
            value={safeNumber(stats?.totalListeners ?? stats?.totalUsers).toLocaleString()}
            sub={`${safeNumber(stats?.activeListeners).toLocaleString()} active in last 7 days`}
            trend={isStationAdmin ? undefined : { val: "vs last week", up: true }}
            icon={<Users size={16} className="text-emerald-500" />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          />
          <KpiCard
            label={isStationAdmin ? "Active Shows" : isPartnerAdmin ? "Partner Stations" : "Total Stations"}
            value={isStationAdmin ? safeNumber(stats?.activeShows).toLocaleString() : safeNumber(stats?.totalStations).toLocaleString()}
            sub={isStationAdmin ? "Scheduled programs" : "Radio & TV network"}
            trend={isStationAdmin ? undefined : { val: "vs last week", up: true }}
            icon={<Radio size={16} className="text-amber-500" />}
            iconBg="bg-amber-50 dark:bg-amber-950/30"
          />
          <KpiCard
            label="Revenue / Credits"
            value={safeNumber(stats?.totalRevenue).toLocaleString()}
            sub={isStationAdmin ? "Station billing volume" : "Gross platform volume"}
            trend={isStationAdmin ? undefined : { val: "vs last week", up: true }}
            icon={<CreditCard size={16} className="text-teal-500" />}
            iconBg="bg-teal-50 dark:bg-teal-950/30"
          />
        </div>
      </section>

      {/* ─── SECTION 2: HOURLY TRANSACTIONS + CALL OPERATIONS ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hourly Transactions Chart */}
        <Card className="lg:col-span-8 p-5 bg-card border-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity size={15} className="text-[#02B2FF]" />
                Hourly Transactions
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Collections vs disbursements throughout the day</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Collections</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Disbursements</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">Today</span>
            </div>
          </div>
          <div className="h-[280px] w-full pt-4">
            {hourlyData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-muted/10 rounded-xl border border-dashed border-border/80">
                <div className="w-10 h-10 rounded-xl bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center mb-2"><Activity size={20} /></div>
                <p className="text-xs font-semibold text-foreground">No Transactions Today</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">No credit transactions recorded for today yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="collectionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="disbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="collections" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#collectionsGrad)" name="Collections" />
                  <Area type="monotone" dataKey="disbursements" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#disbGrad)" name="Disbursements" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Call Operations & Delivery */}
        <Card className="lg:col-span-4 p-5 bg-card border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <PhoneCall size={15} className="text-emerald-500" />
                Call Operations & Delivery
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Real-time call handling status</p>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Answered & Completed</p>
                    <p className="text-[10px] text-muted-foreground">Successfully connected to show</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-emerald-600">{answeredCalls.toLocaleString()}</span>
                  <p className="text-[10px] text-muted-foreground">{callSuccessPct}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#02B2FF]" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">In Queue / Active</p>
                    <p className="text-[10px] text-muted-foreground">Listeners on waiting line</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-[#02B2FF]">{queuedCalls.toLocaleString()}</span>
                  <p className="text-[10px] text-muted-foreground">{queuedPct}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Cut / Refunded</p>
                    <p className="text-[10px] text-muted-foreground">Disconnected with credit refund</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-red-600">{rejectedCalls.toLocaleString()}</span>
                  <p className="text-[10px] text-muted-foreground">{rejectedPct}%</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Real-time Socket Sync</span>
            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
        </Card>
      </div>

      {/* ─── SECTION 3: CASH FLOW SUMMARY ───────────────────────────── */}
      <section>
        <SectionHeader title="Cash Flow Summary" sub="Financial overview across selected periods" />
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CASH_FLOW_CARDS.map((card) => {
            const periodData = (cashFlow as any)[card.key] || { amount: 0, percentChange: 0 };
            return (
              <div key={card.key} className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 text-white shadow-sm`}>
                <p className="text-[11px] font-medium opacity-80">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold font-mono mt-1">{Number(periodData.amount).toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1.5 text-[11px]">
                  <TrendingUp size={11} className={periodData.percentChange >= 0 ? "text-white" : "text-red-300"} />
                  <span className="font-semibold">{periodData.percentChange >= 0 ? "↑" : "↓"} {Math.abs(periodData.percentChange)}%</span>
                  <span className="opacity-70 hidden sm:inline">{card.trendPrefix}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SECTION 4: DAILY COLLECTIONS + DISBURSEMENTS ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daily Collections */}
        <Card className="p-5 bg-card border-border shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ArrowDownToLine size={15} className="text-[#02B2FF]" />
                Daily Collections
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Daily collection totals for the selected period</p>
            </div>
            <select
              value={dailyPeriod}
              onChange={(e) => setDailyPeriod(e.target.value as "week" | "month" | "quarter")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-border bg-card text-foreground cursor-pointer"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
          <div className="mt-4 space-y-2.5">
            {dailyCollections.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/60">
                <ArrowDownToLine size={18} className="mx-auto mb-1.5 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">No Collections Data</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">No collection data for this period.</p>
              </div>
            ) : (
              dailyCollections.map((item: any, idx: number) => {
                const maxAmount = Math.max(...dailyCollections.map((d: any) => safeNumber(d.amount)), 1);
                const pct = Math.min(100, Math.round((safeNumber(item.amount) / maxAmount) * 100));
                return (
                  <div key={item.date || idx} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground font-medium w-20 shrink-0">{item.date}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, pct)}%`, backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] }} />
                    </div>
                    <span className="text-xs font-mono font-semibold text-foreground w-24 text-right shrink-0">{safeNumber(item.amount).toLocaleString()}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Daily Disbursements */}
        <Card className="p-5 bg-card border-border shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ArrowUpFromLine size={15} className="text-orange-500" />
                Daily Disbursements
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Daily disbursement totals for the selected period</p>
            </div>
            <select
              value={dailyPeriod}
              onChange={(e) => setDailyPeriod(e.target.value as "week" | "month" | "quarter")}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-border bg-card text-foreground cursor-pointer"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
          <div className="mt-4 space-y-2.5">
            {dailyDisbursements.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/60">
                <ArrowUpFromLine size={18} className="mx-auto mb-1.5 text-muted-foreground/50" />
                <p className="font-semibold text-foreground">No Disbursements Data</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">No disbursement data for this period.</p>
              </div>
            ) : (
              dailyDisbursements.map((item: any, idx: number) => {
                const maxAmount = Math.max(...dailyDisbursements.map((d: any) => safeNumber(d.amount)), 1);
                const pct = Math.min(100, Math.round((safeNumber(item.amount) / maxAmount) * 100));
                return (
                  <div key={item.date || idx} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground font-medium w-20 shrink-0">{item.date}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, pct)}%`, backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] }} />
                    </div>
                    <span className="text-xs font-mono font-semibold text-foreground w-24 text-right shrink-0">{safeNumber(item.amount).toLocaleString()}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ─── SECTION 5: QUICK ACTIONS ────────────────────────────────── */}
      <section>
        <SectionHeader title="Operational Quick Management" sub="Direct links to essential studio operations" />
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className={`${action.bg} rounded-xl p-4 flex flex-col items-center gap-2.5 border border-border hover:border-transparent hover:shadow-md transition-all group cursor-pointer text-center h-full justify-center`}>
                <div className={`${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</div>
                <span className="text-xs font-semibold text-foreground leading-tight">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── MODALS ──────────────────────────────────────────────────── */}
      {selectedEntity && <EntityDetailsModal entity={selectedEntity} onClose={() => setSelectedEntity(null)} />}
      <DashboardFilterModal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} role={role} currentFilters={filters} onApply={(newFilters) => setFilters(newFilters)} />
    </div>
  );
}
