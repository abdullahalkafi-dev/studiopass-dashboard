"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Loader2, Trash2, ChevronDown } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useGetPrizeTypesQuery } from "@/features/prizeType/prizeTypeApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { useCreateChallengeMutation } from "@/features/challenge/challengeApi";
import { TimePicker } from "@/components/shared/time-picker";

const SELECT_CLASS = "w-full appearance-none px-3 py-2.5 pr-8 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer";
const REQUIRED_ASTERISK = <span className="text-red-500 ml-0.5">*</span>;

const schema = z.object({
  station: z.string().min(1, "Channel is required"),
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(["quiz", "fastest_answer", "question_of_day"], { message: "Type is required" }),
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
  questions: z.array(z.object({
    text: z.string().min(1, "Question text is required"),
    options: z.array(z.object({
      label: z.string().min(1, "Option is required"),
      isCorrect: z.boolean(),
    })).min(2, "At least 2 options required").max(10),
    timeLimit: z.number().optional(),
  })).min(1, "At least 1 question required"),
  billingMode: z.enum(["credits", "free"]),
  creditCost: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

const CHALLENGE_TYPES = [
  { value: "quiz", label: "Quiz Challenge" },
  { value: "fastest_answer", label: "Fastest Correct Answer" },
  { value: "question_of_day", label: "Question of the Day" },
];

function SelectWithIcon({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props}>{children}</select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export default function CreateChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramStationId = searchParams.get("stationId") || "";

  const { data: prizeTypesData } = useGetPrizeTypesQuery();
  const { data: stationsData } = useGetStationsQuery({ category: "channel", channelType: "challenges", limit: 100 });
  const [createChallenge, { isLoading: isSubmitting }] = useCreateChallengeMutation();

  const prizeTypes = prizeTypesData || [];
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
      station: paramStationId,
      billingMode: "free",
      creditCost: 1,
      numberOfWinners: 1,
      prizeTypeKey: "mobile_money",
      questions: [
        {
          text: "",
          options: [
            { label: "", isCorrect: true },
            { label: "", isCorrect: false },
          ],
          timeLimit: 30,
        },
      ],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: "questions",
  });

  const watchedStationId = watch("station");
  const watchedPrizeKey = watch("prizeTypeKey");
  const watchedBillingMode = watch("billingMode");

  const selectedStation = channels.find((c: any) => c._id === watchedStationId || c.id === watchedStationId);
  const selectedPrizeType = prizeTypes.find((pt) => pt.key === watchedPrizeKey);
  const currency = selectedStation?.country?.currency || "UGX";

  const onSubmit = async (data: FormData) => {
    try {
      await createChallenge({
        ...data,
        prizeType: selectedPrizeType?._id,
        prizeLabel: selectedPrizeType?.label || data.prizeTypeKey,
        currency,
      }).unwrap();
      toast.success("Challenge created successfully");
      router.push("/channels/challenges");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create challenge");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/channels/challenges" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Challenges
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Create Challenge</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure questions, rewards, and timing for your channel challenge.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Settings */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">Basic Information</h2>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Target Channel {REQUIRED_ASTERISK}</label>
            <SelectWithIcon
              {...register("station")}
              className={SELECT_CLASS}
            >
              <option value="">Select Channel</option>
              {channels.map((ch: any) => (
                <option key={ch._id || ch.id} value={ch._id || ch.id}>
                  {ch.name} ({ch.country?.currency || "UGX"})
                </option>
              ))}
            </SelectWithIcon>
            {errors.station && <p className="text-xs text-destructive mt-1">{errors.station.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Challenge Title {REQUIRED_ASTERISK}</label>
            <Input {...register("title")} placeholder="e.g. Busoga One Quiz Challenge" />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Challenge Type {REQUIRED_ASTERISK}</label>
              <SelectWithIcon
                {...register("type")}
                className={SELECT_CLASS}
              >
                {CHALLENGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </SelectWithIcon>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Number of Winners {REQUIRED_ASTERISK}</label>
              <Input type="number" min={1} {...register("numberOfWinners", { valueAsNumber: true })} />
              {errors.numberOfWinners && <p className="text-xs text-destructive mt-1">{errors.numberOfWinners.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Description {REQUIRED_ASTERISK}</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full p-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              placeholder="Provide context or rules for participants..."
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>
        </Card>

        {/* Schedule — overflow-visible so TimePicker dropdown isn't clipped */}
        <Card className="p-6 space-y-4 overflow-visible">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Start Date {REQUIRED_ASTERISK}</label>
              <Input type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-xs text-destructive mt-1">{errors.startDate.message}</p>}
            </div>
            <TimePicker
              value={watch("startTime") || ""}
              onChange={(val) => setValue("startTime", val, { shouldValidate: true, shouldDirty: true })}
              label="Start Time"
              error={errors.startTime?.message}
            />
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">End Date {REQUIRED_ASTERISK}</label>
              <Input type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate.message}</p>}
            </div>
            <TimePicker
              value={watch("endTime") || ""}
              onChange={(val) => setValue("endTime", val, { shouldValidate: true, shouldDirty: true })}
              label="End Time"
              error={errors.endTime?.message}
            />
          </div>
        </Card>

        {/* Prize Selection */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">Prize & Rewards</h2>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Prize Type {REQUIRED_ASTERISK}</label>
            <SelectWithIcon
              {...register("prizeTypeKey")}
              className={SELECT_CLASS}
            >
              {prizeTypes.map((pt) => (
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
            {errors.prizeValue && <p className="text-xs text-destructive mt-1">{errors.prizeValue.message}</p>}
          </div>

          {(selectedPrizeType?.requiresSponsor || watchedPrizeKey === "external_gift") && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Sponsor Name (Optional)</label>
              <Input {...register("sponsorName")} placeholder="e.g. MTN Uganda" />
            </div>
          )}

          {(selectedPrizeType?.requiresInstructions || selectedPrizeType?.category === "physical") && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Collection Instructions</label>
              <textarea
                {...register("collectionInstructions")}
                rows={2}
                className="w-full p-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
                placeholder="e.g. Please visit Busoga One radio studio with valid ID to claim."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Billing Mode</label>
              <SelectWithIcon
                {...register("billingMode")}
                className={SELECT_CLASS}
              >
                <option value="free">Free Entry</option>
                <option value="credits">Paid (Requires User Credits)</option>
              </SelectWithIcon>
            </div>
            {watchedBillingMode === "credits" && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Entry Credit Cost</label>
                <Input type="number" min={1} {...register("creditCost", { valueAsNumber: true })} />
              </div>
            )}
          </div>
        </Card>

        {/* Questions Builder — dynamic 2-10 options */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Challenge Questions</h2>
              <p className="text-xs text-muted-foreground mt-1">
                All types support multiple questions. Listeners must answer every question to submit.
                Fastest Answer: time bonus only if the full set is correct.
              </p>
            </div>
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
              className="gap-1.5 text-xs text-[#02B2FF] border-[#02B2FF]/30 hover:bg-[#EFF8FF] shrink-0 ml-4"
            >
              <Plus size={14} /> Add Question
            </Button>
          </div>

          {questionFields.map((qField, qIndex) => (
            <QuestionCard
              key={qField.id}
              qIndex={qIndex}
              control={control}
              register={register}
              setValue={setValue}
              watch={watch}
              removeQuestion={removeQuestion}
              canRemove={questionFields.length > 1}
            />
          ))}
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/channels/challenges" className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors">
            Cancel
          </Link>
          <Button type="submit" disabled={isSubmitting} className="bg-[#02B2FF] hover:bg-[#00A0E8] text-white">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Create Challenge"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function QuestionCard({
  qIndex,
  control,
  register,
  setValue,
  watch,
  removeQuestion,
  canRemove,
}: {
  qIndex: number;
  control: any;
  register: any;
  setValue: any;
  watch: any;
  removeQuestion: (index: number) => void;
  canRemove: boolean;
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
        {canRemove && (
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
      />

      <div className="space-y-2 pt-2">
        {optionFields.map((optField, optIndex) => (
          <div key={optField.id} className="flex items-center gap-2">
            <input
              type="radio"
              name={`question-${qIndex}-correct`}
              checked={watchedOptions?.[optIndex]?.isCorrect === true}
              onChange={() => {
                optionFields.forEach((_, idx) => {
                  setValue(`questions.${qIndex}.options.${idx}.isCorrect` as const, idx === optIndex);
                });
              }}
              className="text-[#02B2FF] focus:ring-[#02B2FF]"
            />
            <Input
              {...register(`questions.${qIndex}.options.${optIndex}.label` as const)}
              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
            />
            {optionCount > 2 && (
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

      {optionCount < 10 && (
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
