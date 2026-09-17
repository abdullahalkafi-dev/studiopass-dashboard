"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Trash2, ChevronDown, Plus } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useGetPrizeTypesQuery } from "@/features/prizeType/prizeTypeApi";
import {
  useGetChallengeByIdQuery,
  useUpdateChallengeMutation,
} from "@/features/challenge/challengeApi";
import { TimePicker } from "@/components/shared/time-picker";

const SELECT_CLASS = "w-full appearance-none px-3 py-2.5 pr-8 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const REQUIRED_ASTERISK = <span className="text-red-500 ml-0.5">*</span>;

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  instructions: z.string().max(2000).optional(),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().min(1, "End date is required"),
  endTime: z.string().min(1, "End time is required"),
  prizeTypeKey: z.string().min(1, "Prize type is required"),
  prizeValue: z.string().min(1, "Prize value is required"),
  numberOfWinners: z.number().int().min(1, "Must have at least 1 winner"),
  sponsorName: z.string().optional(),
  collectionInstructions: z.string().optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1, "Question text is required"),
        options: z
          .array(
            z.object({
              label: z.string().min(1, "Option is required"),
              isCorrect: z.boolean(),
            }),
          )
          .min(2, "At least 2 options required")
          .max(10),
        timeLimit: z.number().optional(),
      }),
    )
    .min(1, "At least 1 question required"),
  billingMode: z.enum(["credits", "free"]),
  creditCost: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

