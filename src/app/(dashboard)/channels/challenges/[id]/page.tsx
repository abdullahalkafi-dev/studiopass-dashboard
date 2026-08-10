"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, Trophy, Users, CheckCircle2,
  BarChart3, Gift, Phone, Building2, Globe2, AlertTriangle,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import {
  useGetChallengeByIdQuery,
  useGetAdminLeaderboardQuery,
  useCancelChallengeMutation,
} from "@/features/challenge/challengeApi";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { useRole } from "@/contexts/role-context";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  quiz: "Quiz Challenge",
  fastest_answer: "Fastest Correct Answer",
  question_of_day: "Question of the Day",
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const timezone = useTimezone();
  const role = useRole();
  const isSuperOrPartner = role === "super_admin" || role === "partner_admin";
  const challengeId = params.id as string;

  const { data, isLoading, error } = useGetChallengeByIdQuery(challengeId);
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useGetAdminLeaderboardQuery({ id: challengeId });
  const [cancelChallenge, { isLoading: isCancelling }] = useCancelChallengeMutation();

  const challenge = data?.data;
  const leaderboard = leaderboardData?.data?.leaderboard || [];

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this challenge? Participant credits will be refunded.")) return;
    try {
      await cancelChallenge(challengeId).unwrap();
      toast.success("Challenge cancelled and entry credits refunded.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cancel challenge");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-[#02B2FF]" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Challenge not found.</p>
        <Link href="/channels/challenges" className="text-sm text-[#02B2FF] hover:underline mt-2 inline-block">
          Back to Challenges
        </Link>
      </div>
    );
  }

  const stationName = challenge.station?.name || "Channel";
  const countryCurrency = challenge.currency || challenge.station?.country?.currency || "UGX";
  const prizeDisplay = challenge.prizeLabel
    ? `${challenge.prizeLabel} (${countryCurrency} ${challenge.prizeValue || ""})`
    : challenge.rewardText || "Standard Reward";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/channels/challenges"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft size={16} className="text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{challenge.title}</h1>
              <StatusBadge
                label={challenge.status ? challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1) : "Draft"}
                variant={sv(challenge.status === "active" ? "Active" : challenge.status === "completed" ? "Inactive" : "Draft")}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>{TYPE_LABELS[challenge.type] || challenge.type}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Building2 size={13} className="text-[#02B2FF]" /> {stationName} ({countryCurrency})
              </span>
            </p>
          </div>
        </div>

        {isSuperOrPartner && challenge.status !== "completed" && challenge.status !== "cancelled" && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-3.5 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            Cancel Challenge
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Participants"
          value={String(challenge.totalParticipants || 0)}
          icon={<Users size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Prize Value"
          value={prizeDisplay}
          icon={<Gift size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Winners Target"
          value={`${challenge.numberOfWinners || 1} Winner(s)`}
          icon={<Trophy size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Billing Mode"
          value={challenge.billingMode === "credits" ? `${challenge.creditCost} Credits` : "Free Entry"}
          icon={<BarChart3 size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* Details Card */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground border-b border-border pb-2.5">Challenge Overview</h2>
        <p className="text-sm text-foreground leading-relaxed">{challenge.description}</p>
        
        {challenge.sponsorName && (
          <p className="text-xs text-muted-foreground">
            <strong>Sponsor:</strong> {challenge.sponsorName}
          </p>
        )}
        {challenge.collectionInstructions && (
          <p className="text-xs text-muted-foreground">
            <strong>Fulfillment Instructions:</strong> {challenge.collectionInstructions}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2">
          <div>
            <strong>Starts:</strong> {formatDate(challenge.startDate, timezone, "PPP")} at {challenge.startTime}
          </div>
          <div>
            <strong>Ends:</strong> {formatDate(challenge.endDate, timezone, "PPP")} at {challenge.endTime}
          </div>
        </div>
      </div>

      {/* Admin Leaderboard & Winners Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" /> Participant Results & Winners Leaderboard
          </h2>
          <span className="text-xs text-muted-foreground">{leaderboard.length} Ranked Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Rank</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Participant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Phone / MSISDN</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Score</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Time (s)</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Reward Status</th>
              </tr>
            </thead>
            <tbody>
              {isLeaderboardLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#02B2FF]" /> Loading leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-muted-foreground">
                    No participations recorded for this challenge yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row: any, idx: number) => {
                  const rank = idx + 1;
                  const isWinner = rank <= (challenge.numberOfWinners || 1);
                  const userObj = row.user || {};

                  return (
                    <tr key={row._id || idx} className={`border-b border-border last:border-0 ${isWinner ? "bg-amber-500/5 font-medium" : ""}`}>
                      <td className="px-5 py-3 font-bold text-xs">
                        {isWinner ? <span className="text-amber-500">🏆 #{rank}</span> : `#${rank}`}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-foreground">
                        {userObj.fullName || "User"}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <Phone size={12} className="text-muted-foreground" /> {userObj.phone || userObj.msisdn || "N/A"}
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-bold text-[#02B2FF]">
                        {row.score} pts
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-mono">
                        {row.timeTaken}s
                      </td>
                      <td className="px-5 py-3 text-center">
                        {isWinner ? (
                          <StatusBadge label="Winner (Processed)" variant="success" />
                        ) : (
                          <StatusBadge label="Participant" variant="neutral" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
