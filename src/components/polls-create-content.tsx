"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useCreatePollMutation } from "@/features/poll/pollApi";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery, useGetStationByIdQuery } from "@/features/station/stationApi";
import { useGetShowsQuery } from "@/features/show/showApi";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, BarChart3 } from "lucide-react";

interface OptionItem {
  label: string;
  imageUrl: string;
  isUploading?: boolean;
}

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const minioBase = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000";
  if (url.startsWith("studiopass/")) {
    return `${minioBase}/${url}`;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "")
    : "http://localhost:5003";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
}

export default function PollsCreateContent() {
  const role = useRole();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const authToken = useAppSelector((state) => state.auth.token);
  const userStationId = user?.stationId;
  const userPartnerId = user?.partnerId;

  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationScoped = role === "station_admin" || role === "media_station" || role === "presenter";

  const [createPoll, { isLoading }] = useCreatePollMutation();

  const [question, setQuestion] = useState("");
  const [countryId, setCountryId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [stationId, setStationId] = useState("");
  const [showId, setShowId] = useState("");
  const [duration, setDuration] = useState("");
  const [options, setOptions] = useState<OptionItem[]>([
    { label: "", imageUrl: "" },
    { label: "", imageUrl: "" },
  ]);
  const [created, setCreated] = useState(false);

  // Auto-inject stationId for station_admin / media_station / presenter
  useEffect(() => {
    if (isStationScoped && userStationId) {
      setStationId(userStationId);
    }
  }, [isStationScoped, userStationId]);

  const resolvedStationId = isStationScoped ? userStationId : stationId;
  const { data: stationDetailsData } = useGetStationByIdQuery(resolvedStationId || "", {
    skip: !resolvedStationId,
  });

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
  const allStations = (stationsData?.data || []).filter((s: any) => s.category !== "channel" || !s.channelType || s.channelType === "polls");

  const partners = countryId
    ? allPartners.filter((p: any) => {
        const partnerCountry = typeof p.country === "object" ? (p.country?._id || p.country?.id) : p.country;
        return partnerCountry?.toString() === countryId;
      })
    : allPartners;

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

  const activeStation = stationDetailsData?.data;
  const selectedStationObj = (stationsData?.data || []).find((s: any) => (s._id || s.id) === resolvedStationId);
  const targetStation = activeStation || selectedStationObj;
  const isChannel = targetStation?.category === "channel" || targetStation?.category === "channels";

  const { data: showsData } = useGetShowsQuery(
    { station: resolvedStationId || undefined, page: 1, limit: 100 },
    { skip: !resolvedStationId || isChannel }
  );
  const shows = showsData?.data || [];

  const addOption = () => {
    if (options.length < 6) setOptions([...options, { label: "", imageUrl: "" }]);
  };

  const removeOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOptionText = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = { ...next[idx], label: value };
    setOptions(next);
  };

  // Client-side 65% quality compression
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          },
          "image/webp",
          0.65
        );
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleOptionImageUpload = async (idx: number, file: File) => {
    try {
      const next = [...options];
      next[idx] = { ...next[idx], isUploading: true };
      setOptions(next);

      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append("optionImage", compressedBlob, "option.webp");
      formData.append("isOptionImage", "true");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/status/upload`, {
        method: "POST",
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      const uploadedPath = data?.data?.optionImage || data?.data?.media;
      if (res.ok && uploadedPath) {
        const updated = [...options];
        updated[idx] = { ...updated[idx], imageUrl: uploadedPath, isUploading: false };
        setOptions(updated);
        toast.success(`Image attached to Option ${idx + 1}`);
      } else {
        throw new Error(data?.message || "Upload failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload option image");
      const next = [...options];
      next[idx] = { ...next[idx], isUploading: false };
      setOptions(next);
    }
  };

  const removeOptionImage = (idx: number) => {
    const next = [...options];
    next[idx] = { ...next[idx], imageUrl: "" };
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error("Please enter a poll question");
      return;
    }
    const resolvedStationId = isStationScoped ? userStationId : stationId;
    if (!resolvedStationId) {
      toast.error("Please select a station");
      return;
    }
    const validOptions = options.filter((o) => o.label.trim());
    if (validOptions.length < 2) {
      toast.error("At least 2 option labels are required");
      return;
    }

    let expiresAt: string | undefined;
    if (duration && duration !== "no_limit") {
      const hours = parseInt(duration, 10);
      const expiryDate = new Date(Date.now() + hours * 60 * 60 * 1000);
      expiresAt = expiryDate.toISOString();
    }

    try {
      await createPoll({
        stationId: resolvedStationId,
        question: question.trim(),
        options: validOptions.map((o) => ({
          label: o.label.trim(),
          imageUrl: o.imageUrl || undefined,
        })),
        showId: isChannel ? undefined : (showId || undefined),
        expiresAt,
      }).unwrap();

      setCreated(true);
      toast.success("Poll created successfully!");
      setTimeout(() => router.push("/campaigns/polls"), 1500);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create poll");
    }
  };

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <BarChart3 size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Poll Created!</h2>
        <p className="text-sm text-muted-foreground mt-1">Redirecting to polls list…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/campaigns/polls" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft size={16} className="text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Poll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Launch a new audience poll{isChannel ? "" : " for a show"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Question */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Poll Question</label>
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What genre should we play next?"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all" />
          </div>

          {/* Country + Partner (super admin only — optional filters) */}
          {isSuperAdmin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Country</label>
                <select
                  value={countryId}
                  onChange={(e) => {
                    setCountryId(e.target.value);
                    setPartnerId("");
                    setStationId("");
                    setShowId("");
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Partner</label>
                <select
                  value={partnerId}
                  onChange={(e) => {
                    setPartnerId(e.target.value);
                    setStationId("");
                    setShowId("");
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Station<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select
                value={stationId}
                onChange={(e) => {
                  setStationId(e.target.value);
                  setShowId("");
                }}
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

          {/* Show + Duration row */}
          <div className={isChannel ? "block" : "grid grid-cols-2 gap-4"}>
            {/* Show */}
            {!isChannel && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Assign Show</label>
                <select value={showId} onChange={(e) => setShowId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all">
                  <option value="">Select Show</option>
                  {shows.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {/* Poll Duration */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Poll Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all">
                <option value="">Select Poll Duration</option>
                <option value="1">1 Hour</option>
                <option value="3">3 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
                <option value="72">3 Days (72h)</option>
                <option value="no_limit">No Limit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poll Options</label>
            {options.length < 6 && (
              <button type="button" onClick={addOption} className="text-xs font-semibold text-[#02B2FF] hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Option
              </button>
            )}
          </div>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">{idx + 1}</span>
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOptionText(idx, e.target.value)}
                placeholder={`Option ${idx + 1} text (Required)`}
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />

              {/* Option Image Thumbnail or Upload Button */}
              {opt.imageUrl ? (
                <div className="relative group w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveImageUrl(opt.imageUrl)} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeOptionImage(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    title="Remove Image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="px-3 py-2.5 text-xs font-medium border border-dashed border-border rounded-lg hover:border-[#02B2FF] hover:bg-[#02B2FF]/5 text-muted-foreground hover:text-[#02B2FF] cursor-pointer transition-colors shrink-0 flex items-center gap-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={opt.isUploading}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleOptionImageUpload(idx, e.target.files[0]);
                      }
                    }}
                  />
                  {opt.isUploading ? "Uploading..." : "📷 Image"}
                </label>
              )}

              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(idx)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Link href="/campaigns/polls" className="px-5 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-foreground">Cancel</Link>
          <button type="submit" disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold bg-[#02B2FF] text-white rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Creating…" : "Create Poll"}
          </button>
        </div>
      </form>
    </div>
  );
}
