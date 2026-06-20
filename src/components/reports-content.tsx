"use client";

import { useState } from "react";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionHeader, StatusBadge, sv } from "@/components/shared/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, MessageSquare, Phone, Activity, Megaphone, Download, Filter, RefreshCw, ExternalLink, BarChart3, Globe, ArrowUpRight } from "lucide-react";

const TAB_DEFS = [
  { key: "revenue", label: "Revenue", icon: DollarSign, iconColor: "text-emerald-600", iconBg: "bg-emerald-50" },
  { key: "messages", label: "Messages", icon: MessageSquare, iconColor: "text-blue-600", iconBg: "bg-blue-50" },
  { key: "calls", label: "Calls", icon: Phone, iconColor: "text-purple-600", iconBg: "bg-purple-50" },
  { key: "listeners", label: "Listener Activity", icon: Activity, iconColor: "text-amber-600", iconBg: "bg-amber-50" },
  { key: "campaigns", label: "Campaign", icon: Megaphone, iconColor: "text-rose-600", iconBg: "bg-rose-50" },
] as const;

const chartData: Record<string, { n: string; v: number }[]> = {
  revenue: [
    { n: "Jan", v: 18000 },
    { n: "Feb", v: 20000 },
    { n: "Mar", v: 22000 },
    { n: "Apr", v: 24000 },
    { n: "May", v: 28000 },
    { n: "Jun", v: 32000 },
  ],
  messages: [
    { n: "Jan", v: 28000 },
    { n: "Feb", v: 25000 },
    { n: "Mar", v: 35000 },
    { n: "Apr", v: 42000 },
    { n: "May", v: 38000 },
    { n: "Jun", v: 48000 },
  ],
  calls: [
    { n: "Jan", v: 7500 },
    { n: "Feb", v: 7000 },
    { n: "Mar", v: 8500 },
    { n: "Apr", v: 9500 },
    { n: "May", v: 8800 },
    { n: "Jun", v: 11000 },
  ],
  listeners: [
    { n: "Jan", v: 4200 },
    { n: "Feb", v: 4800 },
    { n: "Mar", v: 5200 },
    { n: "Apr", v: 5800 },
    { n: "May", v: 6200 },
    { n: "Jun", v: 6800 },
  ],
  campaigns: [
    { n: "Jan", v: 350000 },
    { n: "Feb", v: 420000 },
    { n: "Mar", v: 550000 },
    { n: "Apr", v: 700000 },
    { n: "May", v: 900000 },
    { n: "Jun", v: 1100000 },
  ],
};

const revenueRows = [
  { flag: "🇰🇪", country: "Kenya", partner: "Capital FM Group", stations: 14, revenue: "$28,400", growth: "+12.4%" },
  { flag: "🇳🇬", country: "Nigeria", partner: "Peace FM Group", stations: 14, revenue: "$38,500", growth: "+21.3%" },
  { flag: "🇺🇬", country: "Uganda", partner: "Radio Uganda Ltd", stations: 14, revenue: "$18,200", growth: "+8.7%" },
  { flag: "🇬🇭", country: "Ghana", partner: "Joy Media Ghana", stations: 14, revenue: "$15,600", growth: "+15.2%" },
  { flag: "🇹🇿", country: "Tanzania", partner: "Tanzania Media Corp", stations: 14, revenue: "$10,800", growth: "+6.1%" },
  { flag: "🇷🇼", country: "Rwanda", partner: "Capital FM Group", stations: 14, revenue: "$5,900", growth: "+4.8%" },
];

const messagesRows = [
  { station: "Capital FM Kenya", messages: 48200, delivered: 45800, pending: 2400 },
  { station: "Star FM Nigeria", messages: 62000, delivered: 58900, pending: 3100 },
  { station: "Radio Uganda", messages: 31600, delivered: 30200, pending: 1400 },
  { station: "Joy FM Ghana", messages: 26800, delivered: 25400, pending: 1400 },
  { station: "Citizen TV", messages: 41000, delivered: 39200, pending: 1800 },
  { station: "Hot 96", messages: 18400, delivered: 17600, pending: 800 },
  { station: "Peace FM", messages: 9800, delivered: 9400, pending: 400 },
];

