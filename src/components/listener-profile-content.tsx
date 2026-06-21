"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Phone,
  DollarSign,
  Clock,
  Radio,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { useRole } from "@/contexts/role-context";
import listenersData from "@/mock/listeners.json";
import messagesData from "@/mock/messages.json";

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
const ALL_TRANSACTIONS = messagesData.transactions as { id: string; msisdn: string; amount: string; currency: string; country: string; operator: string; receipt: string; status: string; created: string; stationId: string }[];
const PER_PAGE = 10;

export default function ListenerProfileContent({ id }: { id: string }) {
  const role = useRole();
  const isStationAdmin = role === "station_admin";

  const listener = ALL_LISTENERS.find((l) => l.id === id);

  const interactions = useMemo(() => {
    let data = ALL_INTERACTIONS.filter((i) => i.listenerId === id);
    if (isStationAdmin) {
      data = data.filter((i) => i.stationId === "RS-001");
    }
    return data;
  }, [id, isStationAdmin]);

  const transactions = useMemo(() => {
    if (!listener) return [];
    return ALL_TRANSACTIONS.filter((t) => t.msisdn === listener.msisdn);
  }, [listener]);

  const [tab, setTab] = useState<"messages" | "calls">("messages");
  const [txPg, setTxPg] = useState(1);
  const [interPg, setInterPg] = useState(1);
  const INTER_PER_PAGE = 5;

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

  const messageInteractions = interactions.filter((i) => i.type === "message");
  const callInteractions = interactions.filter((i) => i.type === "call");
  const displayInteractions = tab === "messages" ? messageInteractions : callInteractions;

  const interPgs = Math.max(1, Math.ceil(displayInteractions.length / INTER_PER_PAGE));
  const pagedInteractions = displayInteractions.slice((interPg - 1) * INTER_PER_PAGE, interPg * INTER_PER_PAGE);

  const txPgs = Math.max(1, Math.ceil(transactions.length / PER_PAGE));
  const pagedTransactions = transactions.slice((txPg - 1) * PER_PAGE, txPg * PER_PAGE);

  return (
    <div className="space-y-6">
      <Link href="/crm" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to CRM
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Listener Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Profile for {listener.msisdn}</p>
      </div>

      {/* Hero Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{listener.msisdn}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                🌍 {listener.country} · {listener.operator} · Registered {listener.registrationDate}
              </p>
            </div>
          </div>
          <StatusBadge label={listener.status} variant={sv(listener.status)} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Messages"
          value={String(listener.messages)}
          sub="Messages sent"
          icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Total Calls"
          value={String(listener.calls)}
          sub="Calls made"
          icon={<Phone size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Total Spend"
          value={`$${listener.totalSpend.toFixed(2)}`}
          sub="Lifetime spend"
          icon={<DollarSign size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
        <KpiCard
          label="Last Activity"
          value={listener.lastActivity.split(" ")[0]}
          sub={listener.lastActivity.split(" ")[1]}
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Profile Info + Interaction History */}
      <div className="grid grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-0">
            <div className="px-6 py-4 border-b border-r border-border">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Listener ID</div>
              <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{listener.id}</div>
            </div>
            <div className="px-6 py-4 border-b border-border">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">MSISDN</div>
              <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{listener.msisdn}</div>
            </div>
            <div className="px-6 py-4 border-b border-r border-border">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div>
              <div className="text-sm font-medium text-foreground">{listener.country}</div>
            </div>
            <div className="px-6 py-4 border-b border-border">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Top Operator</div>
              <div className="text-sm font-medium text-foreground">{listener.operator}</div>
            </div>
            <div className="px-6 py-4 border-b border-r border-border">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Registration Date</div>
              <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{listener.registrationDate}</div>
            </div>
            <div className="px-6 py-4 border-b border-border">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Last Activity</div>
              <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{listener.lastActivity}</div>
            </div>
          </div>
        </div>

        {/* Interaction History */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interaction History</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab("messages")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === "messages"
                    ? "bg-[#EFF8FF] text-[#02B2FF]"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <MessageSquare size={12} /> Messages ({messageInteractions.length})
              </button>
              <button
                onClick={() => setTab("calls")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === "calls"
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Phone size={12} /> Calls ({callInteractions.length})
              </button>
              <Link
                href={`/crm/${id}/interactions`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#02B2FF] hover:bg-[#EFF8FF] transition-colors"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tab === "messages" ? "Message" : "Duration"}</th>
                </tr>
              </thead>
              <tbody>
                {pagedInteractions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-muted-foreground">
                      No {tab} found.
                    </td>
                  </tr>
                  ) : (
                    pagedInteractions.map((int) => (
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
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                          {tab === "calls" ? int.callDuration : int.content}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination pg={interPg} totalPages={interPgs} totalItems={displayInteractions.length} itemLabel="interactions" setPg={setInterPg} />
        </div>
      </div>

      {/* Transaction History */}
      {!isStationAdmin && (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transaction ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">MSISDN</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Currency</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Operator</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt Number</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {pagedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-xs text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                pagedTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-[#02B2FF] font-['JetBrains_Mono',monospace]">{txn.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground font-['JetBrains_Mono',monospace]">{txn.msisdn}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground">{txn.amount}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {txn.currency}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{txn.country}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{txn.operator}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{txn.receipt || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={txn.status} variant={sv(txn.status)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{txn.created}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination pg={txPg} totalPages={txPgs} totalItems={transactions.length} itemLabel="transactions" setPg={setTxPg} />
      </div>
      )}
    </div>
  );
}
