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
  PhoneIncoming,
  PhoneCall,
  PhoneOff,
  Globe,
  Loader2,
} from "lucide-react";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery } from "@/features/user/userApi";
import { useGetThreadsQuery, useSendReplyMutation } from "@/features/message/messageApi";
import { useGetActiveShowQuery } from "@/features/show/showApi";
import { useGetPollsQuery } from "@/features/poll/pollApi";
import { useGetStationCallsQuery, useRejectCallMutation } from "@/features/call/callApi";
import { useRouter } from "next/navigation";
import PresenterDashboard from "@/components/presenter-dashboard";
import CustomerCareDashboard from "@/components/customer-care-dashboard";
import ChannelAdminDashboard from "@/components/channel-admin-dashboard";
import {
  useGetDashboardStatsQuery,
  useGetMessageActivityQuery,
  useGetCallActivityQuery,
  useGetCallOperationsStatsQuery,
} from "@/features/dashboard/dashboardApi";
import { useSearchSupportEntitiesQuery } from "@/features/support/supportApi";
import { EntityDetailsModal } from "@/components/support/entity-details-modal";
import { DashboardFilterModal } from "@/components/modals/dashboard-filter-modal";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { toast } from "sonner";
import { formatTime24h } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

const ROLE_HIERARCHY = ["super_admin", "partner_admin", "station_admin", "customer_care", "media_station", "presenter"];

