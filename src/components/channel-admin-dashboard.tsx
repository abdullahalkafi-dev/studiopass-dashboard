import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare, BarChart3, Trophy, Megaphone,
  Users, CreditCard, Plus, ArrowUpRight, Send, CheckCircle2,
  FileText, Activity, User
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionHeader } from "@/components/shared/section-header";
import { useAppSelector } from "@/store/hooks";
import { useGetMyProfileQuery } from "@/features/user/userApi";
import { useGetThreadsQuery, useGetThreadQuery, useSendReplyMutation } from "@/features/message/messageApi";
import { useGetDashboardStatsQuery, useGetMessageActivityQuery } from "@/features/dashboard/dashboardApi";
import { resolveUrl } from "@/lib/utils";
import { formatTime12h } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

import { useGetChannelPollsQuery } from "@/features/channelPoll/channelPollApi";
import { useChannelType } from "@/hooks/use-channel-type";

export default function ChannelAdminDashboard() {
  const { channelType, stationId, liveUser } = useChannelType();
  const timezone = useTimezone();

  const { data: statsData } = useGetDashboardStatsQuery(undefined);
  const { data: messageActivity } = useGetMessageActivityQuery({ period: "monthly" });
  const { data: channelPollsData } = useGetChannelPollsQuery(
    { station: stationId },
    { skip: !stationId || channelType !== "polls" }
  );
  const channelPolls = channelPollsData?.data || [];

  const { data: threadsData } = useGetThreadsQuery(
    { page: 1, limit: 20 },
    { skip: !stationId || channelType !== "message_chat" }
  );

  const [selectedMsg, setSelectedMsg] = useState<number>(0);
  const [replyText, setReplyText] = useState("");
  const [sendReply, { isLoading: isSending }] = useSendReplyMutation();

  const threads = threadsData?.data || [];
  const selectedThread = threads[selectedMsg] || (threads.length > 0 ? threads[0] : null);

  const { data: threadData, isLoading: threadLoading } = useGetThreadQuery(
    { stationId, msisdn: selectedThread?.msisdn || "" },
    { skip: !stationId || !selectedThread?.msisdn }
  );

  const rawMessages = threadData?.data?.messages || threadData?.data || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rawMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    try {
      await sendReply({
        stationId,
        msisdn: selectedThread.msisdn,
        content: replyText.trim(),
      }).unwrap();
      setReplyText("");
      toast.success("Reply sent!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send reply");
    }
  };

  const chartData = (messageActivity?.data ?? []).map((d: any) => ({
    name: d.date,
    messages: d.count,
  }));

  // Define Quick Actions based on channelType
  const getQuickActions = () => {
    if (channelType === "polls") {
      return [
        { label: "Create Poll", href: "/channels/polls/create", icon: <BarChart3 size={20} />, color: "text-[#02B2FF]", bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10 dark:bg-[#02B2FF]/10 dark:hover:bg-[#02B2FF]/20" },
        { label: "Status Posts", href: "/campaigns/status-posts", icon: <Megaphone size={20} />, color: "text-amber-500", bg: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50" },
        { label: "View Reports", href: "/reports", icon: <FileText size={20} />, color: "text-rose-500", bg: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50" },
      ];
    }
    if (channelType === "challenges") {
      return [
        { label: "Create Challenge", href: "/channels/challenges/create", icon: <Trophy size={20} />, color: "text-violet-500", bg: "bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/50" },
        { label: "Status Posts", href: "/campaigns/status-posts", icon: <Megaphone size={20} />, color: "text-amber-500", bg: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50" },
        { label: "View Reports", href: "/reports", icon: <FileText size={20} />, color: "text-rose-500", bg: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50" },
      ];
    }
    // Default & message_chat
    return [
      { label: "View Messages", href: "/messages", icon: <MessageSquare size={20} />, color: "text-[#02B2FF]", bg: "bg-[#EFF8FF] hover:bg-[#02B2FF]/10 dark:bg-[#02B2FF]/10 dark:hover:bg-[#02B2FF]/20" },
      { label: "Status Posts", href: "/campaigns/status-posts", icon: <Megaphone size={20} />, color: "text-amber-500", bg: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50" },
      { label: "View Reports", href: "/reports", icon: <FileText size={20} />, color: "text-rose-500", bg: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50" },
    ];
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-7">
      {/* Executive Overview */}
      <section>
        <SectionHeader
          title="Channel Overview"
          sub={`Channel performance & metrics (${channelType === "polls" ? "Polls / Voting" : channelType === "challenges" ? "Challenges" : "Message / Chat"})`}
        />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Users"
            value={statsData?.data?.totalUsers ?? "0"}
            sub="Subscribers / Listeners"
            icon={<Users size={16} className="text-[#02B2FF]" />}
            iconBg="bg-[#EFF8FF]"
          />
          {channelType === "message_chat" && (
            <>
              <KpiCard
                label="Total Messages"
                value={statsData?.data?.totalMessages ?? "0"}
                sub="Received at channel"
                icon={<MessageSquare size={16} className="text-amber-500" />}
                iconBg="bg-amber-50"
              />
              <KpiCard
                label="Unreplied Threads"
                value={String(threads.filter((t: any) => (t.unrepliedCount || 0) > 0).length)}
                sub="Pending response"
                icon={<Activity size={16} className="text-rose-500" />}
                iconBg="bg-rose-50"
              />
            </>
          )}
          {channelType === "polls" && (
            <>
              <KpiCard
                label="Active Polls"
                value={String(channelPolls.filter((p: any) => p.status === "active").length)}
                sub="Ongoing channel polls"
                icon={<BarChart3 size={16} className="text-emerald-500" />}
                iconBg="bg-emerald-50"
              />
              <KpiCard
                label="Total Votes"
                value={String(channelPolls.reduce((acc: number, p: any) => acc + (p.totalVotes || 0), 0))}
                sub="All time channel votes"
                icon={<Activity size={16} className="text-indigo-500" />}
                iconBg="bg-indigo-50"
              />
            </>
          )}
          {channelType === "challenges" && (
            <KpiCard
              label="Active Challenges"
              value="1"
              sub="Channel challenges"
              icon={<Trophy size={16} className="text-violet-500" />}
              iconBg="bg-violet-50"
            />
          )}
          <KpiCard
            label="Revenue"
            value={statsData?.data?.totalRevenue ? `${statsData.data.totalRevenue.toLocaleString()}` : "0"}
            sub="Channel revenue"
            icon={<CreditCard size={16} className="text-teal-500" />}
            iconBg="bg-teal-50"
          />
        </div>
      </section>

      {/* Quick Management */}
      <section>
        <SectionHeader title="Quick Management" sub="Click a card to navigate to your channel workflows" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className={`${action.bg} rounded-xl py-6 px-4 flex flex-col items-center gap-3 border border-border hover:border-transparent hover:shadow-md transition-all group cursor-pointer`}>
                <div className={`${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</div>
                <span className="text-xs font-semibold text-foreground text-center leading-tight">{action.label}</span>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      {channelType === "polls" ? (
        <div className="space-y-6">
          {/* Channel Polls List Widget */}
          <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-5">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Active Channel Polls</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Overview of active voting events and participation counts</p>
              </div>
              <Link href="/channels/polls/create" className="px-3 py-1.5 bg-[#02B2FF] hover:bg-[#00A0E8] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                <Plus size={13} /> Create Poll
              </Link>
            </div>

            {channelPolls.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl">
                <BarChart3 size={32} className="mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-xs font-semibold text-foreground">No channel polls created yet</p>
                <p className="text-[11px] text-muted-foreground mt-1 mb-4">Create your first poll to start engaging your audience.</p>
                <Link href="/channels/polls/create" className="px-4 py-2 bg-[#02B2FF] text-white text-xs font-semibold rounded-lg hover:bg-[#00A0E8]">
                  Create Poll
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {channelPolls.map((poll: any) => {
                  const categoryCount = poll.categories?.length || 0;
                  const totalNominees = (poll.categories || []).reduce((acc: number, c: any) => acc + (c.nominees?.length || 0), 0);
                  const isPaid = poll.billingMode === "credits";

                  return (
                    <div key={poll._id || poll.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors rounded-lg px-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{poll.title}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${poll.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                            {poll.status}
                          </span>
                          {isPaid && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-500">
                              Paid ({poll.creditCost} Credits)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {categoryCount} Categories · {totalNominees} Total Nominees · {poll.totalVotes || 0} Total Votes
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link href={`/channels/polls/${poll._id || poll.id}`} className="text-xs font-semibold text-[#02B2FF] hover:underline flex items-center gap-1">
                          View Results <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Vote Activity Chart */}
          <section className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <SectionHeader title="Vote Volume & Poll Activity" sub="Daily voter engagement over time" />
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Area type="monotone" dataKey="messages" stroke="#10B981" fillOpacity={1} fill="url(#pollGrad)" strokeWidth={2} name="Votes" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ) : channelType === "message_chat" ? (
        <section className="grid grid-cols-12 gap-4 h-[440px]">
          {/* Threads List */}
          <div className="col-span-5 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Incoming Messages</span>
              <span className="text-[10px] text-muted-foreground">{threads.length} threads</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {threads.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No threads found</div>
              ) : (
                threads.map((thread: any, i: number) => {
                  const listenerName = thread.listenerName || thread.user?.name || thread.msisdn;
                  const avatar = thread.listenerAvatar || thread.user?.avatar;
                  return (
                    <button
                      key={thread.msisdn || i}
                      onClick={() => setSelectedMsg(i)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors ${
                        selectedMsg === i ? "bg-[#EFF8FF]/50 dark:bg-[#02B2FF]/15 border-l-2 border-l-[#02B2FF]" : ""
                      }`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        {avatar ? (
                          <img
                            src={resolveUrl(avatar)}
                            alt={listenerName}
                            className="w-8 h-8 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center font-bold text-xs border border-[#02B2FF]/20">
                            {listenerName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold text-foreground truncate">{listenerName}</span>
                          {thread.lastMessageAt && (
                            <span className="text-[9px] text-muted-foreground shrink-0 ml-1">
                              {formatTime12h(thread.lastMessageAt, timezone)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{thread.msisdn}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${(thread.unrepliedCount || 0) > 0 ? "bg-[#02B2FF]" : "bg-emerald-400"}`} />
                          {thread.lastMessage || (thread.lastImageUrl ? "📷 Photo" : "No messages yet")}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window / Reply */}
          <div className="col-span-7 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
            {selectedThread ? (
              <>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    {selectedThread.listenerAvatar || selectedThread.user?.avatar ? (
                      <img
                        src={resolveUrl(selectedThread.listenerAvatar || selectedThread.user.avatar)}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center font-bold text-xs border border-[#02B2FF]/20 shrink-0">
                        {(selectedThread.listenerName || selectedThread.user?.name || selectedThread.msisdn).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        {selectedThread.listenerName || selectedThread.user?.name || selectedThread.msisdn}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{selectedThread.msisdn}</p>
                    </div>
                  </div>
                  <Link href="/messages" className="text-xs text-[#02B2FF] hover:underline flex items-center gap-1 font-medium">
                    Full Chat <ArrowUpRight size={12} />
                  </Link>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/5">
                  {threadLoading ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">Loading chat history...</div>
                  ) : rawMessages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">No messages in this conversation</div>
                  ) : (
                    rawMessages.map((msg: any, idx: number) => {
                      const isStation = msg.senderType === "station";
                      const subscriberAvatar = msg.userAvatar || msg.senderAvatar || selectedThread.listenerAvatar || selectedThread.user?.avatar;
                      return (
                        <div
                          key={msg._id || msg.id || idx}
                          className={`flex items-end gap-2 ${isStation ? "justify-end" : "justify-start"}`}
                        >
                          {!isStation && (
                            subscriberAvatar ? (
                              <img
                                src={resolveUrl(subscriberAvatar)}
                                alt="Subscriber"
                                className="w-5 h-5 rounded-full object-cover border border-border shrink-0 mb-1"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center text-[9px] font-bold shrink-0 mb-1">
                                {(msg.senderName || selectedThread.listenerName || "U")[0].toUpperCase()}
                              </div>
                            )
                          )}
                          <div
                            className={`max-w-[75%] rounded-2xl p-2.5 text-xs shadow-sm ${
                              isStation
                                ? "bg-[#02B2FF] text-white rounded-br-none"
                                : "bg-card border border-border text-foreground rounded-bl-none"
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            {msg.imageUrl && (
                              <img
                                src={resolveUrl(msg.imageUrl)}
                                alt="Attachment"
                                className="mt-2 max-h-36 rounded-lg object-cover border border-white/20"
                              />
                            )}
                            <div
                              className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                                isStation ? "text-white/80" : "text-muted-foreground"
                              }`}
                            >
                              <span>{msg.createdAt ? formatTime12h(msg.createdAt, timezone) : ""}</span>
                              {isStation && <CheckCircle2 size={10} className="inline opacity-80" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-border bg-card flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a reply to the user..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSending || !replyText.trim()}
                    className="px-3 py-2 rounded-lg bg-[#02B2FF] text-white text-xs font-semibold hover:bg-[#02B2FF]/90 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send size={12} /> Reply
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare size={32} className="text-muted-foreground mb-2" />
                <p className="text-xs font-semibold text-foreground">Select a message thread</p>
                <p className="text-[11px] text-muted-foreground mt-1">Choose a conversation from the left to view and reply.</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* Message Activity Chart */
        <section className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <SectionHeader title="Message Activity" sub="Daily message volume over time" />
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#02B2FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#02B2FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Area type="monotone" dataKey="messages" stroke="#02B2FF" fillOpacity={1} fill="url(#msgGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
