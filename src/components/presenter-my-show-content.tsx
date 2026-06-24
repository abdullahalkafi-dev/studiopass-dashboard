"use client";

import { Radio, MessageSquare, FileText, Clock, Calendar, AlertCircle } from "lucide-react";
import { useGetMyShowsQuery, type MyShowsResponse, type MyShowItem } from "@/features/show/showApi";

const DAY_MAP: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

function to12h(time24: string): string {
  const parts = time24.split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDaysShort(days: string[]): string {
  return days.map((d) => DAY_MAP[d] || d).join(", ");
}

function formatDaysRange(days: string[]): string {
  if (days.length <= 2) return days.map((d) => DAY_MAP[d] || d).join(" – ");
  return `${DAY_MAP[days[0]] || days[0]} – ${DAY_MAP[days[days.length - 1]] || days[days.length - 1]}`;
}

function NotAssigned() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Show</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your currently assigned show and listener activity.
        </p>
      </div>
      <hr className="border-border" />
      <div className="rounded-xl border bg-white p-16 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <AlertCircle size={36} className="text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Not Assigned</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You are not currently assigned to any show. Contact your station admin to get assigned to a show.
        </p>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-px bg-border" />
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="h-5 w-32 bg-muted rounded animate-pulse mb-5" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="h-5 w-36 bg-muted rounded animate-pulse mb-5" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PresenterMyShowContent() {
  const { data: apiData, isLoading } = useGetMyShowsQuery(undefined);
  const result = apiData?.data as MyShowsResponse | undefined;

  if (isLoading) return <PageSkeleton />;

  if (!result || !result.assigned) {
    return <NotAssigned />;
  }

  const { currentShow, nextShow } = result;
  const activeShow = currentShow || nextShow;

  if (!activeShow) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Show</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your currently assigned show and listener activity.
          </p>
        </div>
        <hr className="border-border" />
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <Radio size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">No Show Now</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Your assigned shows are not currently on air. Check the schedule below.
          </p>
        </div>
      </div>
    );
  }

  const isOnAir = activeShow.status === "Active";
  const schedule = `${to12h(activeShow.startTime)} – ${to12h(activeShow.endTime)}`;
  const daysDisplay = formatDaysShort(activeShow.days);

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
            <p className="text-sm font-semibold text-foreground">{activeShow.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Station Name</p>
            <p className="text-sm font-semibold text-foreground">{activeShow.station?.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Show Schedule</p>
            <p className="text-sm font-semibold text-foreground">{schedule}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Show Status</p>
            {isOnAir ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <Radio size={12} className="animate-pulse" />
                On Air
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                <Clock size={12} />
                Upcoming
              </span>
            )}
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
              <p className="text-3xl font-bold text-foreground">--</p>
              <p className="text-sm text-muted-foreground">Messages Today</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileText size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">--</p>
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
            <p className="text-sm font-semibold text-foreground">{activeShow.presenter?.fullName || "Not Assigned"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Assigned Station</p>
            <p className="text-sm font-semibold text-foreground">{activeShow.station?.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Show Time</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock size={13} className="text-muted-foreground" />
              {schedule}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Broadcast Days</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar size={13} className="text-muted-foreground" />
              {daysDisplay}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
