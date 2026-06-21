"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Download,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  Radio,
  Send,
  User,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import messagesData from "@/mock/messages.json";
import stationsData from "@/mock/stations.json";

interface Message {
  id: string;
  created: string;
  msisdn: string;
  stationId: string;
  station: string;
  show: string;
  preview: string;
  fullMessage: string;
  operator: string;
  country: string;
  status: string;
}

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda"];
const OPERATORS = ["Safaricom", "MTN", "Airtel", "Vodacom"];
const PER_PAGE = 10;

export default function MessagesContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const isMediaStation = role === "media_station";

  const showCountry = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;

  const allRows = useMemo(() => {
    const msgs = messagesData.messages as Message[];
    if (isPartnerAdmin) {
      const partnerStationIds = stationsData.stations
        .filter((s) => s.partnerId === "PA-001")
        .map((s) => s.id);
      return msgs.filter((m) => partnerStationIds.includes(m.stationId));
    }
    if (isStationAdmin || isMediaStation) {
      return msgs.filter((m) => m.stationId === "RS-001");
    }
    return msgs;
  }, [isPartnerAdmin, isStationAdmin, isMediaStation]);

  const [rows] = useState<Message[]>(allRows);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [showFilter, setShowFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);

  const total = rows.length;
  const today = rows.filter((r) => r.created.startsWith("2024-06-18")).length;
  const delivered = rows.filter((r) => r.status === "Delivered").length;
  const pending = rows.filter((r) => r.status === "Pending").length;

  const uniqueStations = useMemo(() => {
    return [...new Set(rows.map((m) => m.station))].sort();
  }, [rows]);

  const uniqueShows = useMemo(() => {
    return [...new Set(rows.map((m) => m.show))].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.msisdn.includes(q) && !r.preview.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
      if (showCountry && countryFilter && r.country !== countryFilter) return false;
      if (showStation && stationFilter && r.station !== stationFilter) return false;
      if (showFilter && r.show !== showFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, countryFilter, stationFilter, showFilter, statusFilter, showCountry, showStation]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);

  const colCount = (showCountry ? 1 : 0) + (showStation ? 1 : 0) + 6;

  // Media Station chat interface
  if (isMediaStation) {
    return <MediaStationMessages rows={rows} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor all listener messages sent to stations and shows across the platform.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
          <Download size={14} /> Export Messages
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Messages"
          value={String(total)}
          sub="All listener messages received"
          icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
          trend={{ val: "+12.4% vs last month", up: true }}
        />
        <KpiCard
          label="Messages Today"
          value={String(today)}
          sub="Messages received today"
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
          trend={{ val: "+8 from yesterday vs last month", up: true }}
        />
        {showStation && (
          <KpiCard
            label="Active Stations"
            value={String(uniqueStations.length)}
            sub="Stations currently receiving messages"
            icon={<Radio size={16} className="text-violet-500" />}
            iconBg="bg-violet-50"
          />
        )}
        <KpiCard
          label="Active Shows"
          value={String(uniqueShows.length)}
          sub="Shows currently receiving messages"
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by MSISDN, message content, or ID..."
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
          <FilterSelect value={showFilter} onChange={(v) => { setShowFilter(v); setPg(1); }}
            options={uniqueShows.map((s) => ({ value: s, label: s }))}
            placeholder="All Shows" className="w-44" />
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "Delivered", label: "Delivered" },
              { value: "Pending", label: "Pending" },
            ]}
            placeholder="All Status" className="w-36" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} messages{" "}
            <span className="inline-flex items-center gap-2 ml-2">
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {delivered} delivered</span>
              <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#02B2FF]" /> {pending} pending</span>
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">MSISDN</th>
                {showStation && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message Preview</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Operator</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No messages found.
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{row.created}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground font-['JetBrains_Mono',monospace]">{row.msisdn}</span>
                    </td>
                    {showStation && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#EFF8FF] flex items-center justify-center">
                            <Radio size={10} className="text-[#02B2FF]" />
                          </div>
                          <span className="text-xs font-medium text-foreground">{row.station}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.show}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{row.preview}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.operator}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={row.status} variant={sv(row.status)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/messages/${row.id}`}
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

        <TablePagination pg={pg} totalPages={totalPgs} totalItems={filtered.length} itemLabel="messages" setPg={setPg} />
      </div>
    </div>
  );
}

// Media Station Chat Interface
function MediaStationMessages({ rows }: { rows: Message[] }) {
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(rows[0] || null);
  const [tab, setTab] = useState<"incoming" | "replied">("incoming");
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");

  const incoming = rows.filter((m) => m.status === "Pending");
  const replied = rows.filter((m) => m.status === "Delivered");
  const displayMessages = tab === "incoming" ? incoming : replied;

  const filteredMessages = useMemo(() => {
    if (!search) return displayMessages;
    const q = search.toLowerCase();
    return displayMessages.filter(
      (m) => m.msisdn.includes(q) || m.preview.toLowerCase().includes(q)
    );
  }, [displayMessages, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage live listener messages for the current show
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Total Messages"
          value={String(rows.length)}
          icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Unread Messages"
          value={String(incoming.length)}
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Replied Messages"
          value={String(replied.length)}
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-12 gap-4 h-[600px]">
        {/* Left Panel - Message List */}
        <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
            </div>
          </div>
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("incoming")}
              className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
                tab === "incoming"
                  ? "text-[#02B2FF] border-b-2 border-[#02B2FF] bg-[#EFF8FF]/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Incoming <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] text-[10px]">{incoming.length}</span>
            </button>
            <button
              onClick={() => setTab("replied")}
              className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
                tab === "replied"
                  ? "text-[#02B2FF] border-b-2 border-[#02B2FF] bg-[#EFF8FF]/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Replied <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px]">{replied.length}</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedMsg(msg)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${
                  selectedMsg?.id === msg.id ? "bg-[#EFF8FF]/50 border-l-2 border-l-[#02B2FF]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{msg.msisdn}</span>
                  <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">{msg.created.split(" ")[1]}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{msg.preview}</p>
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                  msg.status === "Pending"
                    ? "bg-[#02B2FF]/10 text-[#02B2FF]"
                    : "bg-emerald-100 text-emerald-600"
                }`}>
                  {msg.status === "Pending" ? "Incoming" : "Replied"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Panel - Message Detail + Reply */}
        <div className="col-span-6 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {selectedMsg ? (
            <>
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Message Details</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedMsg.msisdn}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    selectedMsg.status === "Pending"
                      ? "bg-[#02B2FF]/10 text-[#02B2FF]"
                      : "bg-emerald-100 text-emerald-600"
                  }`}>
                    {selectedMsg.status === "Pending" ? "Incoming" : "Replied"}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Listener Info */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Listener Information</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#02B2FF] flex items-center justify-center text-white text-xs font-bold">
                      {selectedMsg.msisdn.slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedMsg.msisdn}</p>
                      <p className="text-[11px] text-muted-foreground">Received at {selectedMsg.created.split(" ")[1]}</p>
                    </div>
                  </div>
                </div>

                {/* Full Message */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Full Message</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedMsg.fullMessage}</p>
                </div>
              </div>

              {/* Reply Area */}
              <div className="p-4 border-t border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reply Area</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your reply to this listener..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
                  />
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
                    <Send size={14} /> Send Reply
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a message to view details
            </div>
          )}
        </div>

        {/* Right Panel - Current Show */}
        <div className="col-span-3 space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Current Show</p>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> ON AIR
              </span>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground font-['JetBrains_Mono',monospace]">22:40:20</p>
              <p className="text-sm font-semibold text-foreground mt-2">Morning Drive Show</p>
              <p className="text-xs text-muted-foreground">DJ Marcus Cole</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">06:00</span>
                <span className="text-muted-foreground">—</span>
                <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">10:00</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">This Show</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Messages received</span>
                <span className="text-xs font-bold text-foreground">{rows.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Replied</span>
                <span className="text-xs font-bold text-emerald-600">{rows.filter((m) => m.status === "Delivered").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Pending</span>
                <span className="text-xs font-bold text-[#02B2FF]">{rows.filter((m) => m.status === "Pending").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">On air</span>
                <span className="text-xs font-bold text-foreground">5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
