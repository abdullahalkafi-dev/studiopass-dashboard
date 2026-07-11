"use client";

import Link from "next/link";
import { ArrowLeft, MessageSquare, Search } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useGetMessageByIdQuery } from "@/features/message/messageApi";

export default function MessageDetailContent({ id }: { id: string }) {
  const { data: messageData, isLoading, error } = useGetMessageByIdQuery(id);
  const msg = messageData?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/messages" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Messages
        </Link>
        <div className="text-center py-12">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center animate-pulse mx-auto mb-3">
            <Search size={18} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Loading message…</p>
        </div>
      </div>
    );
  }

  if (error || !msg) {
    return (
      <div className="space-y-6">
        <Link href="/messages" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Messages
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Message not found.</p>
        </div>
      </div>
    );
  }

  const statusLabel = msg.status === "delivered" ? "Delivered"
    : msg.status === "pending" ? "Pending"
    : msg.status === "approved" ? "Approved"
    : msg.status === "rejected" ? "Rejected"
    : msg.status === "sent_to_output" ? "Sent to Output"
    : msg.status;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/messages" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Messages
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Message Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          From {msg.msisdn || "Unknown"} · {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "—"}
        </p>
      </div>

      {/* Hero Card */}
      <div className={`rounded-xl border shadow-sm p-5 ${
        msg.status === "delivered" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" :
        msg.status === "pending" ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" :
        msg.status === "approved" ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" :
        msg.status === "rejected" ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" :
        "bg-muted border-border"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              msg.status === "delivered" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" :
              msg.status === "pending" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" :
              msg.status === "approved" ? "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" :
              msg.status === "rejected" ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400" :
              "bg-muted text-muted-foreground"
            }`}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {statusLabel} Message
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {msg.senderType === "station" ? "Station Reply" : "Listener Message"} · {msg.showName || "No show"}
              </p>
            </div>
          </div>
          <StatusBadge label={statusLabel} variant={sv(statusLabel)} />
        </div>
      </div>

      {/* Full Message */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Message</h3>
        </div>
        <div className="px-6 py-5">
          {msg.imageUrl && (
            <div className="mb-3">
              <img src={msg.imageUrl} alt="Message image" className="max-w-full rounded-lg" />
            </div>
          )}
          <p className="text-sm text-foreground leading-relaxed">{msg.content || "[No text content]"}</p>
        </div>
      </div>

      {/* Message Information */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-0">
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created Date</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
              {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "—"}
            </div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">MSISDN</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{msg.msisdn || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Station</div>
            <div className="text-sm font-medium text-foreground">{typeof msg.stationId === "object" ? (msg.stationId as any)?.name || "—" : msg.stationId || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Show</div>
            <div className="text-sm font-medium text-foreground">{msg.showName || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sender Type</div>
            <div className="text-sm font-medium text-foreground capitalize">{msg.senderType || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sender Name</div>
            <div className="text-sm font-medium text-foreground">{msg.senderName || "—"}</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
            <StatusBadge label={statusLabel} variant={sv(statusLabel)} />
          </div>
        </div>
      </div>
    </div>
  );
}
