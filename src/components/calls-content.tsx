"use client";

import { useState, useMemo } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneCall,
  PhoneOff,
  Search,
  Clock,
  Mic,
  MicOff,
  Radio,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useAppSelector } from "@/store/hooks";
import {
  useGetStationCallsQuery,
  useAcceptCallMutation,
  useEndCallMutation,
} from "@/features/call/callApi";

interface Call {
  _id: string;
  station: { _id: string; name: string; category: string } | string;
  show?: { _id: string; name: string } | string;
  startedBy: { _id: string; fullName: string; phone: string } | string;
  handledBy?: { _id: string; fullName: string } | string;
  status: "queued" | "missed" | "rejected" | "answered" | "cancelled";
  duration?: number;
  creditsUsed: number;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-[#02B2FF]/10 text-[#02B2FF]",
  answered: "bg-emerald-100 text-emerald-600",
  rejected: "bg-red-100 text-red-600",
  missed: "bg-amber-100 text-amber-600",
  cancelled: "bg-gray-100 text-gray-600",
};

const AVATAR_COLORS = [
  "bg-[#02B2FF] text-white",
  "bg-emerald-500 text-white",
  "bg-violet-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-cyan-500 text-white",
  "bg-orange-500 text-white",
  "bg-teal-500 text-white",
];

function getFieldName(obj: any, ...keys: string[]): string {
  for (const key of keys) {
    if (obj && typeof obj === "object" && obj[key]) return obj[key];
  }
  return "";
}

export default function CallsContent() {
  const user = useAppSelector((state) => state.auth.user);
  const stationId = (user as any)?.stationId || "";

  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [tab, setTab] = useState<
    "all" | "queued" | "answered" | "missed" | "cancelled"
  >("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useGetStationCallsQuery(
    { stationId, page, limit: 50 },
    { skip: !stationId },
  );

  const [acceptCall] = useAcceptCallMutation();
  const [endCall] = useEndCallMutation();

  const allCalls: Call[] = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const queued = allCalls.filter((c) => c.status === "queued");
  const answered = allCalls.filter((c) => c.status === "answered");
  const missed = allCalls.filter((c) => c.status === "missed");
  const cancelled = allCalls.filter(
    (c) => c.status === "cancelled" || c.status === "rejected",
  );

  const filtered = useMemo(() => {
    let data =
      tab === "queued"
        ? queued
        : tab === "answered"
          ? answered
          : tab === "missed"
            ? missed
            : tab === "cancelled"
              ? cancelled
              : allCalls;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((c) => {
        const callerName = getFieldName(c.startedBy, "fullName");
        const callerPhone = getFieldName(c.startedBy, "phone");
        return (
          callerName.toLowerCase().includes(q) || callerPhone.includes(q)
        );
      });
    }
    return data;
  }, [tab, search, allCalls]);

  const handleAccept = async (call: Call) => {
    try {
      await acceptCall(call._id).unwrap();
      setSelectedCall({ ...call, status: "answered" });
    } catch (err: any) {
      console.error("Failed to accept call:", err);
      alert(err?.data?.message || "Failed to accept call. It may have been taken by another operator.");
    }
  };

