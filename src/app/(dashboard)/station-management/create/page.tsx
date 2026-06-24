"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, X, Image } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useCreateStationMutation, useUploadStationLogoMutation, useUploadStationCoverImageMutation } from "@/features/station/stationApi";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useAppSelector } from "@/store/hooks";

const schema = z.object({
  name: z.string().min(1, "Station name is required"),
  category: z.string().min(1, "Station type is required"),
  countryId: z.string().optional(),
  partnerId: z.string().optional(),
  stationCode: z.string().min(3, "Station code must be at least 3 characters").regex(/^[a-zA-Z0-9-]+$/, "Letters, numbers, hyphens only"),
  adminFullName: z.string().min(1, "Admin full name is required"),
  adminUsername: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const TYPES = [
  { value: "radio", label: "Radio" },
  { value: "tv", label: "TV" },
  { value: "channel", label: "Channel" },
];

function validateImageFile(file: File): boolean {
  if (file.size > 8 * 1024 * 1024) {
    toast.error("File size must be less than 8MB");
    return false;
  }
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
    toast.error("Only JPG, PNG, WebP files are supported");
    return false;
  }
  return true;
}

export default function CreateStationPage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const isPartnerAdmin = userRole === "partner_admin";

  const { data: countriesData, isLoading: countriesLoading } = useGetCountriesQuery();
  const { data: partnersData, isLoading: partnersLoading } = useGetPartnersQuery({ limit: 100 });

  const [createStation, { isLoading }] = useCreateStationMutation();
  const [uploadLogo] = useUploadStationLogoMutation();
  const [uploadCoverImage] = useUploadStationCoverImageMutation();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const countries = countriesData?.data || [];
  const allPartners = partnersData?.data || [];
  const watchedCountryId = watch("countryId");

  const partners = watchedCountryId
    ? allPartners.filter((p: any) => {
        const partnerCountry = typeof p.country === "object" ? (p.country?._id || p.country?.id) : p.country;
        return partnerCountry?.toString() === watchedCountryId;
      })
    : allPartners;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImageFile(file)) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImageFile(file)) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const onSubmit = async (data: FormData) => {
    if (!logoFile) {
      toast.error("Station logo is required");
      return;
    }

    try {
      const payload: any = {
        name: data.name,
        stationCode: data.stationCode,
        category: data.category,
        adminFullName: data.adminFullName,
        adminUsername: data.adminUsername,
        adminPassword: data.adminPassword,
      };

      if (!isPartnerAdmin) {
        if (data.partnerId) payload.partnerId = data.partnerId;
        if (data.countryId) payload.countryId = data.countryId;
      }

      const result = await createStation(payload).unwrap();

      if (result.station?.id) {
        try {
          await uploadLogo({ id: result.station.id, file: logoFile }).unwrap();
        } catch {
          toast.warning("Station created but logo upload failed. You can upload it later.");
        }
        if (coverFile) {
          try {
            await uploadCoverImage({ id: result.station.id, file: coverFile }).unwrap();
          } catch {
            toast.warning("Cover image upload failed. You can upload it later.");
          }
        }
      }

      toast.success("Station and admin created successfully");
      router.push("/station-management/radio");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create station");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/station-management/radio" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Stations
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Create Station</h1>
        <p className="text-sm text-muted-foreground mt-1">Register a new station on the platform</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Station Name<span className="text-red-500 ml-0.5">*</span></label>
              <Input placeholder="e.g. Capital FM" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Station Type<span className="text-red-500 ml-0.5">*</span></label>
              <select {...register("category")} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer">
                <option value="">Select Type</option>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
            </div>
          </div>

          {!isPartnerAdmin && (
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
                <label className="block text-xs font-semibold text-foreground mb-1.5">Partner<span className="text-red-500 ml-0.5">*</span></label>
                <select
                  {...register("partnerId")}
                  disabled={partnersLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer disabled:bg-muted"
                >
                  <option value="">{partnersLoading ? "Loading..." : "Select Partner"}</option>
                  {partners.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.partnerId && <p className="text-xs text-red-500 mt-1">{errors.partnerId.message}</p>}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Station Code<span className="text-red-500 ml-0.5">*</span></label>
            <Input placeholder="e.g. CAP-FM-KE" {...register("stationCode")} />
            {errors.stationCode && <p className="text-xs text-red-500 mt-1">{errors.stationCode.message}</p>}
          </div>

          {/* Logo Upload — Required */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Station Logo<span className="text-red-500 ml-0.5">*</span></label>
            {logoPreview ? (
              <div className="relative w-32 h-32 border-2 border-border rounded-xl overflow-hidden">
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-[#02B2FF]/50 transition-colors cursor-pointer"
              >
                <Image size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Click to upload logo</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP up to 8MB</p>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>

          {/* Cover Image Upload — Optional */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Cover Photo</label>
            {coverPreview ? (
              <div className="relative w-full h-40 border-2 border-border rounded-xl overflow-hidden">
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-[#02B2FF]/50 transition-colors cursor-pointer"
              >
                <Image size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Click to upload cover photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP up to 8MB — wide format recommended</p>
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverChange}
              className="hidden"
            />
          </div>

          {/* Admin Credentials */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Station Admin Account</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Admin Full Name<span className="text-red-500 ml-0.5">*</span></label>
                <Input placeholder="e.g. John Doe" {...register("adminFullName")} />
                {errors.adminFullName && <p className="text-xs text-red-500 mt-1">{errors.adminFullName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Username<span className="text-red-500 ml-0.5">*</span></label>
                <Input placeholder="e.g. capital_fm" {...register("adminUsername")} />
                {errors.adminUsername && <p className="text-xs text-red-500 mt-1">{errors.adminUsername.message}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-foreground mb-1.5">Password<span className="text-red-500 ml-0.5">*</span></label>
              <Input type="password" placeholder="Min 6 characters" {...register("adminPassword")} />
              {errors.adminPassword && <p className="text-xs text-red-500 mt-1">{errors.adminPassword.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
              {isLoading ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Plus size={15} className="mr-2" />}
              {isLoading ? "Creating..." : "Create Station"}
            </Button>
            <Link href="/station-management/radio">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