function SelectWithIcon({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props}>{children}</select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export default function EditChallengePage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const { data: prizeTypesData } = useGetPrizeTypesQuery();
  const { data: challengeData, isLoading: isLoadingChallenge } =
    useGetChallengeByIdQuery(challengeId);
  const [updateChallenge, { isLoading: isSubmitting }] =
    useUpdateChallengeMutation();

  const prizeTypes = prizeTypesData || [];
  const challenge = challengeData?.data;

  const canEditQuestions =
    challenge?.status === "draft" || challenge?.status === "scheduled";

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } =
    useFieldArray({ control, name: "questions" });

  // Pre-fill form when challenge data loads
  useEffect(() => {
    if (challenge) {
      const startDate = challenge.startDate
        ? new Date(challenge.startDate).toISOString().split("T")[0]
        : "";
      const endDate = challenge.endDate
        ? new Date(challenge.endDate).toISOString().split("T")[0]
        : "";

      reset({
        title: challenge.title || "",
        description: challenge.description || "",
        instructions: challenge.instructions || "",
        startDate,
        startTime: challenge.startTime || "",
        endDate,
        endTime: challenge.endTime || "",
        prizeTypeKey: challenge.prizeTypeKey || "mobile_money",
        prizeValue: challenge.prizeValue || "",
        numberOfWinners: challenge.numberOfWinners || 1,
        sponsorName: challenge.sponsorName || "",
        collectionInstructions: challenge.collectionInstructions || "",
        billingMode: challenge.billingMode || "free",
        creditCost: challenge.creditCost || 0,
        questions: (challenge.questions || []).map((q: any) => ({
          text: q.text || "",
          options: (q.options || []).map((o: any) => ({
            label: o.label || "",
            isCorrect: o.isCorrect || false,
          })),
          timeLimit: q.timeLimit,
        })),
      });
    }
  }, [challenge, reset]);

  const watchedPrizeKey = watch("prizeTypeKey");
  const watchedBillingMode = watch("billingMode");
  const selectedPrizeType = prizeTypes.find((pt: any) => pt.key === watchedPrizeKey);
  const currency = challenge?.currency || challenge?.station?.country?.currency || "UGX";

  const onSubmit = async (data: FormData) => {
    try {
      await updateChallenge({
        id: challengeId,
        ...data,
        prizeType: selectedPrizeType?._id,
        prizeLabel: selectedPrizeType?.label || data.prizeTypeKey,
      }).unwrap();
      toast.success("Challenge updated successfully");
      router.push("/channels/challenges");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update challenge");
    }
  };

  if (isLoadingChallenge) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-[#02B2FF]" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Challenge not found.</p>
        <Link
          href="/channels/challenges"
          className="text-sm text-[#02B2FF] hover:underline mt-2 inline-block"
        >
          Back to Challenges
        </Link>
      </div>
    );
  }

  const isLocked = challenge.status === "active" || challenge.status === "completed" || challenge.status === "cancelled";

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/channels/challenges"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors"
      >
        <ArrowLeft size={13} /> Back to Challenges
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Edit Challenge</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLocked
            ? "This challenge is locked. You can only edit title, description, and instructions."
            : "Update questions, schedule, prizes, and timing for this challenge."}
        </p>
      </div>

      {isLocked && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-sm">
          This challenge is <strong>{challenge.status}</strong>. Only title, description, and instructions can be edited.
          Questions, schedule, and prizes are locked.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Settings */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
            Basic Information
          </h2>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Challenge Title {REQUIRED_ASTERISK}
            </label>
            <Input {...register("title")} placeholder="e.g. Busoga One Quiz Challenge" />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Description {REQUIRED_ASTERISK}
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full p-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              placeholder="Provide context or rules for participants..."
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>
        </Card>

        {/* Schedule — overflow-visible so TimePicker dropdown isn't clipped */}
        <Card className="p-6 space-y-4 overflow-visible">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
            Schedule
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Start Date {REQUIRED_ASTERISK}
              </label>
              <Input type="date" {...register("startDate")} disabled={isLocked} />
              {errors.startDate && (
                <p className="text-xs text-destructive mt-1">{errors.startDate.message}</p>
              )}
            </div>
            <TimePicker
              value={watch("startTime") || ""}
              onChange={(val) =>
                setValue("startTime", val, { shouldValidate: true, shouldDirty: true })
              }
              label="Start Time"
              error={errors.startTime?.message}
              disabled={isLocked}
            />
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                End Date {REQUIRED_ASTERISK}
              </label>
              <Input type="date" {...register("endDate")} disabled={isLocked} />
              {errors.endDate && (
                <p className="text-xs text-destructive mt-1">{errors.endDate.message}</p>
              )}
            </div>
            <TimePicker
              value={watch("endTime") || ""}
              onChange={(val) =>
                setValue("endTime", val, { shouldValidate: true, shouldDirty: true })
              }
              label="End Time"
              error={errors.endTime?.message}
              disabled={isLocked}
            />
          </div>
        </Card>

        {/* Prize Selection */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
            Prize & Rewards
          </h2>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Prize Type {REQUIRED_ASTERISK}
            </label>
            <SelectWithIcon
              {...register("prizeTypeKey")}
              className={SELECT_CLASS}
              disabled={isLocked}
            >
              {prizeTypes.map((pt: any) => (
                <option key={pt.key} value={pt.key}>
                  {pt.label} ({pt.category.toUpperCase()})
                </option>
              ))}
            </SelectWithIcon>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              {watchedPrizeKey === "mobile_money" || watchedPrizeKey === "airtime"
                ? `Amount per Winner (${currency})`
                : watchedPrizeKey === "bonus_credits"
                  ? "Credits per Winner"
                  : watchedPrizeKey === "data_bundles"
                    ? "Bundle Size (e.g. 2 GB)"
                    : "Prize Description"}
              {REQUIRED_ASTERISK}
            </label>
            <Input
              {...register("prizeValue")}
              disabled={isLocked}
              placeholder={
                watchedPrizeKey === "mobile_money" || watchedPrizeKey === "airtime"
                  ? "20000"
                  : watchedPrizeKey === "bonus_credits"
                    ? "20"
                    : watchedPrizeKey === "data_bundles"
                      ? "2 GB"
                      : "Busoga One Branded Hoodie"
              }
            />
            {errors.prizeValue && (
              <p className="text-xs text-destructive mt-1">{errors.prizeValue.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Billing Mode
              </label>
              <SelectWithIcon
                {...register("billingMode")}
                className={SELECT_CLASS}
                disabled={isLocked}
              >
                <option value="free">Free Entry</option>
                <option value="credits">Paid (Requires User Credits)</option>
              </SelectWithIcon>
            </div>
            {watchedBillingMode === "credits" && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Entry Credit Cost
                </label>
                <Input
                  type="number"
                  min={1}
                  {...register("creditCost", { valueAsNumber: true })}
                  disabled={isLocked}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Questions Builder — dynamic 2-10 options, only editable when draft/scheduled */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Challenge Questions
                {!canEditQuestions && (
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    (Locked — challenge is {challenge.status})
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                All types support multiple questions. Listeners must answer every question to submit.
              </p>
            </div>
            {canEditQuestions && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendQuestion({
                    text: "",
                    options: [
                      { label: "", isCorrect: true },
                      { label: "", isCorrect: false },
                    ],
                    timeLimit: 30,
                  })
                }
                className="gap-1.5 text-xs text-[#02B2FF] border-[#02B2FF]/30 hover:bg-[#EFF8FF]"
              >
                <Plus size={14} /> Add Question
              </Button>
            )}
          </div>

          {questionFields.map((qField, qIndex) => (
            <EditQuestionCard
              key={qField.id}
              qIndex={qIndex}
              control={control}
              register={register}
              setValue={setValue}
              watch={watch}
              removeQuestion={removeQuestion}
              canRemove={questionFields.length > 1}
              canEdit={canEditQuestions}
            />
          ))}
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/channels/challenges"
            className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#02B2FF] hover:bg-[#00A0E8] text-white"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function EditQuestionCard({
  qIndex,
  control,
  register,
  setValue,
  watch,
  removeQuestion,
  canRemove,
  canEdit,
}: {
  qIndex: number;
  control: any;
  register: any;
  setValue: any;
  watch: any;
  removeQuestion: (index: number) => void;
  canRemove: boolean;
  canEdit: boolean;
}) {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${qIndex}.options`,
  });

  const watchedOptions = watch(`questions.${qIndex}.options`);
  const optionCount = optionFields.length;

  return (
    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 relative">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">Question #{qIndex + 1}</span>
        {canEdit && canRemove && (
          <button
            type="button"
            onClick={() => removeQuestion(qIndex)}
            className="text-destructive hover:text-destructive/80 transition-colors p-1"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <Input
        {...register(`questions.${qIndex}.text` as const)}
        placeholder="Enter question text..."
        disabled={!canEdit}
      />

      <div className="space-y-2 pt-2">
        {optionFields.map((optField, optIndex) => (
          <div key={optField.id} className="flex items-center gap-2">
            <input
              type="radio"
              name={`question-${qIndex}-correct`}
              checked={watchedOptions?.[optIndex]?.isCorrect === true}
              disabled={!canEdit}
              onChange={() => {
                if (!canEdit) return;
                optionFields.forEach((_, idx) => {
                  setValue(`questions.${qIndex}.options.${idx}.isCorrect` as const, idx === optIndex);
                });
              }}
              className="text-[#02B2FF] focus:ring-[#02B2FF]"
            />
            <Input
              {...register(`questions.${qIndex}.options.${optIndex}.label` as const)}
              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
              disabled={!canEdit}
            />
            {canEdit && optionCount > 2 && (
              <button
                type="button"
                onClick={() => removeOption(optIndex)}
                className="text-destructive hover:text-destructive/80 transition-colors p-1 shrink-0"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {canEdit && optionCount < 10 && (
        <button
          type="button"
          onClick={() => appendOption({ label: "", isCorrect: false })}
          className="flex items-center gap-1 text-xs text-[#02B2FF] hover:text-[#00A0E8] transition-colors mt-1"
        >
          <Plus size={12} /> Add Option
        </button>
      )}
    </div>
  );
}
