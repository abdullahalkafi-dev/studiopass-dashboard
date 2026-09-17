"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useCreatePollMutation } from "@/features/poll/pollApi";
import { useCreateChannelPollMutation } from "@/features/channelPoll/channelPollApi";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery, useGetStationByIdQuery } from "@/features/station/stationApi";
import { useGetShowsQuery } from "@/features/show/showApi";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  BarChart3,
  ChevronDown,
  Loader2,
  Image as ImageIcon,
  Clock,
  Upload,
  User,
} from "lucide-react";
import { resolveUrl } from "@/lib/utils";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DateTimePicker } from "@/components/shared/time-picker";
import { toUtcIsoString, getNowInTimezoneString } from "@/utils/time-utils";

// Helper to resolve media URLs
function resolveImageUrl(url: string | null | undefined): string {
  return resolveUrl(url) || "";
}

// ─── Image Compressor Helper ───
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
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-FORM 1: SHOW / CAMPAIGN POLL FORM (Radio & TV Stations)
// ─────────────────────────────────────────────────────────────────────────────
interface ShowOptionItem {
  label: string;
  imageUrl: string;
  isUploading?: boolean;
}

function ShowPollForm({
  station,
  authToken,
  onSuccess,
}: {
  station: any;
  authToken: string | null;
  onSuccess: () => void;
}) {
  const stationId = station?._id || station?.id;
  const [createPoll, { isLoading }] = useCreatePollMutation();

  const [question, setQuestion] = useState("");
  const [showId, setShowId] = useState("");
  const [duration, setDuration] = useState("");
  const [options, setOptions] = useState<ShowOptionItem[]>([
    { label: "", imageUrl: "" },
    { label: "", imageUrl: "" },
  ]);

  const { data: showsData } = useGetShowsQuery(
    { station: stationId, page: 1, limit: 100 },
    { skip: !stationId }
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
      toast.error(err?.message || "Failed to upload option image");
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
        stationId,
        question: question.trim(),
        options: validOptions.map((o) => ({
          label: o.label.trim(),
          imageUrl: o.imageUrl || undefined,
        })),
        showId: showId || undefined,
        expiresAt,
      }).unwrap();

      toast.success("Poll created successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create poll");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <BarChart3 size={16} className="text-[#02B2FF]" />
          <span className="text-sm font-bold text-foreground">Radio / TV Show Poll Details</span>
        </div>

        {/* Question */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
            Poll Question<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What genre should we play next?"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
          />
        </div>

        {/* Show + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Assign Show (Optional)
            </label>
            <div className="relative">
              <select
                value={showId}
                onChange={(e) => setShowId(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
              >
                <option value="">Select Show</option>
                {shows.map((s: any) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Poll Duration
            </label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
              >
                <option value="">Select Poll Duration</option>
                <option value="1">1 Hour</option>
                <option value="3">3 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
                <option value="72">3 Days (72h)</option>
                <option value="no_limit">No Limit</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Poll Options ({options.length}/6)
          </label>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="text-xs font-semibold text-[#02B2FF] hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Add Option
            </button>
          )}
        </div>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
              {idx + 1}
            </span>
            <input
              type="text"
              value={opt.label}
              onChange={(e) => updateOptionText(idx, e.target.value)}
              placeholder={`Option ${idx + 1} text (Required)`}
              className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />

            {/* Option Image */}
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
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Form Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center gap-3 justify-end">
        <Link
          href="/campaigns/polls"
          className="w-full sm:w-auto text-center px-5 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto justify-center px-5 py-2.5 text-sm font-semibold bg-[#02B2FF] text-white rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? "Creating…" : "Create Poll"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-FORM 2: CHANNEL POLL FORM (Dedicated Poll Channels)
// ─────────────────────────────────────────────────────────────────────────────
const channelNomineeSchema = z.object({
  name: z.string().min(1, "Nominee name is required"),
  photo: z.string().optional(),
  description: z.string().optional(),
});

const channelCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  nominees: z.array(channelNomineeSchema).min(2, "At least 2 nominees required per category"),
});

const channelPollSchema = z
  .object({
    station: z.string().min(1, "Target channel is required"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    categories: z.array(channelCategorySchema).min(1, "At least 1 category required"),
    billingMode: z.enum(["credits", "free"]),
    creditCost: z.number().min(0),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    const nowBuffer = Date.now() - 30 * 60 * 1000;

    if (!isNaN(start) && start < nowBuffer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date cannot be in the past",
        path: ["startDate"],
      });
    }

    if (!isNaN(start) && !isNaN(end) && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
        path: ["endDate"],
      });
    }
  });

type ChannelPollFormData = z.infer<typeof channelPollSchema>;

