import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit2, Mic, X, Loader2, Save } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetShowByIdQuery, useUpdateShowMutation, type ShowResponse } from "@/features/show/showApi";
import { useGetPresentersQuery } from "@/features/user/userApi";
import { formatTime12h } from "@/components/shared/time-picker";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { toast } from "sonner";

const DAY_MAP: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

const ALL_WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

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
  const [isEditing, setIsEditing] = useState(false);
  const { data: apiData, isLoading, error } = useGetShowByIdQuery(id);
  const timezone = useTimezone();

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
  const schedule = `${scheduleDays} ${formatTime12h(show.startTime)}–${formatTime12h(show.endTime)}`;
  const stationName = show.station?.name || "Unknown Station";
  const stationId = show.station?.id || (show.station as any)?._id || "";
  const presenterName = show.presenter?.fullName || "Not Assigned";
  const presenterId = show.presenter?.id || (show.presenter as any)?._id || "";

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
              {show.createdAt ? formatDate(show.createdAt, timezone) : "N/A"}
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
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
        >
          <Edit2 size={14} /> Edit Show
        </button>
        <Link
          href="/station-management/shows"
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors"
        >
          <ArrowLeft size={14} /> Back to Shows
        </Link>
      </div>

      {isEditing && (
        <EditShowModal
          show={{
            id: show.id,
            name: show.name,
            description: show.description || "",
            stationId,
            rawDays: show.days,
            rawStartTime: show.startTime,
            rawEndTime: show.endTime,
            presenterId,
            status: show.status,
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}

function EditShowModal({
  show,
  onClose,
}: {
  show: {
    id: string;
    name: string;
    description: string;
    stationId: string;
    rawDays: string[];
    rawStartTime: string;
    rawEndTime: string;
    presenterId: string;
    status: string;
  };
  onClose: () => void;
}) {
  const [name, setName] = useState(show.name);
  const [description, setDescription] = useState(show.description);
  const [days, setDays] = useState<string[]>(show.rawDays || []);
  const [startTime, setStartTime] = useState(show.rawStartTime || "09:00");
  const [endTime, setEndTime] = useState(show.rawEndTime || "12:00");
  const [presenterId, setPresenterId] = useState<string>(show.presenterId || "");
  const [status, setStatus] = useState<"Active" | "Inactive">(
    show.status === "Inactive" ? "Inactive" : "Active"
  );

  const { data: presentersData } = useGetPresentersQuery(show.stationId);
  const [updateShow, { isLoading }] = useUpdateShowMutation();

  const presenters = (presentersData?.data as any[]) || [];

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Show name is required");
      return;
    }
    if (days.length === 0) {
      toast.error("At least one day must be selected");
      return;
    }
    try {
      await updateShow({
        id: show.id,
        name: name.trim(),
        description: description.trim() || undefined,
        days,
        startTime,
        endTime,
        presenterId: presenterId ? presenterId : null,
        status,
      }).unwrap();
      toast.success("Show updated successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update show");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Mic size={16} />
            </div>
            <h3 className="text-base font-bold text-foreground">Edit Show</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Show Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
              placeholder="e.g. Morning Drive"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] resize-none"
              placeholder="Show description..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Day(s) of Show</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEEKDAYS.map((d) => {
                const selected = days.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      selected
                        ? "bg-[#02B2FF] text-white border-[#02B2FF]"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {d.label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Start Time (HH:mm)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">End Time (HH:mm)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Assigned Presenter</label>
            <select
              value={presenterId}
              onChange={(e) => setPresenterId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
            >
              <option value="">No Presenter (Unassigned)</option>
              {presenters.map((p: any) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.fullName} {p.email ? `(${p.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#02B2FF] hover:bg-[#00A0E8] rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
