"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, MessageSquare, FileText, Clock, ArrowUpRight, Send } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { useAppSelector } from "@/store/hooks";
import { useGetMyShowsQuery } from "@/features/show/showApi";
import { useGetThreadsQuery, useSendReplyMutation } from "@/features/message/messageApi";
import { useGetStatementKPIsQuery } from "@/features/statement/statementApi";
import { toast } from "sonner";
import { formatTime24h } from "@/utils/time-utils";
import { formatTime12h } from "@/components/shared/time-picker";
import { useTimezone } from "@/hooks/use-timezone";

function PresenterDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-xl animate-pulse" />
    </div>
  );
}

export default function PresenterDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId || "";
  const timezone = useTimezone();
  const [now, setNow] = useState(new Date());
  const [replyText, setReplyText] = useState("");
  const [selectedThreadIdx, setSelectedThreadIdx] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: showsData, isLoading: showsLoading } = useGetMyShowsQuery(undefined);
  const { data: threadsData, isLoading: threadsLoading } = useGetThreadsQuery(
    { stationId, page: 1, limit: 20 },
    { skip: !stationId }
  );
  const { data: kpiData } = useGetStatementKPIsQuery({});
  const [sendReply, { isLoading: isSendingReply }] = useSendReplyMutation();

  const myShows = showsData?.data;
  const currentShow = myShows?.currentShow || null;
  const nextShow = myShows?.nextShow || null;
  const threads = threadsData?.data || [];
  const totalMessages = threads.reduce((sum: number, t: any) => sum + (t.count || 0), 0);
  const unrepliedCount = threads.reduce((sum: number, t: any) => sum + (t.unrepliedCount || 0), 0);
  const recentThreads = threads.slice(0, 5);
  const selectedThread = selectedThreadIdx !== null ? threads[selectedThreadIdx] : null;

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    try {
      await sendReply({
        msisdn: selectedThread.msisdn,
        content: replyText,
        stationId,
      }).unwrap();
      toast.success("Reply sent successfully");
      setReplyText("");
    } catch {
      toast.error("Failed to send reply");
    }
  };

  if (showsLoading || threadsLoading) return <PresenterDashboardSkeleton />;

  if (!myShows?.assigned) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.fullName || "Presenter"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Your presenter dashboard</p>
        </div>
        <div className="rounded-xl border bg-card p-16 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Radio size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Show Assigned</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            You are not currently assigned to any show. Contact your station admin to get assigned.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {currentShow ? currentShow.name : "My Shows"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentShow
            ? `${currentShow.station?.name || "Your station"} · ${formatTime12h(currentShow.startTime)} – ${formatTime12h(currentShow.endTime)}`
            : nextShow
              ? `Next show: ${nextShow.name} starts in ${nextShow.nextStartTime?.minutesUntil || 0} min`
              : "No shows scheduled right now"}
        </p>
      </div>

      {/* Show Status Hero */}
      {currentShow && (
        <div className="bg-gradient-to-r from-[#02B2FF] to-[#00A0E8] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wide opacity-90">ON AIR</span>
              </div>
              <p className="text-3xl font-bold mb-1">{currentShow.name}</p>
              <p className="text-sm opacity-80">{currentShow.station?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold font-['JetBrains_Mono',monospace]">
                {formatTime24h(now, timezone)}
              </p>
              {currentShow.timeRemainingMinutes > 0 && (
                <p className="text-sm opacity-80 mt-2">
                  {currentShow.timeRemainingMinutes >= 60
                    ? `${Math.floor(currentShow.timeRemainingMinutes / 60)}h ${currentShow.timeRemainingMinutes % 60}m remaining`
                    : `${currentShow.timeRemainingMinutes}m remaining`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!currentShow && nextShow && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-white/10 flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next Show</p>
              <p className="text-lg font-bold text-foreground">{nextShow.name}</p>
              <p className="text-sm text-muted-foreground">
                Starts at {formatTime12h(nextShow.startTime)} ({nextShow.nextStartTime?.minutesUntil || 0} min away)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Messages"
          value={String(totalMessages)}
          sub="Total messages received"
          icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF] dark:bg-white/10"
        />
        <KpiCard
          label="Unreplied"
          value={String(unrepliedCount)}
          sub="Awaiting your reply"
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50 dark:bg-white/10"
          trend={unrepliedCount > 0 ? { val: `${unrepliedCount} need attention`, up: false } : undefined}
        />
        <KpiCard
          label="Interactions"
          value={String(kpiData?.data?.totalInteractions ?? 0)}
          sub="Total listener interactions"
          icon={<ArrowUpRight size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50 dark:bg-white/10"
        />
        <KpiCard
          label="Revenue"
          value={kpiData?.data?.totalRevenue ? `${kpiData.data.totalRevenue.toLocaleString()}` : "0"}
          sub="From your shows"
          icon={<FileText size={16} className="text-violet-500" />}
          iconBg="bg-violet-50 dark:bg-white/10"
        />
      </div>

      {/* Recent Messages + Reply Panel */}
      <div className="grid grid-cols-12 gap-4 h-[500px]">
        {/* Left - Message List */}
        <div className="col-span-4 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold text-foreground">Recent Messages</p>
            <p className="text-[10px] text-muted-foreground">{threads.length} conversations from your shows</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentThreads.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              recentThreads.map((thread: any, idx: number) => (
                <button
                  key={thread.msisdn || idx}
                  onClick={() => setSelectedThreadIdx(idx)}
                  className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${
                    selectedThreadIdx === idx ? "bg-[#EFF8FF]/50 border-l-2 border-l-[#02B2FF]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{thread.msisdn || "Unknown"}</span>
                    <span className="text-[10px] text-muted-foreground font-['JetBrains_Mono',monospace]">
                      {thread.showName || ""}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${(thread.unrepliedCount || 0) > 0 ? "bg-[#02B2FF]" : "bg-emerald-400"}`} />
                    {thread.lastMessage || "No messages"}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right - Message Detail + Reply */}
        <div className="col-span-8 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {selectedThread ? (
            <>
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{selectedThread.msisdn}</p>
                    <p className="text-xs text-muted-foreground">{selectedThread.showName || "Show"} · {selectedThread.count || 0} messages</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    (selectedThread.unrepliedCount || 0) > 0 ? "bg-[#02B2FF]/10 text-[#02B2FF]" : "bg-emerald-100 text-emerald-600"
                  }`}>
                    {(selectedThread.unrepliedCount || 0) > 0 ? "Needs Reply" : "Replied"}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Last Message</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedThread.lastMessage || "No message content"}</p>
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                    placeholder="Type your reply (use a template)..."
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSendingReply}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} /> {isSendingReply ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select a message to view details and reply</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/presenter" className="bg-card rounded-xl border border-border shadow-sm p-4 hover:border-[#02B2FF]/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] dark:bg-white/10 flex items-center justify-center group-hover:bg-[#02B2FF]/10 transition-colors">
              <Radio size={18} className="text-[#02B2FF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">My Shows</p>
              <p className="text-[10px] text-muted-foreground">View all assigned shows</p>
            </div>
          </div>
        </Link>
        <Link href="/presenter/messages" className="bg-card rounded-xl border border-border shadow-sm p-4 hover:border-[#02B2FF]/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] dark:bg-white/10 flex items-center justify-center group-hover:bg-[#02B2FF]/10 transition-colors">
              <MessageSquare size={18} className="text-[#02B2FF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">All Messages</p>
              <p className="text-[10px] text-muted-foreground">View all conversations</p>
            </div>
          </div>
        </Link>
        <Link href="/presenter/listener-statements" className="bg-card rounded-xl border border-border shadow-sm p-4 hover:border-[#02B2FF]/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] dark:bg-white/10 flex items-center justify-center group-hover:bg-[#02B2FF]/10 transition-colors">
              <FileText size={18} className="text-[#02B2FF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Statements</p>
              <p className="text-[10px] text-muted-foreground">View listener statements</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
