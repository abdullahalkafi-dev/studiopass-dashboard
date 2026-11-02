"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetPayoutLimitsQuery, useUpdatePayoutLimitsMutation } from "@/features/payment/paymentApi";

const errorMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message || fallback;

const formatUgx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;

export function PayoutLimitsPanel() {
  const { data, isLoading, isError, refetch } = useGetPayoutLimitsQuery();
  const [updateLimits, { isLoading: isSaving }] = useUpdatePayoutLimitsMutation();

  // What the user has typed; until they type, the saved values are shown
  const [draft, setDraft] = useState<{ max?: string; daily?: string }>({});

  const saved = data?.data;
  const maxPerWinner = draft.max ?? (saved ? String(saved.maxPerWinnerUgx) : "");
  const dailyLimit = draft.daily ?? (saved ? String(saved.dailyLimitUgx) : "");
  const setMaxPerWinner = (v: string) => setDraft((d) => ({ ...d, max: v }));
  const setDailyLimit = (v: string) => setDraft((d) => ({ ...d, daily: v }));

  const max = Number(maxPerWinner);
  const daily = Number(dailyLimit);
  const maxOk = maxPerWinner !== "" && Number.isInteger(max) && max >= 1 && max <= 10_000_000;
  const dailyOk = dailyLimit !== "" && Number.isInteger(daily) && daily >= 0;
  const dailyAboveMax = !dailyOk || !maxOk || daily === 0 || daily >= max;
  const changed = !!saved && (max !== saved.maxPerWinnerUgx || daily !== saved.dailyLimitUgx);
  const canSave = maxOk && dailyOk && dailyAboveMax && changed && !isSaving;

  const handleSave = async () => {
    try {
      await updateLimits({ maxPerWinnerUgx: max, dailyLimitUgx: daily }).unwrap();
      setDraft({});
      toast.success("Payout limits saved");
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the limits. Please try again."));
    }
  };

  return (
    <Card className="p-5 bg-card border-border shadow-sm max-w-2xl">
      <h2 className="text-base font-bold text-foreground">Prize Payout Limits</h2>
      <p className="text-xs text-muted-foreground mt-1">
        Safety limits for challenge prizes that are paid out automatically (Airtel Money and airtime). They protect the
        payout wallet from a mistaken or oversized prize. Changes apply immediately.
      </p>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">
          <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#02B2FF]" /> Loading limits...
        </div>
      ) : isError ? (
        <div className="py-8 text-center text-xs text-destructive">
          Could not load the limits.{" "}
          <button onClick={() => refetch()} className="underline font-semibold">
            Try again
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="max-per-winner">Maximum prize per winner (UGX)</Label>
            <Input
              id="max-per-winner"
              type="number"
              min={1}
              step={1}
              value={maxPerWinner}
              onChange={(e) => setMaxPerWinner(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              A challenge with a mobile money or airtime prize above this amount cannot be created, and is never paid.
              {maxOk && <> Currently {formatUgx(max)}.</>}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="daily-limit">Maximum total paid out per day (UGX)</Label>
            <Input
              id="daily-limit"
              type="number"
              min={0}
              step={1}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Mobile money and airtime prizes count together, per day in Uganda time. Enter 0 for no limit. When the
              limit is reached, remaining prizes wait and are paid automatically once the day resets.
            </p>
            {dailyOk && maxOk && !dailyAboveMax && (
              <p className="text-[11px] text-destructive">
                The daily limit cannot be lower than the maximum per winner, or a single prize could never be paid.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!canSave} className="bg-[#02B2FF] hover:bg-[#0295e0] text-white">
              {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
              Save limits
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
