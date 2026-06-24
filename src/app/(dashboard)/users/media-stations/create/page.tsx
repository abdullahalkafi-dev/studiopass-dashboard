"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { useCreateMediaStationMutation } from "@/features/media-station/mediaStationApi";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  countryId: z.string().optional(),
  partnerId: z.string().optional(),
  stationId: z.string().min(1, "Station is required"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function CreateMediaStationPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;
  const userPartnerId = user?.partnerId;
  const userStationId = user?.stationId;

  const isSuperAdmin = userRole === "super_admin";
  const isPartnerAdmin = userRole === "partner_admin";
  const isStationAdmin = userRole === "station_admin";

  const { data: countriesData, isLoading: countriesLoading } = useGetCountriesQuery();
  const { data: partnersData, isLoading: partnersLoading } = useGetPartnersQuery({ limit: 100 });
  const { data: stationsData, isLoading: stationsLoading } = useGetStationsQuery({
    limit: 100,
    ...(isPartnerAdmin && userPartnerId ? { partner: userPartnerId } : {}),
    ...(isStationAdmin && userStationId ? { station: userStationId } : {}),
  });

  const [createMediaStation, { isLoading }] = useCreateMediaStationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      stationId: isStationAdmin && userStationId ? userStationId : "",
    },
  });

  const countries = countriesData?.data || [];
  const allPartners = partnersData?.data || [];
  const allStations = stationsData?.data || [];

  const watchedCountryId = watch("countryId");
  const watchedPartnerId = watch("partnerId");

  // Cascade: filter partners by country
  const partners = watchedCountryId
    ? allPartners.filter((p: any) => {
        const partnerCountry = typeof p.country === "object" ? (p.country?._id || p.country?.id) : p.country;
        return partnerCountry?.toString() === watchedCountryId;
      })
    : allPartners;

  // Cascade: filter stations by partner (or by partner+country)
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

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        fullName: data.fullName,
        stationId: data.stationId || userStationId,
      };

      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;
      payload.username = data.username;
      payload.password = data.password;

      await createMediaStation(payload).unwrap();
      toast.success("Media station user created successfully");
      router.push("/users/media-stations");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create media station user");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/users/media-stations" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Media Stations
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Create Media Station</h1>
        <p className="text-sm text-muted-foreground mt-1">Register a new media station user account</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name<span className="text-red-500 ml-0.5">*</span></label>
              <Input placeholder="Station contact name" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address</label>
              <Input type="email" placeholder="station@media.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number</label>
            <Input placeholder="+254 700 000 000" {...register("phone")} />
          </div>

          {/* Country + Partner (super admin only — optional filters) */}
          {isSuperAdmin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Country</label>
                <select
                  {...register("countryId")}
                  disabled={countriesLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer disabled:bg-muted"
                >
                  <option value="">{countriesLoading ? "Loading..." : "All Countries"}</option>
                  {countries.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Partner</label>
                <select
                  {...register("partnerId")}
                  disabled={partnersLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer disabled:bg-muted"
                >
                  <option value="">{partnersLoading ? "Loading..." : "All Partners"}</option>
                  {partners.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Station (required for super admin + partner admin, hidden for station admin) */}
          {!isStationAdmin && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Station<span className="text-red-500 ml-0.5">*</span></label>
              <select
                {...register("stationId")}
                disabled={stationsLoading}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer disabled:bg-muted"
              >
                <option value="">{stationsLoading ? "Loading..." : "Select Station"}</option>
                {stations.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.stationCode})</option>
                ))}
              </select>
              {errors.stationId && <p className="text-xs text-red-500 mt-1">{errors.stationId.message}</p>}
            </div>
          )}

          {/* Login Credentials */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Login Credentials</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Username<span className="text-red-500 ml-0.5">*</span></label>
                <Input placeholder="e.g. john.doe" {...register("username")} />
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Password<span className="text-red-500 ml-0.5">*</span></label>
                <Input type="password" placeholder="Min 6 characters" {...register("password")} />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
              {isLoading ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Plus size={15} className="mr-2" />}
              {isLoading ? "Creating..." : "Create Media Station"}
            </Button>
            <Link href="/users/media-stations">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
