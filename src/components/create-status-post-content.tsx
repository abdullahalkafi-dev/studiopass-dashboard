"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Image, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { useCreateStatusMutation, useUploadStatusMediaMutation } from "@/features/status/statusApi";

const DURATIONS = [
  { label: "24 Hours", hours: 24 },
  { label: "48 Hours", hours: 48 },
  { label: "72 Hours", hours: 72 },
  { label: "7 Days", hours: 168 },
];

export default function CreateStatusPostContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const userStationId = user?.stationId;
  const userPartnerId = user?.partnerId;

  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationScoped = role === "station_admin" || role === "media_station" || role === "presenter";

  const [contentType, setContentType] = useState<"Text" | "Image">("Text");
  const [content, setContent] = useState("");
  const [countryId, setCountryId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [stationId, setStationId] = useState("");
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-inject stationId for station_admin / media_station / presenter
  useEffect(() => {
    if (isStationScoped && userStationId) {
      setStationId(userStationId);
    }
  }, [isStationScoped, userStationId]);

  const { data: countriesData, isLoading: countriesLoading } = useGetCountriesQuery(undefined, { skip: !isSuperAdmin });
  const { data: partnersData, isLoading: partnersLoading } = useGetPartnersQuery({ limit: 100 }, { skip: !isSuperAdmin });
  const { data: stationsData, isLoading: stationsLoading } = useGetStationsQuery(
    {
      limit: 100,
      ...(isPartnerAdmin && userPartnerId ? { partner: userPartnerId } : {}),
      ...(isStationScoped && userStationId ? { station: userStationId } : {}),
    },
    { skip: isStationScoped }
  );

  const countries = countriesData?.data || [];
  const allPartners = partnersData?.data || [];
  const allStations = (stationsData?.data || []).filter((s: any) => s.category !== "channel");

  // Cascade: filter partners by country
  const partners = countryId
    ? allPartners.filter((p: any) => {
        const partnerCountry = typeof p.country === "object" ? (p.country?._id || p.country?.id) : p.country;
        return partnerCountry?.toString() === countryId;
      })
    : allPartners;

  // Cascade: filter stations by partner or country
  const stations = isPartnerAdmin
    ? allStations
    : partnerId
    ? allStations.filter((s: any) => {
        const stationPartner = typeof s.partner === "object" ? (s.partner?._id || s.partner?.id) : s.partner;
        return stationPartner?.toString() === partnerId;
      })
    : countryId
    ? allStations.filter((s: any) => {
        const stationCountry = typeof s.country === "object" ? (s.country?._id || s.country?.id) : s.country;
        return stationCountry?.toString() === countryId;
      })
    : allStations;

  const [createStatus, { isLoading: isCreating }] = useCreateStatusMutation();
  const [uploadMedia, { isLoading: isUploading }] = useUploadStatusMediaMutation();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be less than 20MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    const resolvedStationId = isStationScoped ? userStationId : stationId;
    if (!resolvedStationId) {
      toast.error("Please select a station");
      return;
    }

    try {
      let media: string | undefined;

      if (contentType === "Image" && imageFile) {
        const uploadResult = await uploadMedia(imageFile).unwrap();
        media = uploadResult.data?.media;
      }

      const expiresAt = new Date(Date.now() + duration.hours * 60 * 60 * 1000).toISOString();

      await createStatus({
        content: content.trim(),
        media,
        expiresAt,
        stationId: resolvedStationId,
      }).unwrap();

      toast.success("Status post created successfully");
      router.push("/campaigns/status-posts");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create status post");
    }
  };

  const isSubmitting = isCreating || isUploading;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/campaigns/status-posts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back to Status Posts
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Create Status Post</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Publish a new status post to your station</p>
      </div>

      {/* Form Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden max-w-2xl">
        <div className="p-6 space-y-5">
          {/* Country + Partner (super admin only — optional filters) */}
          {isSuperAdmin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Country</label>
                <select
                  value={countryId}
                  onChange={(e) => {
                    setCountryId(e.target.value);
                    setPartnerId("");
                    setStationId("");
                  }}
                  disabled={countriesLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
                >
                  <option value="">{countriesLoading ? "Loading..." : "All Countries"}</option>
                  {countries.map((c: any) => (
                    <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Partner</label>
                <select
                  value={partnerId}
                  onChange={(e) => {
                    setPartnerId(e.target.value);
                    setStationId("");
                  }}
                  disabled={partnersLoading}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
                >
                  <option value="">{partnersLoading ? "Loading..." : "All Partners"}</option>
                  {partners.map((p: any) => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Station (required for super_admin and partner_admin, hidden for station_admin) */}
          {!isStationScoped && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Station<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                disabled={stationsLoading}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
              >
                <option value="">{stationsLoading ? "Loading..." : "Select Station"}</option>
                {stations.map((s: any) => (
                  <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* Content Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Content Type<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => { setContentType("Text"); removeImage(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  contentType === "Text"
                    ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                <FileText size={14} /> Text
              </button>
              <button
                onClick={() => setContentType("Image")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  contentType === "Image"
                    ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                <Image size={14} /> Image
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Content<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={contentType === "Image" ? "Enter image caption or description..." : "Enter your status post text content..."}
              rows={4}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all resize-none"
            />
          </div>

          {/* Image Upload */}
          {contentType === "Image" && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Image<span className="text-red-500 ml-0.5">*</span>
              </label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border border-border" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-[#02B2FF]/50 transition-colors cursor-pointer"
                >
                  <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold text-foreground">Click to upload image</p>
                  <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP up to 20MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Duration<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.hours}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    duration.hours === d.hours
                      ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Note:</span> Posts cannot be edited after publishing. Duration starts from the moment of publication.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex gap-3 bg-muted/20">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Publishing...
              </>
            ) : (
              <>Publish Post</>
            )}
          </button>
          <Link href="/campaigns/status-posts"
            className="px-5 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