function ChannelCategoryItem({
  catIdx,
  control,
  register,
  errors,
  onRemoveCategory,
  canRemoveCategory,
  authToken,
  setValue,
}: {
  catIdx: number;
  control: any;
  register: any;
  errors: any;
  onRemoveCategory: () => void;
  canRemoveCategory: boolean;
  authToken: string | null;
  setValue: any;
}) {
  const {
    fields: nomineeFields,
    append: appendNominee,
    remove: removeNominee,
  } = useFieldArray({
    control,
    name: `categories.${catIdx}.nominees`,
  });

  const categoryNominees = useWatch({
    control,
    name: `categories.${catIdx}.nominees`,
  });

  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});

  const handlePhotoUpload = async (nomIdx: number, file: File) => {
    setUploadingMap((prev) => ({ ...prev, [nomIdx]: true }));
    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressedBlob, `${file.name.split(".")[0]}.webp`);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const res = await fetch(`${baseUrl}/status/upload-media`, {
        method: "POST",
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      const uploadedPath = data?.data?.media || data?.data?.optionImage;

      if (res.ok && uploadedPath) {
        setValue(`categories.${catIdx}.nominees.${nomIdx}.photo`, uploadedPath, {
          shouldValidate: true,
          shouldDirty: true,
        });
        toast.success("Nominee photo uploaded!");
      } else {
        throw new Error(data?.message || "Upload failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload nominee photo");
    } finally {
      setUploadingMap((prev) => ({ ...prev, [nomIdx]: false }));
    }
  };

  const catErrors = errors?.categories?.[catIdx];

  return (
    <Card className="p-5 space-y-4 border border-border shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center font-bold text-xs">
            {catIdx + 1}
          </span>
          <span className="text-sm font-bold text-foreground">Category #{catIdx + 1}</span>
        </div>
        {canRemoveCategory && (
          <button
            type="button"
            onClick={onRemoveCategory}
            className="text-red-500 hover:text-red-600 transition-colors p-1 flex items-center gap-1 text-xs font-semibold"
          >
            <Trash2 size={14} /> Remove Category
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          Category Name<span className="text-red-500 ml-0.5">*</span>
        </label>
        <Input
          placeholder="e.g. Best Presenter of the Year"
          {...register(`categories.${catIdx}.name` as const)}
        />
        {catErrors?.name && <p className="text-xs text-red-500 mt-1">{catErrors.name.message}</p>}
      </div>

      {/* Nominees */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Nominees ({nomineeFields.length})
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => appendNominee({ name: "", photo: "", description: "" })}
            className="gap-1 text-xs text-[#02B2FF] hover:bg-[#EFF8FF] h-7 px-2"
          >
            <Plus size={13} /> Add Nominee
          </Button>
        </div>

        {catErrors?.nominees?.root && (
          <p className="text-xs text-red-500">{catErrors.nominees.root.message}</p>
        )}

        <div className="space-y-3">
          {nomineeFields.map((nomField, nomIdx) => {
            const currentPhoto = categoryNominees?.[nomIdx]?.photo;
            const isUploading = uploadingMap[nomIdx];
            const nomErrors = catErrors?.nominees?.[nomIdx];

            return (
              <div
                key={nomField.id}
                className="p-3 rounded-lg border border-border bg-muted/10 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Nominee {nomIdx + 1}
                  </span>
                  {nomineeFields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeNominee(nomIdx)}
                      className="text-red-500 hover:text-red-600 transition-colors p-0.5"
                      title="Remove nominee"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {/* Nominee Photo */}
                  <div className="relative w-16 h-16 rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0 group/photo">
                    {currentPhoto ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveImageUrl(currentPhoto)}
                          alt="Nominee"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setValue(`categories.${catIdx}.nominees.${nomIdx}.photo`, "", {
                              shouldDirty: true,
                            })
                          }
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePhotoUpload(nomIdx, e.target.files[0]);
                            }
                          }}
                        />
                        {isUploading ? (
                          <Loader2 size={16} className="animate-spin text-[#02B2FF]" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload size={14} className="text-muted-foreground mb-0.5" />
                            <span className="text-[9px] text-muted-foreground">Photo</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>

                  {/* Name + Description Inputs */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <Input
                        placeholder="Nominee Name *"
                        className="h-8 text-xs"
                        {...register(`categories.${catIdx}.nominees.${nomIdx}.name` as const)}
                      />
                      {nomErrors?.name && (
                        <p className="text-[11px] text-red-500 mt-0.5">{nomErrors.name.message}</p>
                      )}
                    </div>
                    <Input
                      placeholder="Role / Description (e.g. Morning Show Host)"
                      className="h-8 text-xs"
                      {...register(`categories.${catIdx}.nominees.${nomIdx}.description` as const)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ChannelPollForm({
  station,
  authToken,
  user,
  role,
  onSuccess,
}: {
  station: any;
  authToken: string | null;
  user: any;
  role: string;
  onSuccess: () => void;
}) {
  const stationId = station?._id || station?.id;
  const [createChannelPoll, { isLoading: isSubmitting }] = useCreateChannelPollMutation();

  const defaultFallbackTimezone = role === "super_admin" ? "Africa/Kampala" : (user?.timezone || "UTC");
  const targetTimezone =
    station?.country?.timezone ||
    (typeof station?.country === "object" ? station?.country?.timezone : undefined) ||
    defaultFallbackTimezone;
  const targetCountryName =
    station?.country?.name ||
    (typeof station?.country === "object" ? station?.country?.name : undefined) ||
    (role === "super_admin" ? "Uganda" : "");

  const minDateTime = getNowInTimezoneString(targetTimezone);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<ChannelPollFormData>({
    resolver: zodResolver(channelPollSchema),
    defaultValues: {
      station: stationId,
      billingMode: "free",
      creditCost: 1,
      categories: [
        {
          name: "Presenter of the Year",
          nominees: [
            { name: "Nominee 1", photo: "", description: "Morning Host" },
            { name: "Nominee 2", photo: "", description: "Drive Host" },
          ],
        },
      ],
    },
  });

  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({
    control,
    name: "categories",
  });

  const formValues = watch();
  const watchedBillingMode = formValues.billingMode;

  const onSubmit = async (data: ChannelPollFormData) => {
    try {
      const utcStartDate = toUtcIsoString(data.startDate, targetTimezone);
      const utcEndDate = toUtcIsoString(data.endDate, targetTimezone);

      const payload = {
        ...data,
        startDate: utcStartDate,
        endDate: utcEndDate,
        station: stationId,
      };

      await createChannelPoll(payload).unwrap();
      toast.success("Channel poll created successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create channel poll");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card className="p-5 space-y-4 border border-border shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <BarChart3 size={16} className="text-[#02B2FF]" />
          <span className="text-sm font-bold text-foreground">Channel Voting Poll Info</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Poll Title<span className="text-red-500 ml-0.5">*</span>
          </label>
          <Input placeholder="e.g. Media Awards 2026 — Public Voting" {...register("title")} />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Description (Optional)</label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Describe the voting campaign rules, nominee criteria..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all resize-none"
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>
      </Card>

      {/* Date & Time Settings — overflow-visible so TimePicker dropdown isn't clipped */}
      <Card className="p-5 space-y-4 border border-border shadow-sm overflow-visible relative z-10">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#02B2FF]" />
            <span className="text-sm font-bold text-foreground">Voting Schedule</span>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            Timezone: {targetTimezone} {targetCountryName ? `(${targetCountryName})` : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Start Date & Time<span className="text-red-500 ml-0.5">*</span>
            </label>
            <DateTimePicker
              value={formValues.startDate || ""}
              onChange={(val) => setValue("startDate", val, { shouldValidate: true })}
              min={minDateTime}
              placeholder="Select start date & time"
              timezone={targetTimezone}
            />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              End Date & Time<span className="text-red-500 ml-0.5">*</span>
            </label>
            <DateTimePicker
              value={formValues.endDate || ""}
              onChange={(val) => setValue("endDate", val, { shouldValidate: true })}
              min={formValues.startDate || minDateTime}
              placeholder="Select end date & time"
              timezone={targetTimezone}
            />
            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
          </div>
        </div>
      </Card>

      {/* Billing & Vote Credits */}
      <Card className="p-5 space-y-4 border border-border shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <span className="text-sm font-bold text-foreground">Voting Mode & Cost</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Billing Mode</label>
            <div className="relative">
              <select
                {...register("billingMode")}
                className="w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
              >
                <option value="free">Free Voting</option>
                <option value="credits">Credit-Based (Paid Voting)</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {watchedBillingMode === "credits" && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Credits Per Vote</label>
              <Input
                type="number"
                min="1"
                {...register("creditCost", { valueAsNumber: true })}
                placeholder="1"
              />
              {errors.creditCost && <p className="text-xs text-red-500 mt-1">{errors.creditCost.message}</p>}
            </div>
          )}
        </div>
      </Card>

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Voting Categories</h2>
            <p className="text-xs text-muted-foreground">Add categories with their respective nominees</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendCategory({
                name: "",
                nominees: [
                  { name: "", photo: "", description: "" },
                  { name: "", photo: "", description: "" },
                ],
              })
            }
            className="gap-1 text-xs border-dashed border-[#02B2FF] text-[#02B2FF] hover:bg-[#02B2FF]/5"
          >
            <Plus size={14} /> Add Category
          </Button>
        </div>

        {errors.categories?.root && (
          <p className="text-xs text-red-500">{errors.categories.root.message}</p>
        )}

        <div className="space-y-4">
          {categoryFields.map((field, catIdx) => (
            <ChannelCategoryItem
              key={field.id}
              catIdx={catIdx}
              control={control}
              register={register}
              errors={errors}
              onRemoveCategory={() => removeCategory(catIdx)}
              canRemoveCategory={categoryFields.length > 1}
              authToken={authToken}
              setValue={setValue}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center gap-3 justify-end pt-4">
        <Link
          href="/campaigns/polls"
          className="w-full sm:w-auto text-center px-5 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto justify-center px-6 py-2.5 text-sm font-semibold bg-[#02B2FF] text-white rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating Channel Poll…
            </>
          ) : (
            "Publish Channel Poll"
          )}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONTAINER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
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

  const [countryId, setCountryId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [stationId, setStationId] = useState("");
  const [created, setCreated] = useState(false);

  // Auto-select station for station-scoped roles
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

  // Filter stations to Radio, TV, and Poll Channels only (excluding non-poll channels)
  const allStations = (stationsData?.data || []).filter(
    (s: any) => s.category !== "channel" || !s.channelType || s.channelType === "polls"
  );

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

  const getStationTypeBadge = (s: any) => {
    if (s.category === "channel" || s.category === "channels") {
      return s.channelType === "polls" ? "Poll Channel" : "Channel";
    }
    if (s.category === "tv") return "TV";
    if (s.category === "radio") return "Radio";
    return s.category ? s.category.toUpperCase() : "Radio";
  };

  const handleSuccess = () => {
    setCreated(true);
    setTimeout(() => {
      // Channel polls live under Campaigns → Polls → Channel tab
      if (isChannel) {
        router.push("/campaigns/polls?type=channel");
      } else {
        router.push("/campaigns/polls?type=station");
      }
    }, 1200);
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
        <Link
          href="/campaigns/polls"
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} className="text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Poll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {targetStation
              ? isChannel
                ? `Create a multi-category voting poll for ${targetStation.name}`
                : `Create an audience poll for ${targetStation.name}`
              : "Select a station to configure your poll"}
          </p>
        </div>
      </div>

      {/* STEP 1: Station Selector Card (Top) */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center font-bold text-xs">
              1
            </span>
            <span className="text-sm font-bold text-foreground">Select Target Station</span>
          </div>
          {targetStation && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] border border-[#02B2FF]/20">
              {getStationTypeBadge(targetStation)}
            </span>
          )}
        </div>

        {/* Country + Partner filters for Super Admin */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Country
              </label>
              <div className="relative">
                <select
                  value={countryId}
                  onChange={(e) => {
                    setCountryId(e.target.value);
                    setPartnerId("");
                    setStationId("");
                  }}
                  disabled={countriesLoading}
                  className="w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
                >
                  <option value="">{countriesLoading ? "Loading..." : "All Countries"}</option>
                  {countries.map((c: any) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Partner
              </label>
              <div className="relative">
                <select
                  value={partnerId}
                  onChange={(e) => {
                    setPartnerId(e.target.value);
                    setStationId("");
                  }}
                  disabled={partnersLoading}
                  className="w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer"
                >
                  <option value="">{partnersLoading ? "Loading..." : "All Partners"}</option>
                  {partners.map((p: any) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Station Dropdown */}
        {!isStationScoped ? (
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Station<span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                disabled={stationsLoading}
                className="w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer font-medium"
              >
                <option value="">{stationsLoading ? "Loading stations..." : "Select Station"}</option>
                {stations.map((s: any) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name} ({getStationTypeBadge(s)})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{targetStation?.name || "Your Assigned Station"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {targetStation ? getStationTypeBadge(targetStation) : "Station"}
            </span>
          </div>
        )}
      </div>

      {/* STEP 2: DYNAMIC FORM CONTAINER */}
      {resolvedStationId && targetStation ? (
        isChannel ? (
          // Channel Poll Form with isolated key
          <ChannelPollForm
            key={`channel-poll-${resolvedStationId}`}
            station={targetStation}
            authToken={authToken}
            user={user}
            role={role}
            onSuccess={handleSuccess}
          />
        ) : (
          // Show / Campaign Poll Form with isolated key
          <ShowPollForm
            key={`show-poll-${resolvedStationId}`}
            station={targetStation}
            authToken={authToken}
            onSuccess={handleSuccess}
          />
        )
      ) : (
        /* Empty State Guidance */
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-base font-semibold text-foreground">Select a Station to Configure Poll</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Choose a Radio, TV, or Poll Channel from the dropdown above to load the appropriate poll creator.
          </p>
        </div>
      )}
    </div>
  );
}
