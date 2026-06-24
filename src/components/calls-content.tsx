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
import callsData from "@/mock/calls.json";

interface Call {
  id: string;
  name: string;
  phone: string;
  country: string;
  time: string;
  status: string;
  show: string;
  presenter: string;
  studioMode: string;
}

const ALL_CALLS = callsData.calls as Call[];

const STATUS_COLORS: Record<string, string> = {
  Incoming: "bg-[#02B2FF]/10 text-[#02B2FF]",
  Accepted: "bg-emerald-100 text-emerald-600",
  Rejected: "bg-red-100 text-red-600",
  Important: "bg-amber-100 text-amber-600",
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

export default function CallsContent() {
  const [selectedCall, setSelectedCall] = useState<Call>(ALL_CALLS[0]);
  const [tab, setTab] = useState<"all" | "incoming" | "accepted" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [liveCall, setLiveCall] = useState<Call | null>(null);
  const [duration, setDuration] = useState("00:00:00");

  const incoming = ALL_CALLS.filter((c) => c.status === "Incoming");
  const accepted = ALL_CALLS.filter((c) => c.status === "Accepted");
  const rejected = ALL_CALLS.filter((c) => c.status === "Rejected");

  const filtered = useMemo(() => {
    let data = tab === "incoming" ? incoming : tab === "accepted" ? accepted : tab === "rejected" ? rejected : ALL_CALLS;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return data;
  }, [tab, search]);

  const handleAccept = (call: Call) => {
    setLiveCall(call);
    setDuration("00:00:00");
  };

  const handleEndCall = () => {
    setLiveCall(null);
    setDuration("00:00:00");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Calls</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage incoming listener calls during live shows
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Incoming Calls"
          value={String(incoming.length)}
          icon={<PhoneIncoming size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Accepted Calls"
          value={String(accepted.length)}
          icon={<PhoneCall size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Rejected Calls"
          value={String(rejected.length)}
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
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search calls..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
            </div>
          </div>
          <div className="flex border-b border-border overflow-x-auto">
            {(["all", "incoming", "accepted", "rejected"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  tab === t
                    ? "text-[#02B2FF] border-b-2 border-[#02B2FF] bg-[#EFF8FF]/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px]">
                  {t === "all" ? ALL_CALLS.length : t === "incoming" ? incoming.length : t === "accepted" ? accepted.length : rejected.length}
                </span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((call, i) => (
              <button
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${
                  selectedCall?.id === call.id ? "bg-[#EFF8FF]/50 border-l-2 border-l-[#02B2FF]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                    {call.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground truncate">{call.name}</span>
                      <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">{call.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{call.phone}</p>
                    <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${STATUS_COLORS[call.status] || "bg-slate-100 text-slate-600"}`}>
                      {call.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center Panel - Call Details */}
        <div className="col-span-6 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {selectedCall ? (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Call Details</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{selectedCall.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${STATUS_COLORS[selectedCall.status] || "bg-slate-100 text-slate-600"}`}>
                  {selectedCall.status}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Caller Information */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Caller Information</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[0]}`}>
                      {selectedCall.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedCall.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedCall.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Phone Number</p>
                      <p className="text-sm font-semibold text-foreground font-['JetBrains_Mono',monospace]">{selectedCall.phone}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Country</p>
                      <p className="text-sm font-semibold text-foreground">{selectedCall.country}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Call Time</p>
                      <p className="text-sm font-semibold text-foreground font-['JetBrains_Mono',monospace]">{selectedCall.time}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                      <StatusBadge label={selectedCall.status} variant={sv(selectedCall.status)} />
                    </div>
                  </div>
                </div>

                {/* Show Information */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Show Information</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Show Name</p>
                      <p className="text-sm font-semibold text-foreground">{selectedCall.show}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Presenter</p>
                      <p className="text-sm font-semibold text-foreground">{selectedCall.presenter}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Studio Mode</p>
                      <p className="text-sm font-semibold text-[#02B2FF]">{selectedCall.studioMode}</p>
                    </div>
                  </div>
                </div>

                {/* Call Status */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Call Status</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#02B2FF]" />
                      <span className="text-xs font-semibold text-[#02B2FF]">Incoming</span>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-muted" />
                      <span className="text-xs text-muted-foreground">Accepted</span>
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
          {/* Live Call / Call Actions */}
          {liveCall ? (
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase">Live Call</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#02B2FF] flex items-center justify-center text-white text-xs font-bold">
                  {liveCall.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{liveCall.name}</p>
                  <p className="text-xs text-muted-foreground">{liveCall.phone}</p>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                <p className="text-lg font-bold text-foreground font-['JetBrains_Mono',monospace]">{duration}</p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                  <MicOff size={12} /> Mute
                </button>
                <button
                  onClick={handleEndCall}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                >
                  <PhoneOff size={12} /> End Call
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Call Actions</p>
              <div className="space-y-2">
                <button
                  onClick={() => handleAccept(selectedCall)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#02B2FF] text-white text-xs font-semibold hover:bg-[#00A0E8] transition-colors"
                >
                  <Phone size={14} /> Accept Call
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
                  <PhoneOff size={14} /> Reject Call
                </button>
              </div>
            </div>
          )}

          {/* Queue Summary */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Queue Summary</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneIncoming size={12} className="text-[#02B2FF]" />
                  <span className="text-xs text-muted-foreground">Incoming Calls</span>
                </div>
                <span className="text-xs font-bold text-[#02B2FF]">{incoming.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneCall size={12} className="text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Accepted Calls</span>
                </div>
                <span className="text-xs font-bold text-emerald-500">{accepted.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneOff size={12} className="text-red-500" />
                  <span className="text-xs text-muted-foreground">Rejected Calls</span>
                </div>
                <span className="text-xs font-bold text-red-500">{rejected.length}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Total</span>
                  <span className="text-xs font-bold text-foreground">{ALL_CALLS.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Show */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Current Show</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-500 uppercase">ON AIR</span>
            </div>
            <p className="text-sm font-bold text-foreground">Morning Drive Show</p>
            <p className="text-xs text-muted-foreground">DJ Marcus Cole</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={10} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">06:00 — 10:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
