"use client";

import Link from "next/link";
import { ArrowLeft, Edit2, Mic } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";

interface ShowDetail {
  id: string;
  name: string;
  stationId: string;
  stationName: string;
  presenter: string;
  days: string[];
  startTime: string;
  endTime: string;
  description: string;
  status: string;
  created: string;
}

const SHOWS_DATA: ShowDetail[] = [
  { id: "SH-001", name: "Morning Drive", stationId: "RS-001", stationName: "Capital FM Kenya", presenter: "Boniface Mwangi", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "06:00 AM", endTime: "10:00 AM", description: "Kenya's most popular morning drive show.", status: "Active", created: "2022-06-01" },
  { id: "SH-002", name: "Breakfast Live", stationId: "RS-003", stationName: "Joy FM Ghana", presenter: "Sandra Ankrah", days: ["MON", "TUE", "WED", "THU"], startTime: "06:00 AM", endTime: "09:00 AM", description: "Start your day with the best breakfast show in Ghana.", status: "Active", created: "2022-07-15" },
  { id: "SH-003", name: "Evening News", stationId: "RS-002", stationName: "Radio Uganda", presenter: "Peter Ochieng", days: ["MON", "WED", "THU", "FRI"], startTime: "06:00 PM", endTime: "10:00 PM", description: "Comprehensive evening news coverage.", status: "Active", created: "2022-08-20" },
  { id: "SH-004", name: "Weekend Vibes", stationId: "RS-004", stationName: "Peace FM", presenter: "Abena Mensah", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "06:00 PM", endTime: "10:00 PM", description: "The best weekend music vibes.", status: "Active", created: "2022-09-10" },
  { id: "SH-005", name: "Breakfast Live", stationId: "TV-001", stationName: "Citizen TV", presenter: "Tunde Okafor", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "06:00 AM", endTime: "10:00 AM", description: "Morning news and entertainment.", status: "Active", created: "2022-10-05" },
  { id: "SH-006", name: "Morning Drive", stationId: "RS-005", stationName: "Hot 96", presenter: "Nkechi Obi", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "06:00 AM", endTime: "10:00 AM", description: "Tanzania's hottest morning show.", status: "Active", created: "2022-11-12" },
  { id: "SH-007", name: "Evening News", stationId: "RS-006", stationName: "Radio Rwanda", presenter: "Solomon Kibet", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "06:00 AM", endTime: "10:00 AM", description: "Rwanda's trusted evening news.", status: "Active", created: "2022-12-01" },
  { id: "SH-008", name: "Breakfast Live", stationId: "RS-008", stationName: "Metro FM Kenya", presenter: "Ama Owusu", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "06:00 AM", endTime: "10:00 AM", description: "Nairobi's urban breakfast show.", status: "Active", created: "2023-01-15" },
  { id: "SH-009", name: "Evening News", stationId: "RS-007", stationName: "Star FM Nigeria", presenter: "Edwin Kamau", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "06:00 AM", endTime: "10:00 AM", description: "Nigeria's leading evening news.", status: "Active", created: "2023-02-20" },
  { id: "SH-010", name: "Weekend Vibes", stationId: "RS-001", stationName: "Capital FM Kenya", presenter: "Rukia Habib", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "06:00 AM", endTime: "10:00 AM", description: "Weekend music marathon.", status: "Active", created: "2023-03-10" },
  { id: "SH-011", name: "Night Owls", stationId: "RS-001", stationName: "Capital FM Kenya", presenter: "David Njoroge", days: ["FRI", "SAT"], startTime: "10:00 PM", endTime: "02:00 AM", description: "Late night music and talk.", status: "Upcoming", created: "2023-04-05" },
  { id: "SH-012", name: "Sports Desk", stationId: "CH-001", stationName: "Capital Sports", presenter: "Caleb Odhiambo", days: ["SAT", "SUN"], startTime: "02:00 PM", endTime: "06:00 PM", description: "Weekend sports roundup.", status: "Completed", created: "2023-05-01" },
];

const DAY_MAP: Record<string, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
};

export default function ShowDetailContent({ id }: { id: string }) {
  const show = SHOWS_DATA.find((s) => s.id === id);

  if (!show) {
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

  const scheduleDays = show.days.map((d) => DAY_MAP[d]).join(", ");
  const schedule = `${scheduleDays} ${show.startTime}–${show.endTime}`;

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
                {show.stationName} · {show.presenter}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{show.description}</p>
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
            <div className="text-sm font-medium text-foreground">{show.stationName}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Assigned Presenter</div>
            <div className="text-sm font-medium text-foreground">{show.presenter}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Schedule</div>
            <div className="text-sm font-medium text-foreground">{schedule}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created Date</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{show.created}</div>
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
