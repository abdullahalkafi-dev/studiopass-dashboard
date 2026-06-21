"use client";

import Link from "next/link";
import { ArrowLeft, MessageSquare, Radio } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import messagesData from "@/mock/messages.json";

interface Message {
  id: string;
  created: string;
  msisdn: string;
  stationId: string;
  station: string;
  show: string;
  preview: string;
  fullMessage: string;
  operator: string;
  country: string;
  status: string;
}

const ALL_MESSAGES = messagesData.messages as Message[];

export default function MessageDetailContent({ id }: { id: string }) {
  const msg = ALL_MESSAGES.find((m) => m.id === id);

  if (!msg) {
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

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/messages" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Messages
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Message Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          From {msg.msisdn} · {msg.created}
        </p>
      </div>

      {/* Hero Card */}
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-800">
                {msg.status === "Delivered" ? "Delivered Message" : "Pending Message"}
              </h2>
              <p className="text-xs text-emerald-600 mt-0.5">
                {msg.station} · {msg.show}
              </p>
            </div>
          </div>
          <StatusBadge label={msg.status} variant={sv(msg.status)} />
        </div>
      </div>

      {/* Full Message */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Message</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-foreground leading-relaxed">{msg.fullMessage}</p>
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
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{msg.created}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">MSISDN</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{msg.msisdn}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Station</div>
            <div className="text-sm font-medium text-foreground">{msg.station}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Show</div>
            <div className="text-sm font-medium text-foreground">{msg.show}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Operator</div>
            <div className="text-sm font-medium text-foreground">{msg.operator}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div>
            <div className="text-sm font-medium text-foreground">{msg.country}</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
            <StatusBadge label={msg.status} variant={sv(msg.status)} />
          </div>
        </div>
      </div>

    </div>
  );
}
