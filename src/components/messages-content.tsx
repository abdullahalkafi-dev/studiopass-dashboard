"use client";

import { useState, useMemo, useEffect } from "react";
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
import {
  useGetMessagesQuery,
  useGetThreadsQuery,
  useGetThreadQuery,
  useSendReplyMutation,
  useLazyExportMessagesQuery,
} from "@/features/message/messageApi";
import { useGetActiveShowQuery } from "@/features/show/showApi";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";


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

interface ThreadRow {
  msisdn: string;
  lastMessage: string;
  unrepliedCount: number;
  showName: string;
  stationName: string;
  stationId: string;
  totalMessages: number;
  lastMessageAt?: string;
}

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda"];
const OPERATORS = ["Safaricom", "MTN", "Airtel", "Vodacom"];
const PER_PAGE = 10;

function threadToMessage(t: ThreadRow): Message {
  return {
    id: t.msisdn,
    created: (t as any).lastMessageAt || "N/A",
    msisdn: t.msisdn,
    stationId: t.stationId,
    station: t.stationName,
    show: t.showName,
    preview: t.lastMessage,
    fullMessage: t.lastMessage,
    operator: "N/A",
    country: "N/A",
    status: t.unrepliedCount > 0 ? "Pending" : "Delivered",
  };
}

function ThreadSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-3 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-14 bg-muted rounded-xl animate-pulse" />
      <div className="h-96 bg-muted rounded-xl animate-pulse" />
    </div>
  );
}

export default function MessagesContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const isMediaStation = role === "media_station";

  const showCountry = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;

  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId;

  const [triggerExport] = useLazyExportMessagesQuery();
  const [pg, setPg] = useState(1);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [showFilter, setShowFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleExport = async () => {
    try {
      const result = await triggerExport({ stationId, format: "csv" }).unwrap();
      const blob = new Blob([result as unknown as string], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "messages-export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  const { data: messagesResponse, isLoading, isError } = useGetMessagesQuery({
    stationId:
      isStationAdmin || isMediaStation ? stationId : undefined,
    page: pg,
    limit: 20,
  });

  const apiMessages = messagesResponse?.data ?? [];
  const meta = messagesResponse?.meta;

  const rows: Message[] = useMemo(
    () =>
      apiMessages.map((m: any) => ({
        id: m.id,
        created: m.createdAt || "N/A",
        msisdn: m.msisdn || "—",
        stationId: typeof m.stationId === "object" ? m.stationId?._id || "" : m.stationId || "",
        station: typeof m.stationId === "object" ? m.stationId?.name || "" : "",
        show: m.showName || "",
        preview: m.content || "",
        fullMessage: m.content || "",
        operator: "N/A",
        country: "N/A",
        status: m.status === "delivered" ? "Delivered" : m.status === "pending" ? "Pending" : "Delivered",
      })),
    [apiMessages]
  );

  const total = meta?.total ?? rows.length;
  const today = rows.filter((r) => {
    if (!r.created || r.created === "N/A") return false;
    return new Date(r.created).toDateString() === new Date().toDateString();
  }).length;
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
      if (
        q &&
        !r.msisdn.includes(q) &&
        !r.preview.toLowerCase().includes(q) &&
        !r.id.toLowerCase().includes(q)
      )
        return false;
      if (showCountry && countryFilter && r.country !== countryFilter)
        return false;
      if (showStation && stationFilter && r.station !== stationFilter)
        return false;
      if (showFilter && r.show !== showFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [
    rows,
    search,
    countryFilter,
    stationFilter,
    showFilter,
    statusFilter,
    showCountry,
    showStation,
  ]);

  const totalPgs = meta?.totalPage || Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);

  const colCount = (showCountry ? 1 : 0) + (showStation ? 1 : 0) + 6;

  if (isLoading) {
    return <ThreadSkeleton />;
  }

  if (isMediaStation) {
    return <MediaStationMessages stationId={stationId || ""} />;
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
              Monitor all listener messages sent to stations and shows across the
              platform.
            </p>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
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
        />
        <KpiCard
          label="Messages Today"
          value={String(today)}
          sub="Messages received today"
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
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
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by MSISDN, message content, or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPg(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showCountry && (
            <FilterSelect
              value={countryFilter}
              onChange={(v) => {
                setCountryFilter(v);
                setPg(1);
              }}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="All Countries"
              className="w-40"
            />
          )}
          {showStation && (
            <FilterSelect
              value={stationFilter}
              onChange={(v) => {
                setStationFilter(v);
                setPg(1);
              }}
              options={uniqueStations.map((s) => ({ value: s, label: s }))}
              placeholder="All Stations"
              className="w-48"
            />
          )}
          <FilterSelect
            value={showFilter}
            onChange={(v) => {
              setShowFilter(v);
              setPg(1);
            }}
            options={uniqueShows.map((s) => ({ value: s, label: s }))}
            placeholder="All Shows"
            className="w-44"
          />
          <FilterSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPg(1);
            }}
            options={[
              { value: "Delivered", label: "Delivered" },
              { value: "Pending", label: "Pending" },
            ]}
            placeholder="All Status"
            className="w-36"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} messages{" "}
            <span className="inline-flex items-center gap-2 ml-2">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                {delivered} delivered
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#02B2FF]" />{" "}
                {pending} pending
              </span>
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Created Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  MSISDN
                </th>
                {showStation && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Station
                  </th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Show
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Message Preview
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Operator
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No messages found.
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {row.created}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground font-['JetBrains_Mono',monospace]">
                          {row.msisdn}
                        </span>
                    </td>
                    {showStation && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#EFF8FF] flex items-center justify-center">
                            <Radio
                              size={10}
                              className="text-[#02B2FF]"
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {row.station}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {row.show}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                        {row.preview}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {row.operator}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={row.status}
                        variant={sv(row.status)}
                      />
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

        <TablePagination
          pg={pg}
          totalPages={totalPgs}
          totalItems={filtered.length}
          itemLabel="messages"
          setPg={setPg}
        />
      </div>
    </div>
  );
}

