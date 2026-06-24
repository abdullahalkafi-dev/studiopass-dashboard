"use client";

import { Radio, MessageSquare, FileText, Clock, Calendar } from "lucide-react";
import { useRole } from "@/contexts/role-context";

const CURRENT_SHOW = {
  name: "Morning Drive",
  station: "Radio One FM",
  schedule: "06:00 – 10:00 AM",
  status: "On Air",
};

const QUICK_STATS = {
  messagesToday: 24,
  listenerStatements: 15,
};

const SHOW_INFO = {
  presenter: "James Doe",
  station: "Radio One FM",
  time: "06:00 – 10:00 AM",
  days: "Mon – Fri",
};

export default function PresenterMyShowContent() {
  const role = useRole();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Show</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your currently assigned show and listener activity.
        </p>
      </div>

      <hr className="border-border" />

      {/* Current Show */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <Radio size={18} className="text-[#02B2FF]" />
          <h2 className="text-lg font-semibold text-foreground">Current Show</h2>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Show Name</p>
            <p className="text-sm font-semibold text-foreground">{CURRENT_SHOW.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Station Name</p>
            <p className="text-sm font-semibold text-foreground">{CURRENT_SHOW.station}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Show Schedule</p>
            <p className="text-sm font-semibold text-foreground">{CURRENT_SHOW.schedule}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Show Status</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {CURRENT_SHOW.status}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFF8FF] flex items-center justify-center">
              <MessageSquare size={20} className="text-[#02B2FF]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{QUICK_STATS.messagesToday}</p>
              <p className="text-sm text-muted-foreground">Messages Today</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileText size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{QUICK_STATS.listenerStatements}</p>
              <p className="text-sm text-muted-foreground">Listener Statements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Show Information */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <Clock size={18} className="text-[#02B2FF]" />
          <h2 className="text-lg font-semibold text-foreground">Show Information</h2>
        </div>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Presenter Name</p>
            <p className="text-sm font-semibold text-foreground">{SHOW_INFO.presenter}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Assigned Station</p>
            <p className="text-sm font-semibold text-foreground">{SHOW_INFO.station}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Show Time</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock size={13} className="text-muted-foreground" />
              {SHOW_INFO.time}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Broadcast Days</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar size={13} className="text-muted-foreground" />
              {SHOW_INFO.days}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
