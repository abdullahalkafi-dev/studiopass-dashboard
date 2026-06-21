"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Radio, MessageSquare, Phone } from "lucide-react";
import { TablePagination } from "@/components/shared/table-pagination";
import { useRole } from "@/contexts/role-context";
import listenersData from "@/mock/listeners.json";

interface Listener {
  id: string;
  msisdn: string;
  country: string;
  operator: string;
  stationId: string;
  station: string;
  messages: number;
  calls: number;
  totalSpend: number;
  lastActivity: string;
  registrationDate: string;
  status: string;
}

interface Interaction {
  id: string;
  listenerId: string;
  date: string;
  station: string;
  stationId: string;
  show: string;
  content: string;
  type: string;
  callDuration?: string;
}

const ALL_LISTENERS = listenersData.listeners as Listener[];
const ALL_INTERACTIONS = listenersData.interactions as Interaction[];
const PER_PAGE = 10;

export default function InteractionHistoryContent({ listenerId }: { listenerId: string }) {
  const role = useRole();
  const isStationAdmin = role === "station_admin";

  const listener = ALL_LISTENERS.find((l) => l.id === listenerId);

  const interactions = useMemo(() => {
    let data = ALL_INTERACTIONS.filter((i) => i.listenerId === listenerId);
    if (isStationAdmin) {
      data = data.filter((i) => i.stationId === "RS-001");
    }
    return data;
  }, [listenerId, isStationAdmin]);

  const [tab, setTab] = useState<"all" | "messages" | "calls">("all");
  const [pg, setPg] = useState(1);

  const messageInteractions = interactions.filter((i) => i.type === "message");
  const callInteractions = interactions.filter((i) => i.type === "call");
  const filtered = tab === "messages" ? messageInteractions : tab === "calls" ? callInteractions : interactions;

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);

  if (!listener) {
    return (
      <div className="space-y-6">
        <Link href="/crm" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to CRM
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Listener not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/crm/${listenerId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to CRM
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Interaction History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Profile for {listener.msisdn}</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setTab("all"); setPg(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === "all"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              All ({interactions.length})
            </button>
            <button
              onClick={() => { setTab("messages"); setPg(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === "messages"
                  ? "bg-[#EFF8FF] text-[#02B2FF]"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <MessageSquare size={12} /> Messages ({messageInteractions.length})
            </button>
            <button
              onClick={() => { setTab("calls"); setPg(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === "calls"
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Phone size={12} /> Calls ({callInteractions.length})
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No interactions found.
                  </td>
                </tr>
              ) : (
                paged.map((int) => (
                  <tr key={int.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{int.date}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#EFF8FF] flex items-center justify-center">
                          <Radio size={10} className="text-[#02B2FF]" />
                        </div>
                        <span className="text-xs font-medium text-foreground">{int.station}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{int.show}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground truncate max-w-[300px] block">
                        {int.type === "call" ? int.callDuration : int.content}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={totalPgs} totalItems={filtered.length} itemLabel="interactions" setPg={setPg} />
      </div>
    </div>
  );
}