// Media Station Chat Interface
function MediaStationMessages({ stationId }: { stationId: string }) {
  const [sendReply, { isLoading: isSending }] = useSendReplyMutation();
  const [selectedThread, setSelectedThread] = useState<ThreadRow | null>(null);
  const [tab, setTab] = useState<"incoming" | "replied">("incoming");
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(new Date());

  // Fetch threads for this station
  const { data: threadsResponse, isLoading: threadsLoading } = useGetThreadsQuery(
    { stationId, page: 1, limit: 100 },
    { skip: !stationId }
  );
  const threads: ThreadRow[] = threadsResponse?.data ?? [];

  // Auto-select first thread when threads change
  useEffect(() => {
    if (threads.length > 0 && !selectedThread) {
      setSelectedThread(threads[0]);
    }
  }, [threads, selectedThread]);

  // Fetch full thread when a conversation is selected
  const { data: threadData } = useGetThreadQuery(
    { stationId, msisdn: selectedThread?.msisdn || "" },
    { skip: !stationId || !selectedThread?.msisdn }
  );
  const threadMessages = threadData?.data?.messages || threadData?.data || [];

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Active show
  const { data: activeShowData } = useGetActiveShowQuery(stationId, { skip: !stationId });
  const activeShow = activeShowData?.data || null;

  const incoming = threads.filter((t) => (t.unrepliedCount || 0) > 0);
  const replied = threads.filter((t) => (t.unrepliedCount || 0) === 0);
  const displayThreads = tab === "incoming" ? incoming : replied;

  const filteredThreads = useMemo(() => {
    if (!search) return displayThreads;
    const q = search.toLowerCase();
    return displayThreads.filter(
      (t) => t.msisdn.includes(q) || (t.lastMessage || "").toLowerCase().includes(q)
    );
  }, [displayThreads, search]);

  // Stats filtered to active show only
  const showStats = useMemo(() => {
    if (!activeShow) return null;
    const showThreads = threads.filter((t) => t.showName === activeShow.name);
    return {
      total: showThreads.length,
      replied: showThreads.filter((t) => (t.unrepliedCount || 0) === 0).length,
      pending: showThreads.filter((t) => (t.unrepliedCount || 0) > 0).length,
    };
  }, [threads, activeShow]);

  if (threadsLoading) {
    return <ThreadSkeleton />;
  }

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
          label="Total Conversations"
          value={String(threads.length)}
          icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Incoming"
          value={String(incoming.length)}
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Replied"
          value={String(replied.length)}
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Active Show Banner */}
      {activeShow && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#EFF8FF] dark:bg-[#02B2FF]/10 rounded-xl border border-[#02B2FF]/20">
          <Radio size={16} className="text-[#02B2FF]" />
          <span className="text-sm font-semibold text-foreground">{activeShow.name}</span>
          <span className="text-xs text-muted-foreground">
            {showStats ? `${showStats.total} conversations · ${showStats.pending} incoming · ${showStats.replied} replied` : ""}
          </span>
          <span className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#02B2FF] text-white text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE · {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-12 gap-4 h-[600px]">
        {/* Left Panel - Thread List */}
        <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
            </div>
          </div>
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("incoming")}
              className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
                tab === "incoming"
                  ? "text-[#02B2FF] border-b-2 border-[#02B2FF] bg-[#EFF8FF]/50 dark:bg-[#02B2FF]/15"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Incoming{" "}
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] text-[10px]">
                {incoming.length}
              </span>
            </button>
            <button
              onClick={() => setTab("replied")}
              className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
                tab === "replied"
                  ? "text-[#02B2FF] border-b-2 border-[#02B2FF] bg-[#EFF8FF]/50 dark:bg-[#02B2FF]/15"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Replied{" "}
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px]">
                {replied.length}
              </span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.map((thread) => (
              <button
                key={thread.msisdn}
                onClick={() => setSelectedThread(thread)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${
                  selectedThread?.msisdn === thread.msisdn
                    ? "bg-[#EFF8FF]/50 dark:bg-[#02B2FF]/15 border-l-2 border-l-[#02B2FF]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">
                    {thread.msisdn}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">
                    {thread.showName || ""}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {thread.lastMessage}
                </p>
                <span
                  className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                    (thread.unrepliedCount || 0) > 0
                      ? "bg-[#02B2FF]/10 text-[#02B2FF]"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {(thread.unrepliedCount || 0) > 0 ? "Incoming" : "Replied"}
                </span>
              </button>
            ))}
            {filteredThreads.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No conversations found
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Thread Detail + Reply */}
        <div className="col-span-6 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {selectedThread ? (
            <>
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Message Details
                    </p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {selectedThread.msisdn}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                      (selectedThread.unrepliedCount || 0) > 0
                        ? "bg-[#02B2FF]/10 text-[#02B2FF]"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {(selectedThread.unrepliedCount || 0) > 0 ? "Incoming" : "Replied"}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Conversation History */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Conversation History
                  </p>
                  {threadMessages.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {threadMessages.map((msg: any, i: number) => (
                        <div
                          key={msg.id || i}
                          className={`flex ${msg.senderType === "station" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              msg.senderType === "station"
                                ? "bg-[#02B2FF]/10 text-foreground"
                                : "bg-background border border-border text-foreground"
                            }`}
                          >
                            <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                              {msg.senderType === "station" ? (msg.senderName || "Station") : "Listener"}
                            </p>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  )}
                </div>
              </div>

              {/* Reply Area */}
              <div className="p-4 border-t border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Reply Area
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your reply to this listener..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (reply.trim() && selectedThread && !isSending) {
                          sendReply({
                            stationId,
                            msisdn: selectedThread.msisdn,
                            content: reply.trim(),
                          }).unwrap().then(() => { toast.success("Reply sent successfully"); setReply(""); }).catch(() => toast.error("Failed to send reply"));
                        }
                      }
                    }}
                  />
                  <button
                    disabled={!reply.trim() || isSending}
                    onClick={async () => {
                      if (!selectedThread || !reply.trim()) return;
                      try {
                        await sendReply({
                          stationId,
                          msisdn: selectedThread.msisdn,
                          content: reply,
                        }).unwrap();
                        toast.success("Reply sent successfully");
                        setReply("");
                      } catch {
                        toast.error("Failed to send reply");
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} /> {isSending ? "Sending…" : "Send Reply"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a conversation to view details
            </div>
          )}
        </div>

        {/* Right Panel - Current Show */}
        <div className="col-span-3 space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Current Show
              </p>
              {activeShow ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
                  ON AIR
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                  OFFLINE
                </span>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground font-['JetBrains_Mono',monospace]">
                {now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              {activeShow ? (
                <>
                  <p className="text-sm font-semibold text-foreground mt-2">
                    {activeShow.name}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">
                      {activeShow.startTime}
                    </span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">
                      {activeShow.endTime}
                    </span>
                  </div>
                  {activeShow.timeRemainingMinutes > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {activeShow.timeRemainingMinutes >= 60
                        ? `${Math.floor(activeShow.timeRemainingMinutes / 60)}h ${activeShow.timeRemainingMinutes % 60}m remaining`
                        : `${activeShow.timeRemainingMinutes}m remaining`}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground mt-2">
                  No show is running
                </p>
              )}
            </div>
          </div>

          {activeShow && showStats && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              This Show
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Conversations
                </span>
                <span className="text-xs font-bold text-foreground">
                  {showStats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Replied</span>
                <span className="text-xs font-bold text-emerald-600">
                  {showStats.replied}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Incoming</span>
                <span className="text-xs font-bold text-[#02B2FF]">
                  {showStats.pending}
                </span>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
