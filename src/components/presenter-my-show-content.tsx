"use client";

import { Radio, MessageSquare, FileText, Clock, Calendar, AlertCircle } from "lucide-react";
import { useGetMyShowsQuery, type MyShowsResponse, type MyShowItem } from "@/features/show/showApi";
import { useGetThreadsQuery } from "@/features/message/messageApi";
import { useGetStatementKPIsQuery } from "@/features/statement/statementApi";
import { useAppSelector } from "@/store/hooks";
import { formatTime12h } from "@/components/shared/time-picker";

const DAY_MAP: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

function formatDaysShort(days: string[]): string {
  return (days || []).map((d) => DAY_MAP[d] || d).join(", ");
}

function formatSchedule(show: Pick<MyShowItem, "startTime" | "endTime">): string {
  return `${formatTime12h(show.startTime)} – ${formatTime12h(show.endTime)}`;
}

function statusRank(status?: string): number {
  if (status === "Active") return 0;
  if (status === "Scheduled") return 1;
  return 2;
}

/** Active first, then soonest Scheduled, then the rest */
function sortAssignedShows(shows: MyShowItem[]): MyShowItem[] {
  return [...(shows || [])].sort((a, b) => {
    const rank = statusRank(a.status) - statusRank(b.status);
    if (rank !== 0) return rank;
    const aMin = a.nextStartTime?.minutesUntil ?? Number.POSITIVE_INFINITY;
    const bMin = b.nextStartTime?.minutesUntil ?? Number.POSITIVE_INFINITY;
    return aMin - bMin;
  });
}

function ShowStatusBadge({ status }: { status?: string }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Radio size={12} className="animate-pulse" />
        On Air
      </span>
    );
  }
  if (status === "Scheduled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <Clock size={12} />
        Scheduled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      {status || "Inactive"}
    </span>
  );
}

function AssignedShowRow({ show }: { show: MyShowItem }) {
  const nextIn =
    show.status === "Scheduled" && show.nextStartTime?.minutesUntil != null
      ? show.nextStartTime.minutesUntil >= 60
        ? `${Math.floor(show.nextStartTime.minutesUntil / 60)}h ${show.nextStartTime.minutesUntil % 60}m`
        : `${show.nextStartTime.minutesUntil}m`
      : null;

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-colors ${
        show.status === "Active"
          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
          : "border-border bg-card"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-bold text-foreground truncate">{show.name}</p>
            <ShowStatusBadge status={show.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {show.station?.name || "—"}
            {show.presenter?.fullName ? ` · ${show.presenter.fullName}` : ""}
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0 space-y-1">
          <p className="text-sm font-semibold text-foreground font-['JetBrains_Mono',monospace]">
            {formatSchedule(show)}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 sm:justify-end">
            <Calendar size={12} />
            {formatDaysShort(show.days)}
          </p>
          {nextIn && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Starts in {nextIn}
            </p>
          )}
          {show.status === "Active" && typeof (show as any).timeRemainingMinutes === "number" && (show as any).timeRemainingMinutes > 0 && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {(show as any).timeRemainingMinutes >= 60
                ? `${Math.floor((show as any).timeRemainingMinutes / 60)}h ${(show as any).timeRemainingMinutes % 60}m remaining`
                : `${(show as any).timeRemainingMinutes}m remaining`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NotAssigned() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Show</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your assigned shows and listener activity.
        </p>
      </div>
      <hr className="border-border" />
      <div className="rounded-xl border bg-card p-16 shadow-sm flex flex-col items-center justify-center text-center">
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
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="h-5 w-32 bg-muted rounded animate-pulse mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="h-5 w-36 bg-muted rounded animate-pulse mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
  const { data: apiData, isLoading } = useGetMyShowsQuery(undefined, { pollingInterval: 30000 });
  const result = apiData?.data as MyShowsResponse | undefined;
  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId || "";

  const currentShow = result?.currentShow || null;
  // Messages/KPI stay tied to running show when possible (backend presenter threads are active-show only)
  const { data: threadsData } = useGetThreadsQuery(
    { stationId, page: 1, limit: 100 },
    { skip: !stationId || !currentShow }
  );
  const { data: kpiData } = useGetStatementKPIsQuery({});

  const threads = !currentShow ? [] : threadsData?.data || [];
  const totalMessages = threads.reduce((sum: number, t: any) => sum + (t.count || 0), 0);
  const totalStatements = kpiData?.data?.totalInteractions ?? 0;

  if (isLoading) return <PageSkeleton />;

  if (!result || !result.assigned) {
    return <NotAssigned />;
  }

  // Prefer full list; fall back if API older shape
  const allShows = sortAssignedShows(result.allShows || []);
  const featured = result.currentShow || result.nextShow || allShows[0] || null;
  const isOnAir = Boolean(result.currentShow) || featured?.status === "Active";
  const schedule = featured ? formatSchedule(featured) : "";
  const daysDisplay = featured ? formatDaysShort(featured.days) : "";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Show</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your assigned shows and listener activity.
        </p>
      </div>

      <hr className="border-border" />

      {/* Featured show — on air when one is live */}
      {featured ? (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <Radio size={18} className="text-[#02B2FF]" />
            <h2 className="text-lg font-semibold text-foreground">
              {isOnAir ? "Current Show" : "Your Show"}
            </h2>
            <ShowStatusBadge status={featured.status} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Show Name</p>
              <p className="text-sm font-semibold text-foreground">{featured.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Station Name</p>
              <p className="text-sm font-semibold text-foreground">{featured.station?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Show Schedule</p>
              <p className="text-sm font-semibold text-foreground">{schedule}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Show Status</p>
              <ShowStatusBadge status={featured.status} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <Radio size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">No Show Now</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            No shows on this account right now. Check Assigned Shows below or contact your station admin.
          </p>
        </div>
      )}

      {/* Assigned Shows — one by one (Active first, then Scheduled) */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-[#02B2FF]" />
            <h2 className="text-lg font-semibold text-foreground">Assigned Shows</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {allShows.length} show{allShows.length === 1 ? "" : "s"}
          </span>
        </div>
        {allShows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assigned shows found.</p>
        ) : (
          <div className="space-y-3">
            {allShows.map((show) => (
              <AssignedShowRow key={String(show.id)} show={show} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFF8FF] dark:bg-white/10 flex items-center justify-center">
              <MessageSquare size={20} className="text-[#02B2FF]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{totalMessages}</p>
              <p className="text-sm text-muted-foreground">
                {isOnAir ? "Messages (live show)" : "Messages"}
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-white/10 flex items-center justify-center">
              <FileText size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{totalStatements}</p>
              <p className="text-sm text-muted-foreground">Listener Statements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Show Information — featured / live show */}
      {featured && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <Clock size={18} className="text-[#02B2FF]" />
            <h2 className="text-lg font-semibold text-foreground">Show Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Presenter Name</p>
              <p className="text-sm font-semibold text-foreground">{featured.presenter?.fullName || "Not Assigned"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assigned Station</p>
              <p className="text-sm font-semibold text-foreground">{featured.station?.name}</p>
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
      )}
    </div>
  );
}