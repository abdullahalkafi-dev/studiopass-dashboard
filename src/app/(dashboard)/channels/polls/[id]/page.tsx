"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, BarChart3, Users, CheckCircle2, User,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetChannelPollByIdQuery, useGetChannelPollResultsQuery } from "@/features/channelPoll/channelPollApi";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { resolveUrl } from "@/lib/utils";

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const timezone = useTimezone();
  const pollId = params.id as string;

  const { data: pollData, isLoading: pollLoading } = useGetChannelPollByIdQuery(pollId);
  const { data: resultsData, isLoading: resultsLoading } = useGetChannelPollResultsQuery(pollId);

  const poll = pollData?.data;
  const results = resultsData?.data?.results || [];

  const isLoading = pollLoading || resultsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-[#02B2FF]" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Poll not found.</p>
        <Link href="/channels/polls" className="text-sm text-[#02B2FF] hover:underline mt-2 inline-block">
          Back to Polls
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/channels/polls"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft size={16} className="text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{poll.title}</h1>
              <StatusBadge
                label={poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                variant={sv(poll.status === "active" ? "Active" : "Inactive")}
              />
            </div>
            {poll.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{poll.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Votes"
          value={String(poll.totalVotes || 0)}
          icon={<BarChart3 size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Categories"
          value={String(poll.categories?.length || 0)}
          icon={<Users size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Billing"
          value={poll.billingMode === "credits" ? `${poll.creditCost} credits` : "Free"}
          icon={<CheckCircle2 size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
        <KpiCard
          label="End Date"
          value={formatDate(poll.endDate, timezone, "MMM d")}
          icon={<BarChart3 size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Results by Category */}
      {results.map((category: any, catIdx: number) => (
        <div key={catIdx} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{category.name}</h3>
            <span className="text-xs text-muted-foreground">{category.totalVotes} votes</span>
          </div>

          <div className="space-y-3">
            {category.nominees?.map((nominee: any, nomIdx: number) => (
              <div key={nomIdx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {nominee.photo ? (
                      <img
                        src={resolveUrl(nominee.photo)}
                        alt={nominee.name}
                        className="w-7 h-7 rounded-lg object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-border">
                        <User size={14} />
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-foreground block">{nominee.name}</span>
                      {nominee.description && (
                        <span className="text-[11px] text-muted-foreground block">{nominee.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{nominee.voteCount} votes</span>
                    <span className="text-xs font-bold text-[#02B2FF]">{nominee.percentage}%</span>
                  </div>
                </div>
                {/* WhatsApp-style progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-[#02B2FF] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${nominee.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
