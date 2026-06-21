"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Database,
  Download,
  Search,
  Eye,
  Users,
  MessageSquare,
  Phone,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { useRole } from "@/contexts/role-context";
import listenersData from "@/mock/listeners.json";
import stationsData from "@/mock/stations.json";

interface Listener {
  id: string;
  msisdn: string;
  country: string;
  operator: string;
  stationId: string;
  station: string;
  messages: number;
  calls: number;
  totalSpend: number;
  lastActivity: string;
  registrationDate: string;
  status: string;
}

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda"];
const OPERATORS = ["Safaricom", "MTN", "Airtel", "Vodacom"];
const PER_PAGE = 10;

export default function CrmContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const showCountry = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;

  const allRows = useMemo(() => {
    const listeners = listenersData.listeners as Listener[];
    if (isPartnerAdmin) {
      const partnerStationIds = stationsData.stations
        .filter((s) => s.partnerId === "PA-001")
        .map((s) => s.id);
      return listeners.filter((l) => partnerStationIds.includes(l.stationId));
    }
    if (isStationAdmin) {
      return listeners.filter((l) => l.stationId === "RS-001");
    }
    return listeners;
  }, [isPartnerAdmin, isStationAdmin]);

  const [rows] = useState<Listener[]>(allRows);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("");
  const [pg, setPg] = useState(1);

  const total = rows.length;
  const active = rows.filter((r) => r.status === "Active").length;
  const totalMessages = rows.reduce((sum, r) => sum + r.messages, 0);
  const totalCalls = rows.reduce((sum, r) => sum + r.calls, 0);

  const uniqueStations = useMemo(() => {
    return [...new Set(rows.map((l) => l.station))].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.msisdn.includes(q) && !r.id.toLowerCase().includes(q) && !r.country.toLowerCase().includes(q)) return false;
      if (showCountry && countryFilter && r.country !== countryFilter) return false;
      if (showStation && stationFilter && r.station !== stationFilter) return false;
      if (operatorFilter && r.operator !== operatorFilter) return false;
      return true;
    });
  }, [rows, search, countryFilter, stationFilter, operatorFilter, showCountry, showStation]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);

  const colCount = (showCountry ? 1 : 0) + (showStation ? 1 : 0) + 7;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
            <Database size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CRM</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage listener profiles and interaction history across the platform.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
          <Download size={14} /> Export CRM Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Listeners"
          value={String(total)}
          sub="All registered listener records"
          icon={<Users size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
          trend={{ val: "+5.2% vs last month", up: true }}
        />
        <KpiCard
          label="Active Listeners"
          value={String(active)}
          sub="Listeners with recent activity"
          icon={<TrendingUp size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
          trend={{ val: "+12 today vs last month", up: true }}
        />
        <KpiCard
          label="Total Messages"
          value={String(totalMessages)}
          sub="Messages sent by listeners"
          icon={<MessageSquare size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
          trend={{ val: "+8.4% vs last month", up: true }}
        />
        <KpiCard
          label="Total Calls"
          value={String(totalCalls)}
          sub="Calls made by listeners"
          icon={<Phone size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
          trend={{ val: "+6.1% vs last month", up: true }}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by MSISDN, Listener ID, or country..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showCountry && (
            <FilterSelect value={countryFilter} onChange={(v) => { setCountryFilter(v); setPg(1); }}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="All Countries" className="w-40" />
          )}
          {showStation && (
            <FilterSelect value={stationFilter} onChange={(v) => { setStationFilter(v); setPg(1); }}
              options={uniqueStations.map((s) => ({ value: s, label: s }))}
              placeholder="All Stations" className="w-48" />
          )}
          <FilterSelect value={operatorFilter} onChange={(v) => { setOperatorFilter(v); setPg(1); }}
            options={OPERATORS.map((o) => ({ value: o, label: o }))}
            placeholder="All Operators" className="w-40" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} listener records
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Listener ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">MSISDN</th>
                {showCountry && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calls</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Spend</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Activity</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No listener records found.
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/crm/${row.id}`} className="text-xs font-semibold text-[#02B2FF] hover:underline font-['JetBrains_Mono',monospace]">
                        {row.id}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground font-['JetBrains_Mono',monospace]">{row.msisdn}</span>
                    </td>
                    {showCountry && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🌍</span>
                          <span className="text-xs text-muted-foreground">{row.country}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.operator}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={12} className="text-violet-400" />
                        <span className="text-xs font-medium text-foreground">{row.messages}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-400" />
                        <span className="text-xs font-medium text-foreground">{row.calls}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-foreground">${row.totalSpend.toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{row.lastActivity}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/crm/${row.id}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="View"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={totalPgs} totalItems={filtered.length} itemLabel="listener records" setPg={setPg} />
      </div>
    </div>
  );
}