const allQuickActions = [
  { label: "Add Partner",       href: "/users/partner-admins/create",  icon: <Building2 size={18}/>,  color: "text-[#02B2FF]", bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10 dark:bg-[#02B2FF]/10 dark:hover:bg-[#02B2FF]/20", minRole: "super_admin" as const },
  { label: "Add Station",       href: "/station-management/create", icon: <Radio size={18}/>,      color: "text-violet-500", bg: "bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/50", minRole: "partner_admin" as const },
  { label: "Add Presenter",     href: "/users/presenters/create",      icon: <Mic size={18}/>,        color: "text-emerald-500", bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50", minRole: "station_admin" as const },
  { label: "Add Shows",         href: "/station-management/shows/create", icon: <Mic size={18}/>,      color: "text-[#02B2FF]",  bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10 dark:bg-[#02B2FF]/10 dark:hover:bg-[#02B2FF]/20", minRole: "station_admin" as const },
  { label: "View Reports",      href: "/reports",                      icon: <BarChart3 size={18}/>,  color: "text-rose-500",   bg: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50", minRole: "station_admin" as const },
  { label: "Manage Billing",    href: "/billing",                      icon: <CreditCard size={18}/>, color: "text-teal-500",   bg: "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50", minRole: "super_admin" as const },
];

function MediaStationDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId || "";
  const timezone = useTimezone();
  const [selectedMsg, setSelectedMsg] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: threadsData, isLoading: threadsLoading } = useGetThreadsQuery(
    { stationId, page: 1, limit: 20 },
    { skip: !stationId }
  );
  const { data: activeShowData } = useGetActiveShowQuery(stationId, { skip: !stationId });
  const { data: pollsData } = useGetPollsQuery(
    { page: 1, limit: 1, station: stationId, status: "active" },
    { skip: !stationId }
  );
  const [sendReply] = useSendReplyMutation();

  const router = useRouter();
  const { data: callsData, isLoading: callsLoading } = useGetStationCallsQuery(
    { stationId, status: "queued,answered", limit: 20 },
    { skip: !stationId }
  );
  const [rejectCall, { isLoading: isRejecting }] = useRejectCallMutation();

  const handleCutCall = async (callId: string) => {
    try {
      await rejectCall(callId).unwrap();
      toast.success("Call cut. Credit refunded to listener.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cut call");
    }
  };

  const calls = callsData?.data || [];
  const queuedCalls = calls.filter((c: any) => c.status === "queued");
  const activeCalls = calls.filter((c: any) => c.status === "answered");

  const threads = threadsData?.data || [];
  const activeShow = activeShowData?.data || null;
  const activePoll = pollsData?.data?.[0] || null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Active Calls" value={String(activeCalls.length)} sub="Currently live on air" icon={<PhoneCall size={18} className="text-emerald-500" />} iconBg="bg-emerald-50" />
        <KpiCard label="Queued Calls" value={String(queuedCalls.length)} sub="Listeners waiting" icon={<PhoneIncoming size={18} className="text-[#02B2FF]" />} iconBg="bg-[#EFF8FF]" />
        <KpiCard label="Message Threads" value={String(threads.length)} sub="Total incoming threads" icon={<MessageSquare size={18} className="text-amber-500" />} iconBg="bg-amber-50" />
        <KpiCard label="Active Show" value={activeShow?.name || "No show running"} sub={formatTime24h(now, timezone)} icon={<Mic size={18} className="text-purple-500" />} iconBg="bg-purple-50" />
      </div>
    </div>
  );
}

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

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
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

  // Advanced Filter State
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<{
    country?: string;
    partnerId?: string;
    stationId?: string;
    startDate?: string;
    endDate?: string;
    dateRange?: string;
  }>({});

  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  // Effective query params: lock to user's stationId if station_admin
  const effectiveStationId = isStationAdmin
    ? (liveUser?.stationId?._id || liveUser?.stationId?.toString() || filters.stationId)
    : filters.stationId;

  const effectivePartnerId = isPartnerAdmin
    ? (liveUser?.partnerId?._id || liveUser?.partnerId?.toString() || filters.partnerId)
    : filters.partnerId;

  // Query stats — enabled for Super Admin, Partner Admin, AND Station Admin!
  const queryParams = {
    period,
    country: filters.country,
    partnerId: effectivePartnerId,
    stationId: effectiveStationId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    dateRange: filters.dateRange,
  };

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(queryParams);
  const { data: messageActivity } = useGetMessageActivityQuery(queryParams);
  const { data: callActivity } = useGetCallActivityQuery(queryParams);
  const { data: callOpsStats } = useGetCallOperationsStatsQuery(queryParams);

  // Resolve Names for Active Filter Badges
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

  // Chart Mappings
  const msgMap = new Map((messageActivity?.data ?? []).map((d: any) => [d.date, d.count]));
  const callMap = new Map((callActivity?.data ?? []).map((d: any) => [d.date, d.count]));
  const allDates = Array.from(new Set([...msgMap.keys(), ...callMap.keys()])).sort();
  const chartMapped = allDates.length > 0
    ? allDates.map((date) => ({
        name: date,
        messages: msgMap.get(date) || 0,
        calls: callMap.get(date) || 0,
      }))
    : [
        { name: "Week 1", messages: 120, calls: 45 },
        { name: "Week 2", messages: 210, calls: 90 },
        { name: "Week 3", messages: 340, calls: 160 },
        { name: "Week 4", messages: 480, calls: 210 },
      ];

  // Specific role delegates
  if (isMediaStation) return <MediaStationDashboard />;
  if (isPresenter) return <PresenterDashboard />;
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
    Boolean(filters.country) ||
    Boolean(filters.partnerId) ||
    Boolean(filters.stationId) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(filters.dateRange);

  const activeFilterCount = [
    filters.country,
    filters.partnerId,
    filters.stationId,
    filters.startDate || filters.dateRange,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setFilters({});
  };

  const usersList = searchResults?.data?.users || [];
  const stationsList = searchResults?.data?.stations || [];
  const txList = searchResults?.data?.transactions || [];
  const stmtList = searchResults?.data?.statements || [];
  const hasSearchResults =
    usersList.length > 0 || stationsList.length > 0 || txList.length > 0 || stmtList.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* TOP HEADER: TITLE + GLOBAL SEARCH + ADVANCED FILTER */}
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

        {/* Global Multi-Entity Search + Filter Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Multi-Entity Search */}
          <div ref={searchRef} className="relative w-full sm:w-80">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search users, stations, txns..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF] shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dropdown Live Results */}
            {searchOpen && debouncedSearch.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    <Loader2 size={16} className="animate-spin mx-auto mb-1 text-[#02B2FF]" />
                    Searching records...
                  </div>
                ) : !hasSearchResults ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No results found for &ldquo;{debouncedSearch}&rdquo;
                  </div>
                ) : (
                  <div className="divide-y divide-border text-xs">
                    {/* Users */}
                    {usersList.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Users size={11} /> Users & Listeners
                        </div>
                        {usersList.slice(0, 4).map((u: any) => (
                          <div
                            key={u._id}
                            onClick={() => {
                              setSelectedEntity({ ...u, entityType: "user" });
                              setSearchOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-semibold text-foreground truncate">{u.fullName || u.phone}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{u.role}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stations */}
                    {stationsList.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Radio size={11} /> Stations
                        </div>
                        {stationsList.slice(0, 3).map((st: any) => (
                          <div
                            key={st._id}
                            onClick={() => {
                              setSelectedEntity({ ...st, entityType: "station" });
                              setSearchOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-semibold text-foreground truncate">{st.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{st.type}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transactions */}
                    {txList.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <CreditCard size={11} /> Credit Transactions
                        </div>
                        {txList.slice(0, 3).map((t: any) => (
                          <div
                            key={t._id}
                            onClick={() => {
                              setSelectedEntity({ ...t, entityType: "transaction" });
                              setSearchOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-mono text-foreground truncate">{t.paymentReference || t._id}</span>
                            <span className="text-[10px] font-bold text-emerald-500">+{t.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Statements */}
                    {stmtList.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <FileText size={11} /> Statements
                        </div>
                        {stmtList.slice(0, 3).map((s: any) => (
                          <div
                            key={s._id}
                            onClick={() => {
                              setSelectedEntity({ ...s, entityType: "statement" });
                              setSearchOpen(false);
                            }}
                            className="px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer flex items-center justify-between"
                          >
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

          {/* Filter Button */}
          <button
            onClick={() => setFilterModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
              hasActiveFilters
                ? "border-[#02B2FF] bg-[#02B2FF]/10 text-[#02B2FF]"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <Filter size={14} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#02B2FF] text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE FILTER PILLS */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-muted/40 p-2.5 rounded-xl border border-border">
          <span className="text-muted-foreground font-semibold text-[11px] mr-1">Active Filters:</span>
          {filters.country && (
            <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium flex items-center gap-1 text-[11px]">
              <Globe size={11} className="text-[#02B2FF]" /> Country: {activeCountryName || filters.country}
            </span>
          )}
          {filters.partnerId && (
            <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium flex items-center gap-1 text-[11px]">
              <Building2 size={11} className="text-violet-500" /> Partner: {activePartnerName || filters.partnerId}
            </span>
          )}
          {filters.stationId && (
            <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium flex items-center gap-1 text-[11px]">
              <Radio size={11} className="text-emerald-500" /> Station: {activeStationName || filters.stationId}
            </span>
          )}
          {(filters.dateRange || filters.startDate) && (
            <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-foreground font-medium flex items-center gap-1 text-[11px]">
              <Clock size={11} className="text-amber-500" /> Range: {filters.dateRange || `${filters.startDate} to ${filters.endDate}`}
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 font-semibold transition-colors"
          >
            <RotateCcw size={11} /> Reset Filters
          </button>
        </div>
      )}

      {/* SECTION 1: CORE REAL-TIME KPI CARDS */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <KpiCard
            label="Total Messages"
            value={statsData?.data?.totalMessages ?? "--"}
            sub={isStationAdmin ? "At this station" : "All listener SMS"}
            icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
            iconBg="bg-[#EFF8FF] dark:bg-[#02B2FF]/10"
          />
          <KpiCard
            label="Total Calls"
            value={statsData?.data?.totalCalls ?? "--"}
            sub={isStationAdmin ? "Station callers" : "Inbound phone calls"}
            icon={<Phone size={16} className="text-violet-500" />}
            iconBg="bg-violet-50 dark:bg-violet-950/30"
          />
          <KpiCard
            label={isStationAdmin ? "Station Staff" : "Audience & Users"}
            value={statsData?.data?.totalUsers ?? "--"}
            sub={isStationAdmin ? "Presenters & admins" : "Listeners & stations"}
            icon={<Users size={16} className="text-emerald-500" />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          />
          <KpiCard
            label={isStationAdmin ? "Active Shows" : isPartnerAdmin ? "Partner Stations" : "Total Stations"}
            value={
              isStationAdmin
                ? (statsData?.data?.activeShows ?? "--")
                : (statsData?.data?.totalStations ?? "--")
            }
            sub={isStationAdmin ? "Scheduled programs" : "Radio & TV network"}
            icon={<Radio size={16} className="text-amber-500" />}
            iconBg="bg-amber-50 dark:bg-amber-950/30"
          />
          <KpiCard
            label="Revenue / Credits"
            value={
              statsData?.data?.totalRevenue
                ? `${Number(statsData.data.totalRevenue).toLocaleString()}`
                : "0"
            }
            sub={isStationAdmin ? "Station billing volume" : "Gross platform volume"}
            icon={<CreditCard size={16} className="text-teal-500" />}
            iconBg="bg-teal-50 dark:bg-teal-950/30"
          />
        </div>
      </section>

      {/* SECTION 2: DYNAMIC VISUAL TREND CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Activity Trends (Messages vs Calls) */}
        <Card className="lg:col-span-8 p-5 bg-card border-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity size={15} className="text-[#02B2FF]" />
                Listener Interaction Volume Trends
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Comparison of inbound messages vs voice calls over time
              </p>
            </div>
            {/* Period Switcher */}
            <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border">
              {(["daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${
                    period === p
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartMapped} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#02B2FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#02B2FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="#02B2FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#msgGrad)"
                  name="Messages"
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#callGrad)"
                  name="Calls"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Call Operations & Queue Breakdown */}
        <Card className="lg:col-span-4 p-5 bg-card border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <PhoneCall size={15} className="text-emerald-500" />
                Call Operations & Delivery
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Breakdown of handled, queued, and dropped inbound calls
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Answered & Completed</p>
                  <p className="text-[10px] text-emerald-600/80">Successfully connected to show</p>
                </div>
                <span className="text-base font-bold font-mono text-emerald-600">
                  {callOpsStats?.data?.completed ?? callOpsStats?.data?.answeredCalls ?? statsData?.data?.totalCalls ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#EFF8FF] dark:bg-[#02B2FF]/10 border border-[#02B2FF]/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#02B2FF]">In Queue / Active</p>
                  <p className="text-[10px] text-sky-600/80 dark:text-sky-300/80">Listeners on waiting line</p>
                </div>
                <span className="text-base font-bold font-mono text-[#02B2FF]">
                  {callOpsStats?.data?.queued ?? callOpsStats?.data?.queuedCalls ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">Cut / Refunded</p>
                  <p className="text-[10px] text-rose-600/80">Disconnected with credit refund</p>
                </div>
                <span className="text-base font-bold font-mono text-rose-600">
                  {callOpsStats?.data?.rejected ?? callOpsStats?.data?.rejectedCalls ?? 0}
                </span>
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

      {/* SECTION 3: OPERATIONAL QUICK ACTIONS */}
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

      {/* ENTITY DETAILS QUICK-VIEW MODAL (Triggered by Global Search) */}
      <EntityDetailsModal
        entity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
      />

      {/* DASHBOARD FILTER MODAL */}
      <DashboardFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        role={role}
        currentFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </div>
  );
}