const callsRows = [
  { station: "Capital FM Kenya", total: 13400, answered: 11580, missed: 1820 },
  { station: "Star FM Nigeria", total: 17800, answered: 15200, missed: 2600 },
  { station: "Radio Uganda", total: 8900, answered: 7700, missed: 1200 },
  { station: "Joy FM Ghana", total: 7200, answered: 6300, missed: 900 },
  { station: "Citizen TV", total: 11300, answered: 9800, missed: 1500 },
  { station: "Hot 96", total: 4900, answered: 4200, missed: 700 },
  { station: "Peace FM", total: 2600, answered: 2300, missed: 300 },
];

const listenersRows = [
  { station: "Capital FM Kenya", listeners: 4820, messages: 48200, calls: 13400 },
  { station: "Star FM Nigeria", listeners: 6200, messages: 62000, calls: 17800 },
  { station: "Radio Uganda", listeners: 3160, messages: 31600, calls: 8900 },
  { station: "Joy FM Ghana", listeners: 2680, messages: 26800, calls: 7200 },
  { station: "Citizen TV", listeners: 4100, messages: 41000, calls: 11300 },
  { station: "Hot 96", listeners: 1840, messages: 18400, calls: 4900 },
  { station: "Peace FM", listeners: 980, messages: 9800, calls: 2600 },
];

