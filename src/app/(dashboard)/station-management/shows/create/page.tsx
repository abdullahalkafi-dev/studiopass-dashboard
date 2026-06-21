"use client";

import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRole } from "@/contexts/role-context";
import stationsData from "@/mock/stations.json";
import { useMemo, useState } from "react";

const schema = z.object({
  showName: z.string().min(1, "Show name is required"),
  country: z.string().optional(),
  partner: z.string().optional(),
  station: z.string().min(1, "Station is required"),
  presenter: z.string().min(1, "Presenter is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  status: z.string().min(1, "Status is required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda"];
const PARTNERS = ["Capital FM Group", "Radio Uganda Ltd", "Joy Media Ghana", "Tanzania Media Corp", "Peace FM Group"];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const TIMES = [
  "05:00 AM", "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM",
  "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM",
  "11:00 PM", "12:00 AM",
];
const PRESENTERS = [
  "Boniface Mwangi", "Sandra Ankrah", "Peter Ochieng", "Abena Mensah",
  "Tunde Okafor", "Nkechi Obi", "Solomon Kibet", "Ama Owusu",
  "Edwin Kamau", "Rukia Habib", "David Njoroge", "Caleb Odhiambo",
];

const DAY_COLORS: Record<string, string> = {
  MON: "bg-blue-100 text-blue-700 border-blue-200",
  TUE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  WED: "bg-amber-100 text-amber-700 border-amber-200",
  THU: "bg-violet-100 text-violet-700 border-violet-200",
  FRI: "bg-rose-100 text-rose-700 border-rose-200",
  SAT: "bg-cyan-100 text-cyan-700 border-cyan-200",
  SUN: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function CreateShowPage() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const showCountryPartner = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;

  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const stations = useMemo(() => {
    if (isPartnerAdmin) {
      return stationsData.stations
        .filter((s) => s.partnerId === "PA-001")
        .map((s) => ({ value: s.name, label: s.name }));
    }
    return stationsData.stations.map((s) => ({ value: s.name, label: s.name }));
  }, [isPartnerAdmin]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onSubmit = (data: FormData) => {
    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }
    console.log({ ...data, days: selectedDays });
    toast.success("Show created successfully");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/station-management/shows" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Shows
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Add Show</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new show on a station or channel</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Show Name<span className="text-red-500 ml-0.5">*</span></label>
            <Input placeholder="e.g. Morning Drive" {...register("showName")} />
            {errors.showName && <p className="text-xs text-red-500 mt-1">{errors.showName.message}</p>}
          </div>

          {showCountryPartner && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Country</label>
                <select {...register("country")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                  <option value="">Select Country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Partner</label>
                <select {...register("partner")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                  <option value="">Select Partner</option>
                  {PARTNERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}

          {showStation && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Station / Channel<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("station")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Station / Channel*</option>
                {stations.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.station && <p className="text-xs text-red-500 mt-1">{errors.station.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Assigned Presenter</label>
            <select {...register("presenter")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
              <option value="">Select Assigned Presenter</option>
              {PRESENTERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.presenter && <p className="text-xs text-red-500 mt-1">{errors.presenter.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Day<span className="text-red-500 ml-0.5">*</span></label>
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-white min-h-[42px]">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                    selectedDays.includes(day)
                      ? `${DAY_COLORS[day]} border-current`
                      : "bg-white text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && <p className="text-[11px] text-muted-foreground mt-1">Select at least one day</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Start Time<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("startTime")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Start Time</option>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">End Time<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("endTime")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select End Time</option>
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Status</label>
              <select {...register("status")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Description</label>
            <textarea
              placeholder="Brief description of the show..."
              rows={4}
              {...register("description")}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
              <Plus size={15} className="mr-2" /> Create Show
            </Button>
            <Link href="/station-management/shows">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
