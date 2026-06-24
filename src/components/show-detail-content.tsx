"use client";

import Link from "next/link";
import { ArrowLeft, Edit2, Mic } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetShowByIdQuery, type ShowResponse } from "@/features/show/showApi";

const DAY_MAP: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

function to12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-32 bg-muted rounded-xl animate-pulse" />
      <div className="h-48 bg-muted rounded-xl animate-pulse" />
    </div>
  );
}

export default function ShowDetailContent({ id }: { id: string }) {
  const { data: apiData, isLoading, error } = useGetShowByIdQuery(id);

  if (isLoading) return <DetailSkeleton />;

  const show = apiData?.data as ShowResponse | undefined;

  if (!show || error) {
    return (
      <div className="space-y-6">
        <Link href="/station-management/shows" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Shows
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Show not found.</p>
        </div>
      </div>
    );
  }

  const scheduleDays = show.days.map((d) => DAY_MAP[d] || d).join(", ");
  const schedule = `${scheduleDays} ${to12h(show.startTime)}–${to12h(show.endTime)}`;
  const stationName = show.station?.name || "Unknown Station";
  const presenterName = show.presenter?.fullName || "Not Assigned";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/station-management/shows" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Shows
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Show Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{show.name}</p>
      </div>

      {/* Hero Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Mic size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{show.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stationName} · {presenterName}
              </p>
              {show.description && (
                <p className="text-sm text-muted-foreground mt-1">{show.description}</p>
              )}
            </div>
          </div>
          <StatusBadge label={show.status} variant={sv(show.status)} />
        </div>
      </div>

      {/* Show Information */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-0">
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Show Name</div>
            <div className="text-sm font-medium text-foreground">{show.name}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Station / Channel</div>
            <div className="text-sm font-medium text-foreground">{stationName}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Assigned Presenter</div>
            <div className="text-sm font-medium text-foreground">{presenterName}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Schedule</div>
            <div className="text-sm font-medium text-foreground">{schedule}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created Date</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
              {show.createdAt ? new Date(show.createdAt).toISOString().split("T")[0] : "N/A"}
            </div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
            <StatusBadge label={show.status} variant={sv(show.status)} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href={`/station-management/shows/${show.id}/edit`}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
        >
          <Edit2 size={14} /> Edit Show
        </Link>
        <Link
          href="/station-management/shows"
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-white hover:bg-muted transition-colors"
        >
          <ArrowLeft size={14} /> Back to Shows
        </Link>
      </div>
    </div>
  );
}
