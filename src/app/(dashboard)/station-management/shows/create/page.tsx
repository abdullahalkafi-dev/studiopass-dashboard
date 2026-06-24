"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRole } from "@/contexts/role-context";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { useGetPresentersQuery } from "@/features/presenter/presenterApi";
import { useCreateShowMutation } from "@/features/show/showApi";
import { useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";

const schema = z.object({
  showName: z.string().min(1, "Show name is required"),
  countryId: z.string().optional(),
  partnerId: z.string().optional(),
  stationId: z.string().min(1, "Station is required"),
  presenterId: z.string().min(1, "Presenter is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const TIMES = [
  "05:00", "06:00", "07:00", "08:00", "09:00", "10:00",
  "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
  "23:00", "00:00",
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
  const router = useRouter();
  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";
  const showCountryPartner = isSuperAdmin;

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [createShow, { isLoading }] = useCreateShowMutation();

  const { data: countriesData, isLoading: countriesLoading } = useGetCountriesQuery();
  const { data: partnersData, isLoading: partnersLoading } = useGetPartnersQuery({ limit: 100 });
  const { data: stationsData, isLoading: stationsLoading } = useGetStationsQuery({
    limit: 100,
    ...(isPartnerAdmin && user?.partnerId ? { partner: user.partnerId } : {}),
    ...(isStationAdmin && user?.stationId ? { station: user.stationId } : {}),
  });

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      stationId: isStationAdmin && user?.stationId ? user.stationId : "",
    },
  });

  const watchedCountryId = watch("countryId");
  const watchedPartnerId = watch("partnerId");
  const watchedStationId = watch("stationId");

  // For station admin, the effective station is always their stationId
  const effectiveStationId = watchedStationId || (isStationAdmin && user?.stationId) || "";

  const countries = countriesData?.data || [];
  const allPartners = partnersData?.data || [];
  const allStations = stationsData?.data || [];

  const partners = watchedCountryId
    ? allPartners.filter((p: any) => {
        const partnerCountry = typeof p.country === "object" ? (p.country?._id || p.country?.id) : p.country;
        return partnerCountry?.toString() === watchedCountryId;
      })
    : allPartners;

  const stations = watchedPartnerId
    ? allStations.filter((s: any) => {
        const stationPartner = typeof s.partner === "object" ? (s.partner?._id || s.partner?.id) : s.partner;
        return stationPartner?.toString() === watchedPartnerId;
      })
    : watchedCountryId
    ? allStations.filter((s: any) => {
        const stationCountry = typeof s.country === "object" ? (s.country?._id || s.country?.id) : s.country;
        return stationCountry?.toString() === watchedCountryId;
      })
    : allStations;

  // Fetch presenters filtered by effective station
  const { data: presentersData } = useGetPresentersQuery(
    { station: effectiveStationId, limit: 100 },
    { skip: !effectiveStationId }
  );
  const presenters = presentersData?.data || [];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const onSubmit = async (data: FormData) => {
    if (selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }
    try {
      await createShow({
        name: data.showName,
        stationId: data.stationId || user?.stationId || "",
        presenterId: data.presenterId || undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        days: selectedDays,
        description: data.description || undefined,
      }).unwrap();
      toast.success("Show created successfully");
      router.push("/station-management/shows");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create show");
    }
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

          {/* Country + Partner (super admin only) */}
          {showCountryPartner && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Country</label>
                <select {...register("countryId")} disabled={countriesLoading} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer disabled:bg-muted">
                  <option value="">{countriesLoading ? "Loading..." : "All Countries"}</option>
                  {countries.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Partner</label>
                <select {...register("partnerId")} disabled={partnersLoading} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer disabled:bg-muted">
                  <option value="">{partnersLoading ? "Loading..." : "All Partners"}</option>
                  {partners.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Station — hidden for station admin (pre-filled from JWT) */}
          {(isSuperAdmin || isPartnerAdmin) && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Station / Channel<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("stationId")} disabled={stationsLoading} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer disabled:bg-muted">
                <option value="">{stationsLoading ? "Loading..." : "Select Station"}</option>
                {stations.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.stationCode})</option>)}
              </select>
              {errors.stationId && <p className="text-xs text-red-500 mt-1">{errors.stationId.message}</p>}
            </div>
          )}

          {/* Assigned Presenter — real data from API, filtered by station */}
          {effectiveStationId && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Assigned Presenter<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("presenterId")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">{presenters.length === 0 ? "No presenters for this station" : "Select Presenter"}</option>
                {presenters.map((p: any) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
              {errors.presenterId && <p className="text-xs text-red-500 mt-1">{errors.presenterId.message}</p>}
            </div>
          )}

          {/* Day selection */}
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

          {/* Time selection */}
          <div className="grid grid-cols-2 gap-4">
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
            <Button type="submit" disabled={isLoading} className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
              {isLoading ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Plus size={15} className="mr-2" />}
              {isLoading ? "Creating..." : "Create Show"}
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
