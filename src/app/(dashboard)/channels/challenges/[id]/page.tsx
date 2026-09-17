"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, Trophy, Users,
  BarChart3, Gift, Phone, Building2, AlertTriangle,
  ListChecks, Eye, Database,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import {
  useGetChallengeByIdQuery,
  useGetAdminLeaderboardQuery,
  useCancelChallengeMutation,
} from "@/features/challenge/challengeApi";
import { formatDate, formatTime12hRaw } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { useRole } from "@/contexts/role-context";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  quiz: "Quiz Challenge",
  fastest_answer: "Fastest Correct Answer",
  question_of_day: "Question of the Day",
};

type ChallengeQuestion = {
  text: string;
  timeLimit?: number;
  options: { label: string; isCorrect?: boolean }[];
};

type LeaderboardRow = {
  _id?: string;
  score?: number;
  timeTaken?: number;
  submittedAt?: string;
  answers?: {
    questionIndex: number;
    selectedOption: number;
    isCorrect?: boolean;
  }[];
  user?: {
    _id?: string;
    fullName?: string;
    phone?: string;
    msisdn?: string;
  };
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const timezone = useTimezone();
  const role = useRole();
  const isSuperOrPartner = role === "super_admin" || role === "partner_admin";
  const challengeId = params.id as string;

  const { data, isLoading, error } = useGetChallengeByIdQuery(challengeId);
  const { data: leaderboardData, isLoading: isLeaderboardLoading } =
    useGetAdminLeaderboardQuery({ id: challengeId, limit: 50 });
  const [cancelChallenge, { isLoading: isCancelling }] = useCancelChallengeMutation();
  const [answersRow, setAnswersRow] = useState<LeaderboardRow | null>(null);

  const challenge = data?.data;
  const leaderboard: LeaderboardRow[] = leaderboardData?.data?.leaderboard || [];
  const questions: ChallengeQuestion[] = challenge?.questions || [];

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
                variant={sv(challenge.status === "active" ? "Active" : challenge.status === "completed" ? "Completed" : challenge.status === "cancelled" ? "Failed" : "Draft")}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        {challenge.instructions ? (
          <p className="text-xs text-muted-foreground">
            <strong>Listener instructions:</strong> {challenge.instructions}
          </p>
        ) : null}
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
            <strong>Starts:</strong> {formatDate(challenge.startDate, timezone, "PPP")} at {formatTime12hRaw(challenge.startTime)}
          </div>
          <div>
            <strong>Ends:</strong> {formatDate(challenge.endDate, timezone, "PPP")} at {formatTime12hRaw(challenge.endTime)}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ListChecks size={16} className="text-[#02B2FF]" /> Questions
          </h2>
          <span className="text-xs text-muted-foreground">
            {questions.length} question{questions.length === 1 ? "" : "s"} · Max base score {questions.length}
            {" · Listeners must answer all to submit"}
          </span>
        </div>
        {questions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No questions on this challenge.</p>
        ) : (
          <ol className="space-y-4">
            {questions.map((q, idx) => (
              <li key={idx} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    Q{idx + 1}. {q.text}
                  </p>
                  {typeof q.timeLimit === "number" ? (
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0 mt-0.5">
                      {q.timeLimit}s
                    </span>
                  ) : null}
                </div>
                <ul className="space-y-1.5">
                  {(q.options || []).map((opt, oIdx) => (
                    <li
                      key={oIdx}
                      className={`text-xs px-2.5 py-1.5 rounded-md border ${
                        opt.isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 font-semibold"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}. {opt.label}
                      {opt.isCorrect ? " · Correct" : ""}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Admin Leaderboard */}
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
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLeaderboardLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#02B2FF]" /> Loading leaderboard...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">
                    No participations recorded for this challenge yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row, idx) => {
                  const rank = idx + 1;
                  const isWinner = rank <= (challenge.numberOfWinners || 1);
                  const userObj = row.user || {};
                  const crmUserId = userObj._id || "";
                  const maxScore = questions.length;

                  return (
                    <tr
                      key={row._id || idx}
                      className={`border-b border-border last:border-0 ${isWinner ? "bg-amber-500/5 font-medium" : ""}`}
                    >
                      <td className="px-5 py-3 font-bold text-xs">
                        {isWinner ? <span className="text-amber-500">🏆 #{rank}</span> : `#${rank}`}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-foreground">
                        {userObj.fullName || "User"}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Phone size={12} className="text-muted-foreground" />{" "}
                          {userObj.phone || userObj.msisdn || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-bold text-[#02B2FF]">
                        {row.score ?? 0}
                        {maxScore > 0 ? ` / ${maxScore}` : ""} pts
                      </td>
                      <td className="px-5 py-3 text-center text-xs font-mono">
                        {row.timeTaken ?? 0}s
                      </td>
                      <td className="px-5 py-3 text-center">
                        {isWinner ? (
                          <StatusBadge label="Winner (Processed)" variant="success" />
                        ) : (
                          <StatusBadge label="Participant" variant="neutral" />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAnswersRow(row)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-[#02B2FF] hover:bg-[#EFF8FF] border border-[#02B2FF]/20"
                            title="View submitted answers"
                          >
                            <Eye size={12} /> Answers
                          </button>
                          {isSuperOrPartner && crmUserId ? (
                            <Link
                              href={`/crm/${crmUserId}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-[#02B2FF] hover:bg-[#EFF8FF] border border-border"
                              title="Open listener CRM profile"
                            >
                              <Database size={12} /> CRM
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answers modal */}
      {answersRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAnswersRow(null)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Submitted answers</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {answersRow.user?.fullName || "User"} · Score {answersRow.score ?? 0}
                  {questions.length ? ` / ${questions.length}` : ""} · {answersRow.timeTaken ?? 0}s
                </p>
                {answersRow.submittedAt ? (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Submitted {formatDate(answersRow.submittedAt, timezone, "PPP p")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setAnswersRow(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            {questions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No questions available on this challenge.</p>
            ) : (
              <ol className="space-y-3">
                {questions.map((q, qIdx) => {
                  const answer = (answersRow.answers || []).find(
                    (a) => a.questionIndex === qIdx,
                  );
                  const selectedLabel =
                    answer != null && q.options?.[answer.selectedOption]
                      ? q.options[answer.selectedOption].label
                      : "Not answered";
                  const correctIdx = (q.options || []).findIndex((o) => o.isCorrect);
                  const correctLabel =
                    correctIdx >= 0 ? q.options[correctIdx].label : "—";
                  const isCorrect = answer?.isCorrect === true;

                  return (
                    <li key={qIdx} className="rounded-lg border border-border p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-foreground">
                        Q{qIdx + 1}. {q.text}
                      </p>
                      <p className={`text-xs ${isCorrect ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}`}>
                        {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Selected:</strong> {selectedLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Correct:</strong> {correctLabel}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}

            {isSuperOrPartner && answersRow.user?._id ? (
              <div className="pt-1">
                <Link
                  href={`/crm/${answersRow.user._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#02B2FF] hover:underline"
                >
                  <Database size={13} /> Open CRM profile
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
