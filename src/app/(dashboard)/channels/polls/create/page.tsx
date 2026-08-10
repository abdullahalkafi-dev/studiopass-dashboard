"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Loader2, Trash2, Upload, User, Image as ImageIcon, X } from "lucide-react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { useCreateChannelPollMutation } from "@/features/channelPoll/channelPollApi";
import { resolveUrl } from "@/lib/utils";

const nomineeSchema = z.object({
  name: z.string().min(1, "Nominee name is required"),
  photo: z.string().optional(),
  description: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  nominees: z.array(nomineeSchema).min(2, "At least 2 nominees required per category"),
});

const schema = z
  .object({
    station: z.string().min(1, "Target channel is required"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    categories: z.array(categorySchema).min(1, "At least 1 category required"),
    billingMode: z.enum(["credits", "free"]),
    creditCost: z.number().min(0),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    const nowBuffer = Date.now() - 2 * 60 * 1000; // 2 minutes grace period for form submission lag

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

type FormData = z.infer<typeof schema>;

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

// ─── Category Item Component ───
function CategorySection({
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
                  {/* Photo Thumbnail / Upload */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-lg border border-border bg-background flex flex-col items-center justify-center overflow-hidden relative group/photo">
                      {currentPhoto ? (
                        <>
                          <img
                            src={resolveUrl(currentPhoto)}
                            alt="Nominee"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setValue(`categories.${catIdx}.nominees.${nomIdx}.photo`, "", {
                                shouldValidate: true,
                              })
                            }
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : isUploading ? (
                        <Loader2 size={16} className="animate-spin text-[#02B2FF]" />
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                          <ImageIcon size={18} className="text-muted-foreground mb-0.5" />
                          <span className="text-[9px] font-semibold text-muted-foreground">Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handlePhotoUpload(nomIdx, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Name + Description Inputs */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <Input
                        placeholder="Nominee Name *"
                        className="text-xs h-8"
                        {...register(`categories.${catIdx}.nominees.${nomIdx}.name` as const)}
                      />
                      {nomErrors?.name && (
                        <p className="text-[10px] text-red-500 mt-0.5">{nomErrors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Input
                        placeholder="Short Description / Bio (optional)"
                        className="text-xs h-8"
                        {...register(`categories.${catIdx}.nominees.${nomIdx}.description` as const)}
                      />
                    </div>
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

// ─── Main Create Page ───
export default function CreatePollPage() {
  const role = useRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramStationId = searchParams.get("stationId") || "";

  const user = useAppSelector((state) => state.auth.user);
  const authToken = useAppSelector((state) => state.auth.token);
  const userStationId = user?.stationId || user?.station?.id;

  const isStationScoped = role === "station_admin" || role === "media_station" || role === "presenter";

  const { data: stationsData } = useGetStationsQuery({ category: "channel", limit: 100 });
  const [createChannelPoll, { isLoading: isSubmitting }] = useCreateChannelPollMutation();

  const channels = stationsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      station: (isStationScoped && userStationId) ? userStationId : paramStationId,
      billingMode: "free",
      creditCost: 1,
      categories: [
        {
          name: "Presenter of the Year",
          nominees: [
            { name: "John Doe", photo: "", description: "Morning Show Host" },
            { name: "Jane Smith", photo: "", description: "Evening Drive Host" },
          ],
        },
      ],
    },
  });

  useEffect(() => {
    if (isStationScoped && userStationId) {
      setValue("station", userStationId);
    }
  }, [isStationScoped, userStationId, setValue]);

  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({
    control,
    name: "categories",
  });

  const getMinDateTimeString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const minDateTime = getMinDateTimeString();

  const formValues = watch();
  const watchedStartDate = formValues.startDate;
  const watchedBillingMode = formValues.billingMode;
  const [activePreviewCatIdx, setActivePreviewCatIdx] = useState(0);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        station: isStationScoped && userStationId ? userStationId : data.station,
      };

      await createChannelPoll(payload).unwrap();
      toast.success("Channel poll created successfully");
      router.push("/channels/polls");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create channel poll");
    }
  };

  const previewCategories = formValues.categories || [];
  const selectedCategory = previewCategories[activePreviewCatIdx] || previewCategories[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/channels/polls"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors"
        >
          <ArrowLeft size={13} /> Back to Channel Polls
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-foreground">Create Channel Poll</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up a new channel voting event with custom categories, nominee photos, and billing rules.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="space-y-6">
          {/* Form Controls */}
          {/* Basic Info */}
          <Card className="p-6 space-y-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="w-2 h-4 rounded bg-[#02B2FF]" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                Basic Information
              </h3>
            </div>

              {!isStationScoped && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Target Channel<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    {...register("station")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]"
                  >
                    <option value="">Select Channel</option>
                    {channels.map((ch: any) => (
                      <option key={ch._id || ch.id} value={ch._id || ch.id}>
                        {ch.name} ({ch.country?.name || ch.country})
                      </option>
                    ))}
                  </select>
                  {errors.station && <p className="text-xs text-red-500 mt-1">{errors.station.message}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Poll Event Title<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input placeholder="e.g. Annual Media Choice Awards 2026" {...register("title")} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Event Description (optional)
                </label>
                <textarea
                  {...register("description")}
                  rows={2}
                  placeholder="Describe the voting event guidelines or details..."
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all resize-none"
                />
              </div>
            </Card>

            {/* Schedule & Billing */}
            <Card className="p-6 space-y-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="w-2 h-4 rounded bg-emerald-500" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Schedule & Billing Configuration
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Start Date & Time<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input type="datetime-local" min={minDateTime} {...register("startDate")} />
                  {errors.startDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    End Date & Time<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input type="datetime-local" min={watchedStartDate || minDateTime} {...register("endDate")} />
                  {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Billing Mode</label>
                  <select
                    {...register("billingMode")}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                  >
                    <option value="free">Free Voting</option>
                    <option value="credits">Credits Required (Paid Poll)</option>
                  </select>
                </div>

                {watchedBillingMode === "credits" && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Credit Cost per Vote
                    </label>
                    <Input type="number" min={1} {...register("creditCost", { valueAsNumber: true })} />
                  </div>
                )}
              </div>
            </Card>

            {/* Categories & Nominees */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-4 rounded bg-violet-500" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Categories & Candidate Nominees
                  </h3>
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
                  className="gap-1.5 text-xs text-[#02B2FF] border-[#02B2FF]/30 hover:bg-[#EFF8FF]"
                >
                  <Plus size={14} /> Add Category
                </Button>
              </div>

              {errors.categories?.root && (
                <p className="text-xs text-red-500">{errors.categories.root.message}</p>
              )}

              {categoryFields.map((catField, catIdx) => (
                <CategorySection
                  key={catField.id}
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

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link
                href="/channels/polls"
                className="px-5 py-2.5 text-xs font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-foreground"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#02B2FF] hover:bg-[#00A0E8] text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : "Publish Channel Poll"}
              </Button>
            </div>
        </div>
      </form>
    </div>
  );
}