  const handleEndCall = async (call: Call) => {
    try {
      await endCall(call._id).unwrap();
      setSelectedCall(null);
    } catch (err: any) {
      console.error("Failed to end call:", err);
      alert(err?.data?.message || "Failed to end call.");
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  // No station ID — show message for super_admin/partner_admin
  if (!stationId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Calls</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage incoming listener calls during live shows
          </p>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          <div className="text-center">
            <Phone size={32} className="mx-auto mb-3 opacity-50" />
            <p>Select a station to view calls</p>
            <p className="text-xs mt-1">Station admins and media stations see calls automatically</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Calls</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage incoming listener calls during live shows
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
          Failed to load calls. Please try again.
          <button onClick={() => refetch()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Incoming Calls"
          value={String(queued.length)}
          icon={<PhoneIncoming size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Answered Calls"
          value={String(answered.length)}
          icon={<PhoneCall size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Missed Calls"
          value={String(missed.length)}
          icon={<PhoneOff size={16} className="text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-12 gap-4 h-[600px]">
        {/* Left Panel - Call List */}
        <div className="col-span-3 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search calls..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
            </div>
          </div>
          <div className="flex border-b border-border overflow-x-auto">
            {(
              ["all", "queued", "answered", "missed", "cancelled"] as const
            ).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  tab === t
                    ? "text-[#02B2FF] border-b-2 border-[#02B2FF] bg-[#EFF8FF]/50 dark:bg-[#02B2FF]/15"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
                  {t === "all"
                    ? allCalls.length
                    : t === "queued"
                      ? queued.length
                      : t === "answered"
                        ? answered.length
                        : t === "missed"
                          ? missed.length
                          : cancelled.length}
                </span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#02B2FF]" />
              </div>
            )}
            {filtered.map((call, i) => {
              const callerName = getFieldName(call.startedBy, "fullName");
              const callerPhone = getFieldName(call.startedBy, "phone");
              return (
                <button
                  key={call._id}
                  onClick={() => setSelectedCall(call)}
                  className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${
                    selectedCall?._id === call._id
                      ? "bg-[#EFF8FF]/50 dark:bg-[#02B2FF]/15 border-l-2 border-l-[#02B2FF]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                    >
                      {callerName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {callerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatTime(call.startedAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {callerPhone}
                      </p>
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${STATUS_COLORS[call.status] || "bg-muted text-muted-foreground"}`}
                      >
                        {call.status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Panel - Call Details */}
        <div className="col-span-6 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {selectedCall ? (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Call Details
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {getFieldName(selectedCall.startedBy, "fullName")}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold ${STATUS_COLORS[selectedCall.status] || "bg-muted text-muted-foreground"}`}
                >
                  {selectedCall.status}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Caller Information */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Caller Information
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[0]}`}
                    >
                      {getFieldName(selectedCall.startedBy, "fullName")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {getFieldName(selectedCall.startedBy, "fullName")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFieldName(selectedCall.startedBy, "phone")}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Phone Number
                      </p>
                      <p className="text-sm font-semibold text-foreground font-mono">
                        {getFieldName(selectedCall.startedBy, "phone")}
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Status
                      </p>
                      <StatusBadge
                        label={selectedCall.status}
                        variant={sv(selectedCall.status)}
                      />
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Call Time
                      </p>
                      <p className="text-sm font-semibold text-foreground font-mono">
                        {formatTime(selectedCall.startedAt)}
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Credits Used
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedCall.creditsUsed}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show Information */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Show Information
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Show Name
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {getFieldName(selectedCall.show, "name") || "N/A"}
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">
                        Duration
                      </p>
                      <p className="text-sm font-semibold text-foreground font-mono">
                        {formatDuration(selectedCall.duration)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select a call to view details
            </div>
          )}
        </div>

        {/* Right Panel - Actions + Queue + Show */}
        <div className="col-span-3 space-y-4">
          {/* Call Actions */}
          {selectedCall?.status === "queued" ? (
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Incoming Call
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleAccept(selectedCall)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#02B2FF] text-white text-xs font-semibold hover:bg-[#00A0E8] transition-colors"
                >
                  <Phone size={14} /> Accept Call
                </button>
              </div>
            </div>
          ) : selectedCall?.status === "answered" ? (
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase">
                  Live Call
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#02B2FF] flex items-center justify-center text-white text-xs font-bold">
                  {getFieldName(selectedCall.startedBy, "fullName")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {getFieldName(selectedCall.startedBy, "fullName")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getFieldName(selectedCall.startedBy, "phone")}
                  </p>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] text-muted-foreground uppercase">
                  Duration
                </p>
                <p className="text-lg font-bold text-foreground font-mono">
                  {formatDuration(selectedCall.duration)}
                </p>
              </div>
              <button
                onClick={() => handleEndCall(selectedCall)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                <PhoneOff size={12} /> End Call
              </button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Call Actions
              </p>
              <p className="text-xs text-muted-foreground">
                Select an incoming call to accept
              </p>
            </div>
          )}

          {/* Queue Summary */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Queue Summary
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneIncoming size={12} className="text-[#02B2FF]" />
                  <span className="text-xs text-muted-foreground">
                    Incoming
                  </span>
                </div>
                <span className="text-xs font-bold text-[#02B2FF]">
                  {queued.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneCall size={12} className="text-emerald-500" />
                  <span className="text-xs text-muted-foreground">
                    Answered
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-500">
                  {answered.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneOff size={12} className="text-red-500" />
                  <span className="text-xs text-muted-foreground">
                    Missed
                  </span>
                </div>
                <span className="text-xs font-bold text-red-500">
                  {missed.length}
                </span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Total
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {allCalls.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Show placeholder */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Current Show
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-500 uppercase">
                ON AIR
              </span>
            </div>
            <p className="text-sm font-bold text-foreground">Live Show</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={10} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-mono">
                Active now
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
