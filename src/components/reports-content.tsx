"use client";

import { useState } from "react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, MessageSquare, Phone, Activity, Megaphone, Download, Filter, RefreshCw, BarChart3, Globe, ArrowUpRight, ChevronDown } from "lucide-react";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { useGetStatementKPIsQuery } from "@/features/statement/statementApi";
import {
  useGetDashboardStatsQuery,
  useGetMessageActivityQuery,
  useGetRevenueActivityQuery,
  useGetListenerActivityQuery,
  useGetCampaignActivityQuery,
  useGetCallActivityQuery,
  useGetCountryRevenueQuery,
  useGetStationOverviewQuery,
  useGetCampaignStatsQuery,
} from "@/features/dashboard/dashboardApi";
import { useGetChannelPollsQuery } from "@/features/channelPoll/channelPollApi";
import { useChannelType } from "@/hooks/use-channel-type";

const TAB_DEFS = [
  { key: "revenue", label: "Revenue", icon: DollarSign, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
  { key: "polls", label: "Polls & Voting", icon: BarChart3, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
  { key: "messages", label: "Messages", icon: MessageSquare, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
  { key: "calls", label: "Calls", icon: Phone, iconColor: "text-purple-600", iconBg: "bg-purple-50" },
  { key: "listeners", label: "Listener Activity", icon: Activity, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
  { key: "campaigns", label: "Campaign", icon: Megaphone, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
];

export default function ReportsPage() {
  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const { isPollChannel, stationId: myStationId } = useChannelType();

  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin" || role === "media_station" || role === "presenter";

  const showCountryFilter = isSuperAdmin;
  const showPartnerFilter = isSuperAdmin || isPartnerAdmin;
  const showStationFilter = isSuperAdmin || isPartnerAdmin || role === "customer_care";

  const visibleTabs = TAB_DEFS.filter((t) => (isPollChannel ? !["messages", "calls"].includes(t.key) : t.key !== "polls"));

  const [activeTab, setActiveTab] = useState(isPollChannel ? "polls" : "revenue");
  const [period, setPeriod] = useState("monthly");

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [dateRange, setDateRange] = useState("");

  // Dynamic filter dropdown queries
  const { data: countriesRes } = useGetCountriesQuery(undefined, { skip: !showCountryFilter });
  const countriesList = countriesRes?.data || [];

  const effectivePartnerForQuery = isPartnerAdmin ? user?.partnerId : selectedPartner;
  const { data: partnersRes } = useGetPartnersQuery(
    { country: selectedCountry || undefined },
    { skip: !showPartnerFilter || isPartnerAdmin }
  );
  const partnersList = partnersRes?.data || [];

  const { data: stationsRes } = useGetStationsQuery(
    {
      partner: effectivePartnerForQuery || undefined,
      country: selectedCountry || undefined,
    },
    { skip: !showStationFilter || isStationAdmin }
  );
  const stationsList = stationsRes?.data || [];

  // Effective params passed to dashboard analytics APIs
  const effectivePartnerId = isPartnerAdmin ? user?.partnerId : selectedPartner;
  const effectiveStationId = isStationAdmin ? user?.stationId : selectedStation;

  const queryParams = {
    period,
    country: selectedCountry || undefined,
    partnerId: effectivePartnerId || undefined,
    stationId: effectiveStationId || undefined,
    dateRange: dateRange || undefined,
  };

  const { data: kpiData } = useGetStatementKPIsQuery({ station: effectiveStationId || undefined });
  const { data: statsData } = useGetDashboardStatsQuery(queryParams);
  const { data: msgActivity } = useGetMessageActivityQuery(queryParams);
  const { data: revenueActivity } = useGetRevenueActivityQuery(queryParams);
  const { data: listenerActivity } = useGetListenerActivityQuery(queryParams);
  const { data: campaignActivity } = useGetCampaignActivityQuery(queryParams);
  const { data: callActivity } = useGetCallActivityQuery(queryParams);
  const { data: countryRevenueData } = useGetCountryRevenueQuery(queryParams);
  const { data: stationOverviewData } = useGetStationOverviewQuery(queryParams);
  const { data: campaignStatsData } = useGetCampaignStatsQuery(queryParams);
  const { data: channelPollsRes } = useGetChannelPollsQuery(
    { station: effectiveStationId || myStationId },
    { skip: !isPollChannel && !effectiveStationId }
  );
  const channelPolls = channelPollsRes?.data || [];

  const handleCountryChange = (val: string) => {
    setSelectedCountry(val);
    setSelectedPartner("");
    setSelectedStation("");
  };

  const handlePartnerChange = (val: string) => {
    setSelectedPartner(val);
    setSelectedStation("");
  };

  const handleResetFilters = () => {
    setSelectedCountry("");
    if (!isPartnerAdmin) setSelectedPartner("");
    if (!isStationAdmin) setSelectedStation("");
    setDateRange("");
  };

  const dynamicChartData: Record<string, { n: string; v: number }[]> = {
    revenue: (revenueActivity?.data || []).map((d: any) => ({ n: d.date, v: d.count || 0 })),
    polls: (revenueActivity?.data || []).map((d: any) => ({ n: d.date, v: d.count || 0 })),
    messages: (msgActivity?.data || []).map((d: any) => ({ n: d.date, v: d.count || 0 })),
    calls: (callActivity?.data || []).map((d: any) => ({ n: d.date, v: d.count || 0 })),
    listeners: (listenerActivity?.data || []).map((d: any) => ({ n: d.date, v: d.count || 0 })),
    campaigns: (campaignActivity?.data || []).map((d: any) => ({ n: d.date, v: d.count || 0 })),
  };

  const dynamicRevenueRows = (countryRevenueData?.data || []).map((r: any) => ({
    flag: "🌐",
    country: r.countryName || r.name || "Unknown",
    partner: r.partnerName || "Media Network",
    stations: r.stations || 0,
    revenue: `$${(r.revenue || 0).toLocaleString()}`,
    messages: r.messages || 0,
  }));

  const dynamicMessagesRows = (stationOverviewData?.data || []).map((s: any) => ({
    station: s.stationName || "Station",
    messages: s.messagesToday || 0,
    delivered: s.deliveredMessages ?? 0,
    pending: s.pendingMessages ?? 0,
  }));

  const dynamicCallsRows = (stationOverviewData?.data || []).map((s: any) => ({
    station: s.stationName || "Station",
    total: s.callsToday || 0,
    answered: s.answeredCalls ?? 0,
    missed: s.missedCalls ?? 0,
  }));

  const dynamicListenersRows = (stationOverviewData?.data || []).map((s: any) => ({
    station: s.stationName || "Station",
    listeners: s.activeListeners ?? 0,
    messages: s.messagesToday || 0,
    calls: s.callsToday || 0,
  }));

  const dynamicCampaignsRows = (stationOverviewData?.data || []).map((s: any) => ({
    station: s.stationName || "Station",
    activeCampaigns: s.activeCampaigns ?? 0,
    views: campaignStatsData?.data?.campaignViews || 0,
  }));

  const renderChart = () => {
    const data = dynamicChartData[activeTab] || [];

    if (!data || data.length === 0) {
      return (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No chart analytics available</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">No performance records found for the selected scope or period.</p>
        </div>
      );
    }

    const yDomain: [number, number] = (() => {
      const maxVal = Math.max(...data.map(d => d.v || 0), 10);
      return [0, Math.ceil(maxVal * 1.2)];
    })();

    if (activeTab === "messages" || activeTab === "calls") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="n" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis domain={yDomain} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="v" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    const colorMap: Record<string, { stroke: string; fill: string }> = {
      revenue: { stroke: "#10B981", fill: "#10B981" },
      listeners: { stroke: "#02B2FF", fill: "#02B2FF" },
      campaigns: { stroke: "#F59E0B", fill: "#F59E0B" },
    };
    const { stroke, fill } = colorMap[activeTab] ?? { stroke: "#02B2FF", fill: "#02B2FF" };

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="n" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis domain={yDomain} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="v" stroke={stroke} fill={fill} fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderTable = () => {
    const mono = "font-['JetBrains_Mono',monospace]";

    if (activeTab === "revenue") {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Partner</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stations</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages</th>
            </tr>
          </thead>
          <tbody>
            {dynamicRevenueRows.length > 0 ? (
              dynamicRevenueRows.map((row: any, idx: number) => (
                <tr key={row.country + idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{row.flag}</span>
                      <span className="text-xs font-semibold text-foreground">{row.country}</span>
                      <Globe size={11} className="text-muted-foreground"/>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">{row.partner}</td>
                  <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.stations}</td>
                  <td className={`px-5 py-3.5 text-right text-xs font-bold ${mono}`}>{row.revenue}</td>
                  <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.messages.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-xs text-muted-foreground">
                  No revenue data available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === "polls") {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poll Title</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categories</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nominees</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Votes</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Billing Mode</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {channelPolls.length > 0 ? (
              channelPolls.map((poll: any) => {
                const categoryCount = poll.categories?.length || 0;
                const totalNominees = (poll.categories || []).reduce((acc: number, c: any) => acc + (c.nominees?.length || 0), 0);
                return (
                  <tr key={poll._id || poll.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{poll.title}</td>
                    <td className={`px-5 py-3.5 text-center text-xs ${mono}`}>{categoryCount}</td>
                    <td className={`px-5 py-3.5 text-center text-xs ${mono}`}>{totalNominees}</td>
                    <td className={`px-5 py-3.5 text-right text-xs font-semibold text-[#02B2FF] ${mono}`}>{poll.totalVotes || 0}</td>
                    <td className="px-5 py-3.5 text-center text-xs">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${poll.billingMode === "credits" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                        {poll.billingMode === "credits" ? `${poll.creditCost || 0} Credits` : "Free"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs">
                      <StatusBadge label={poll.status || "active"} variant={sv(poll.status || "active")} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-xs text-muted-foreground">
                  No channel poll records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === "messages") {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivered</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending</th>
            </tr>
          </thead>
          <tbody>
            {dynamicMessagesRows.length > 0 ? (
              dynamicMessagesRows.map((row: any, idx: number) => (
                <tr key={row.station + idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{row.station}</td>
                  <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.messages.toLocaleString()}</td>
                  <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.delivered.toLocaleString()}</td>
                  <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.pending.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">
                  No message activity available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === "calls") {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Calls</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Answered</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Missed</th>
            </tr>
          </thead>
          <tbody>
            {dynamicCallsRows.length > 0 ? (
              dynamicCallsRows.map((row: any, idx: number) => (
                <tr key={row.station + idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{row.station}</td>
                  <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.total.toLocaleString()}</td>
                  <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.answered.toLocaleString()}</td>
                  <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.missed.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">
                  No call records available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === "listeners") {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Listeners</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calls</th>
            </tr>
          </thead>
          <tbody>
            {dynamicListenersRows.length > 0 ? (
              dynamicListenersRows.map((row: any, idx: number) => (
                <tr key={row.station + idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{row.station}</td>
                  <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.listeners.toLocaleString()}</td>
                  <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.messages.toLocaleString()}</td>
                  <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.calls.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">
                  No listener activity available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeTab === "campaigns") {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Campaigns</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Campaign Views</th>
            </tr>
          </thead>
          <tbody>
            {dynamicCampaignsRows.length > 0 ? (
              dynamicCampaignsRows.map((row: any, idx: number) => (
                <tr key={row.station + idx} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{row.station}</td>
                  <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.activeCampaigns.toLocaleString()}</td>
                  <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.views.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-xs text-muted-foreground">
                  No active campaigns available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <div className="space-y-7">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <BarChart3 className="h-5 w-5 text-[#02B2FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isSuperAdmin && "Analyse platform performance across all countries, partners, stations, campaigns, messages, calls, listeners and revenue."}
              {isPartnerAdmin && "Analyse performance for your partner stations and media networks."}
              {isStationAdmin && "Analyse performance for your assigned radio or TV station."}
              {!isSuperAdmin && !isPartnerAdmin && !isStationAdmin && "Analyse performance across stations, campaigns, messages, and calls."}
            </p>
          </div>
        </div>
        <Button variant="default" className="gap-1.5 bg-[#02B2FF] text-white hover:bg-[#02B2FF]/90">
          <Download size={16} />
          Export Report
        </Button>
      </div>

      {/* 2. Dynamic Filters Row */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground shrink-0">
            <Filter size={16} className="text-muted-foreground" />
            Filters
          </div>

          {/* Country Filter (Super Admin only) */}
          {showCountryFilter && (
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="appearance-none pr-8 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
              >
                <option value="">All Countries</option>
                {countriesList.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Partner Filter (Super Admin & Partner Admin) */}
          {showPartnerFilter && !isPartnerAdmin && (
            <div className="relative">
              <select
                value={selectedPartner}
                onChange={(e) => handlePartnerChange(e.target.value)}
                className="appearance-none pr-8 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
              >
                <option value="">All Partners</option>
                {partnersList.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Station Filter (Super Admin & Partner Admin) */}
          {showStationFilter && !isStationAdmin && (
            <div className="relative">
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="appearance-none pr-8 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
              >
                <option value="">All Stations</option>
                {stationsList.map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Date Range Filter */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pr-8 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
            >
              <option value="">Date Range</option>
              <option value="year">This Year</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="gap-1"
          >
            <RefreshCw size={12} />
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* 3. Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Revenue Report"
          value={`$${(statsData?.data?.totalRevenue || 0).toLocaleString()}`}
          icon={<DollarSign size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          selected={activeTab === "revenue"}
          onClick={() => setActiveTab("revenue")}
        />
        <KpiCard
          label="Messages Report"
          value={(statsData?.data?.totalMessages || 0).toLocaleString()}
          icon={<MessageSquare size={18} className="text-blue-600" />}
          iconBg="bg-blue-50"
          selected={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
        />
        <KpiCard
          label="Calls Report"
          value={(statsData?.data?.totalCalls || 0).toLocaleString()}
          icon={<Phone size={18} className="text-purple-600" />}
          iconBg="bg-purple-50"
          selected={activeTab === "calls"}
          onClick={() => setActiveTab("calls")}
        />
        <KpiCard
          label="Listener Activity Report"
          value={(kpiData?.data?.totalInteractions || 0).toLocaleString()}
          icon={<Activity size={18} className="text-amber-600" />}
          iconBg="bg-amber-50"
          selected={activeTab === "listeners"}
          onClick={() => setActiveTab("listeners")}
        />
        <KpiCard
          label="Campaign Performance Report"
          value={(campaignStatsData?.data?.campaignViews || 0).toLocaleString()}
          icon={<Megaphone size={18} className="text-rose-600" />}
          iconBg="bg-rose-50"
          selected={activeTab === "campaigns"}
          onClick={() => setActiveTab("campaigns")}
        />
      </div>

      {/* 4. Tab Bar + Period Filter */}
      <div className="flex items-center justify-between border-b">
        <div className="flex -mb-px gap-0">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#02B2FF] text-[#02B2FF]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Icon size={14} className={isActive ? tab.iconColor : ""} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 bg-muted dark:bg-white/10 rounded-lg p-0.5">
          {["monthly", "quarterly", "yearly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                period === p ? "bg-background dark:bg-white/15 text-[#02B2FF] shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Chart Area */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-foreground">
              {activeTab === "revenue" && "Revenue Report"}
              {activeTab === "messages" && "Messages Report"}
              {activeTab === "calls" && "Calls Report"}
              {activeTab === "listeners" && "Listener Activity Report"}
              {activeTab === "campaigns" && "Campaign Performance Report"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Performance trend — {period}</p>
          </div>
          <div className="h-[300px]">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {/* 6. Data Table */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {activeTab === "revenue" && "Revenue Report — Data Table"}
          {activeTab === "messages" && "Messages Report — Data Table"}
          {activeTab === "calls" && "Calls Report — Data Table"}
          {activeTab === "listeners" && "Listener Activity Report — Data Table"}
          {activeTab === "campaigns" && "Campaign Performance Report — Data Table"}
        </p>
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {renderTable()}
          </div>
        </div>
      </div>
    </div>
  );
}