const campaignRows = [
  { campaign: "Ramadan Greetings 2024", station: "Capital FM Kenya", views: 28400, duration: "All Time", status: "Active" },
  { campaign: "Star FM Nigeria Promo", station: "Star FM Nigeria", views: 44100, duration: "12 Hours", status: "Expired" },
  { campaign: "Hot 96 Summer Vibes", station: "Hot 96", views: 15600, duration: "All Time", status: "Active" },
  { campaign: "Capital FM Traffic", station: "Capital FM Kenya", views: 19800, duration: "All Time", status: "Active" },
  { campaign: "Citizen TV Debate Night", station: "Citizen TV", views: 62000, duration: "12 Hours", status: "Expired" },
  { campaign: "Morning Drive Promo", station: "Radio Uganda", views: 12100, duration: "72 Hours", status: "Active" },
  { campaign: "Joy FM Birthday Bash", station: "Joy FM Ghana", views: 9800, duration: "48 Hours", status: "Expired" },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("revenue");
  const [period, setPeriod] = useState("monthly");

  const renderChart = () => {
    const data = chartData[activeTab];
    const yDomain: [number, number] = (() => {
      switch (activeTab) {
        case "revenue": return [0, 32000];
        case "messages": return [0, 60000];
        case "calls": return [0, 14000];
        case "listeners": return [0, 8000];
        case "campaigns": return [0, 1400000];
        default: return [0, 100];
      }
    })();

    if (activeTab === "messages" || activeTab === "calls") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Growth</th>
            </tr>
          </thead>
          <tbody>
            {revenueRows.map((row) => (
              <tr key={row.country} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
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
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <ArrowUpRight size={12}/>{row.growth}
                  </span>
                </td>
              </tr>
            ))}
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
            {messagesRows.map((row) => (
              <tr key={row.station} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{row.station}</td>
                <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.messages.toLocaleString()}</td>
                <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.delivered.toLocaleString()}</td>
                <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.pending.toLocaleString()}</td>
              </tr>
            ))}
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
            {callsRows.map((row) => (
              <tr key={row.station} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{row.station}</td>
                <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.total.toLocaleString()}</td>
                <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.answered.toLocaleString()}</td>
                <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.missed.toLocaleString()}</td>
              </tr>
            ))}
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
            {listenersRows.map((row) => (
              <tr key={row.station} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{row.station}</td>
                <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.listeners.toLocaleString()}</td>
                <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.messages.toLocaleString()}</td>
                <td className={`px-5 py-3.5 text-right text-xs ${mono}`}>{row.calls.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === "campaigns") {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campaign</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Views</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaignRows.map((row) => (
              <tr key={row.campaign} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{row.campaign}</td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">{row.station}</td>
                <td className={`px-5 py-3.5 text-right text-xs font-medium ${mono}`}>{row.views.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {row.duration}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge label={row.status} variant={sv(row.status)} />
                </td>
              </tr>
            ))}
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
              Analyse platform performance across all stations, campaigns, messages, calls, listeners and revenue.
            </p>
          </div>
        </div>
        <Button variant="default" className="gap-1.5 bg-[#02B2FF] text-white hover:bg-[#02B2FF]/90">
          <Download size={16} />
          Export Report
        </Button>
      </div>

      {/* 2. Filters Row */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground shrink-0">
            <Filter size={16} className="text-muted-foreground" />
            Filters
          </div>
          <select className="px-3 py-2 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
            <option>All Countries</option>
            <option>Kenya</option>
            <option>Uganda</option>
            <option>Ghana</option>
            <option>Tanzania</option>
            <option>Nigeria</option>
            <option>Rwanda</option>
          </select>
          <select className="px-3 py-2 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
            <option>All Partners</option>
            <option>Capital FM Group</option>
            <option>Radio Uganda Ltd</option>
            <option>Joy Media Ghana</option>
            <option>Tanzania Media Corp</option>
            <option>Peace FM Group</option>
          </select>
          <select className="px-3 py-2 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
            <option>All Stations</option>
            <option>Capital FM Kenya</option>
            <option>Radio Uganda</option>
            <option>Joy FM Ghana</option>
            <option>Citizen TV</option>
            <option>NTV Uganda</option>
            <option>Peace FM</option>
            <option>Hot 96</option>
          </select>
          <select className="px-3 py-2 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
            <option>Date Range</option>
            <option>This Year</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Month</option>
            <option>This Quarter</option>
          </select>
          <div className="flex-1" />
          <Button variant="default" size="sm" className="bg-[#02B2FF] text-white hover:bg-[#02B2FF]/90">
            Apply
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCw size={12} />
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* 3. Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Revenue Report"
          value="$248,400"
          trend={{ val: "+22.1%", up: true }}
          icon={<DollarSign size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          selected={activeTab === "revenue"}
          onClick={() => setActiveTab("revenue")}
        />
        <KpiCard
          label="Messages Report"
          value="4.8M"
          trend={{ val: "+18.4%", up: true }}
          icon={<MessageSquare size={18} className="text-blue-600" />}
          iconBg="bg-blue-50"
          selected={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
        />
        <KpiCard
          label="Calls Report"
          value="1.3M"
          trend={{ val: "+9.1%", up: true }}
          icon={<Phone size={18} className="text-purple-600" />}
          iconBg="bg-purple-50"
          selected={activeTab === "calls"}
          onClick={() => setActiveTab("calls")}
        />
        <KpiCard
          label="Listener Activity Report"
          value="52,416"
          trend={{ val: "+15.2%", up: true }}
          icon={<Activity size={18} className="text-amber-600" />}
          iconBg="bg-amber-50"
          selected={activeTab === "listeners"}
          onClick={() => setActiveTab("listeners")}
        />
        <KpiCard
          label="Campaign Performance Report"
          value="12.4M"
          trend={{ val: "+31%", up: true }}
          icon={<Megaphone size={18} className="text-rose-600" />}
          iconBg="bg-rose-50"
          selected={activeTab === "campaigns"}
          onClick={() => setActiveTab("campaigns")}
        />
      </div>

      {/* 4. Tab Bar + Period Filter */}
      <div className="flex items-center justify-between border-b">
        <div className="flex -mb-px gap-0">
          {TAB_DEFS.map((tab) => {
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
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {["monthly", "quarterly", "yearly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                period === p ? "bg-white text-[#02B2FF] shadow-sm" : "text-muted-foreground hover:text-foreground"
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {activeTab === "revenue" && "Revenue Report"}
                {activeTab === "messages" && "Messages Report"}
                {activeTab === "calls" && "Calls Report"}
                {activeTab === "listeners" && "Listener Activity Report"}
                {activeTab === "campaigns" && "Campaign Performance Report"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Performance trend — {period}</p>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-[#02B2FF] hover:underline">
              View Full Report
              <ExternalLink size={14} />
            </button>
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