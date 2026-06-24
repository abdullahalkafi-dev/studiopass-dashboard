"use client";

import { useState } from "react";
import { Search, X, Send } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { FilterSelect } from "@/components/shared/filter-select";
import { useAppSelector } from "@/store/hooks";
import {
  useGetThreadsQuery,
  useSendReplyMutation,
} from "@/features/message/messageApi";
import { toast } from "sonner";

interface Message {
  id: string;
  listenerName: string;
  phone: string;
  station: string;
  show: string;
  type: string;
  receivedTime: string;
  status: "New" | "Replied";
  content: string;
}

const TEMPLATES = [
  "Thank you for your message!",
  "We appreciate your support!",
  "Great suggestion! We'll look into it.",
  "Stay tuned for more exciting content!",
];

export default function PresenterMessagesContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewing, setViewing] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const stationId = useAppSelector(
    (state) => state.auth.user?.stationId ?? ""
  );

  const {
    data: threadsData,
    isLoading,
    isError,
  } = useGetThreadsQuery(
    { stationId },
    { skip: !stationId }
  );

  const [sendReply, { isLoading: isSending }] = useSendReplyMutation();

  const threads = threadsData?.data ?? [];

  const filtered: Message[] = threads
    .map(
      (t: any): Message => ({
        id: t.msisdn || t._id,
        listenerName: t.msisdn || "Listener",
        phone: t.msisdn,
        station: t.stationName ?? "",
        show: t.showName ?? "",
        type: "Radio",
        receivedTime: t.lastMessageTime
          ? new Date(t.lastMessageTime).toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "",
        status: t.unrepliedCount > 0 ? "New" : "Replied",
        content: t.lastMessage ?? "",
      })
    )
    .filter((m: Message) => {
      const q = search.toLowerCase();
      if (
        q &&
        !m.listenerName.toLowerCase().includes(q) &&
        !m.station.toLowerCase().includes(q)
      )
        return false;
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    if (value) setReplyText(value);
  };

  const handleSendReply = async () => {
    if (!viewing || !replyText.trim()) return;
    try {
      await sendReply({
        stationId,
        msisdn: viewing.phone,
        content: replyText.trim(),
      }).unwrap();
      toast.success("Reply sent successfully");
      setReplyText("");
      setSelectedTemplate("");
      setViewing(null);
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View incoming listener messages for your assigned show.
        </p>
      </div>

      <hr className="border-border" />

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search listener or station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "New", label: "New" },
            { value: "Replied", label: "Replied" },
          ]}
          placeholder="All Status"
          className="w-40"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Listener Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Received Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5"><div className="h-4 w-28 rounded bg-muted animate-pulse" /></td>
                    <td className="px-5 py-3.5"><div className="h-4 w-14 rounded-full bg-muted animate-pulse" /></td>
                    <td className="px-5 py-3.5"><div className="h-4 w-32 rounded bg-muted animate-pulse" /></td>
                    <td className="px-5 py-3.5"><div className="h-5 w-16 rounded-full bg-muted animate-pulse" /></td>
                    <td className="px-5 py-3.5 text-center"><div className="h-7 w-16 rounded-lg bg-muted animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    Failed to load messages. Please try again later.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No messages found.</td>
                </tr>
              ) : (
                filtered.map((msg) => (
                  <tr key={msg.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-foreground">{msg.listenerName}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-[#EFF8FF] px-2.5 py-0.5 text-xs font-semibold text-[#02B2FF]">{msg.type}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{msg.receivedTime}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={msg.status} variant={sv(msg.status === "New" ? "Pending" : "Active")} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => { setViewing(msg); setReplyText(""); setSelectedTemplate(""); }}
                        className="inline-flex items-center rounded-lg border border-[#02B2FF] px-4 py-1.5 text-xs font-semibold text-[#02B2FF] hover:bg-[#EFF8FF] transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel (slide-out) */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Message Details</h2>
              <button onClick={() => setViewing(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Info grid */}
              <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Listener Name</span>
                  <span className="text-xs font-semibold text-foreground">{viewing.listenerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Phone Number</span>
                  <span className="text-xs font-semibold text-foreground">{viewing.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Station</span>
                  <span className="text-xs font-semibold text-foreground">{viewing.station}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Show Name</span>
                  <span className="text-xs font-semibold text-foreground">{viewing.show}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Received Time</span>
                  <span className="text-xs font-semibold text-foreground font-['JetBrains_Mono',monospace]">{viewing.receivedTime}</span>
                </div>
              </div>

              {/* Text Message */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">Text Message</label>
                <div className="rounded-lg border bg-muted/20 p-4 text-sm text-foreground">{viewing.content}</div>
              </div>

              {/* Reply Template */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">Reply Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Template</option>
                  {TEMPLATES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Send Reply */}
            <div className="px-6 py-4 border-t border-border">
              <button
                onClick={handleSendReply}
                disabled={isSending || !replyText.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#02B2FF] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#029de0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send size={16} />
                )}
                {isSending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
