"use client";

import { useState } from "react";
import Link from "next/link";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import {
  useGetPendingMessagesQuery,
  useApproveMessageMutation,
  useRejectMessageMutation,
  useSendToOutputMutation,
} from "@/features/message/messageApi";
import { toast } from "sonner";
import {
  Shield, Search, CheckCircle2, XCircle, Send, Clock,
  MessageSquare, ArrowLeft, AlertTriangle,
} from "lucide-react";
import { useCategory } from "@/hooks/use-category";

export default function ApprovalQueueContent() {
  const role = useRole();
  const { category } = useCategory();
  const [pg, setPg] = useState(1);
  const [stationFilter, setStationFilter] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const PER = 10;

  const userStationId = useAppSelector((state: any) => state.auth.user?.stationId);
  const stationId = (role !== "super_admin" && role !== "partner_admin") ? userStationId : undefined;

  const resolvedStationId = stationId || stationFilter || undefined;

  const { data: pendingData, isLoading } = useGetPendingMessagesQuery({
    stationId: resolvedStationId,
    page: pg,
    limit: PER,
  });

  const [approveMessage, { isLoading: isApproving }] = useApproveMessageMutation();
  const [rejectMessage, { isLoading: isRejecting }] = useRejectMessageMutation();
  const [sendToOutput, { isLoading: isSending }] = useSendToOutputMutation();

  const messages = pendingData?.data || [];
  const meta = pendingData?.meta || { total: 0, totalPage: 0 };

  const handleApprove = async (id: string) => {
    try {
      await approveMessage(id).unwrap();
      toast.success("Message approved");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    try {
      await rejectMessage({ id, rejectionReason: rejectReason.trim() }).unwrap();
      toast.success("Message rejected");
      setRejectingId(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reject");
    }
  };

  const handleSendToOutput = async (id: string) => {
    try {
      await sendToOutput(id).unwrap();
      toast.success("Sent to output");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send to output");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft size={16} className="text-muted-foreground" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Approval Queue</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review pending TV messages before they go to output.
            </p>
          </div>
        </div>
      </div>

      {/* Category guard: only TV stations have approval queue */}
      {category !== "tv" && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">Approval Queue is only for TV stations</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Your station category is &quot;{category}&quot;. The approval queue is a TV-specific feature where messages must be reviewed before going to output.
            </p>
            <Link href="/messages" className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors">
              <ArrowLeft size={14} /> Back to Messages
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Pending Approval"
          value={String(meta.total)}
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Station"
          value={resolvedStationId ? "Filtered" : "All Stations"}
          icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Queue Status"
          value={meta.total > 0 ? "Needs Review" : "Clear"}
          icon={meta.total > 0 ? <Clock size={16} className="text-amber-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg={meta.total > 0 ? "bg-amber-50" : "bg-emerald-50"}
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing <span className="text-foreground">{messages.length}</span> of <span className="text-foreground">{meta.total}</span> pending messages
          </span>
          <span className="text-xs text-muted-foreground">Page {pg} of {meta.totalPage}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">MSISDN</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center animate-pulse"><Search size={18} className="text-muted-foreground" /></div>
                      <p className="text-sm font-semibold text-foreground">Loading pending messages…</p>
                    </div>
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 size={18} className="text-emerald-600" /></div>
                      <p className="text-sm font-semibold text-foreground">Queue is clear</p>
                      <p className="text-xs text-muted-foreground">No pending messages to review</p>
                    </div>
                  </td>
                </tr>
              ) : messages.map((msg: any, i: number) => (
                <tr key={msg.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">
                    {(pg - 1) * PER + i + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="max-w-xs">
                      <p className="text-xs font-medium text-foreground truncate">{msg.content || msg.imageUrl || "[Image]"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-foreground">{msg.msisdn}</td>
                  <td className="px-5 py-3.5 text-xs text-foreground">{msg.showName || "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                    {new Date(msg.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {msg.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleApprove(msg.id)}
                            disabled={isApproving}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800 dark:hover:bg-emerald-950/60"
                            title="Approve"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setRejectingId(rejectingId === msg.id ? null : msg.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors dark:text-red-400 dark:bg-red-950/40 dark:border-red-800 dark:hover:bg-red-950/60"
                            title="Reject"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      ) : msg.status === "approved" ? (
                        <button
                          onClick={() => handleSendToOutput(msg.id)}
                          disabled={isSending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#02B2FF] bg-[#EFF8FF] border border-[#02B2FF]/20 rounded-lg hover:bg-[#02B2FF]/10 transition-colors disabled:opacity-50"
                          title="Send to Output"
                        >
                          <Send size={12} /> Send to TV
                        </button>
                      ) : (
                        <StatusBadge label={msg.status} variant={sv(msg.status)} />
                      )}
                    </div>
                    {/* Inline reject reason input */}
                    {rejectingId === msg.id && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason…"
                          className="flex-1 px-2 py-1.5 text-xs rounded border border-red-200 bg-background focus:outline-none focus:ring-1 focus:ring-red-300"
                        />
                        <button
                          onClick={() => handleReject(msg.id)}
                          disabled={isRejecting || !rejectReason.trim()}
                          className="px-2 py-1.5 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(""); }}
                          className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border border-border rounded hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={meta.totalPage} totalItems={meta.total} itemLabel="messages" setPg={setPg} />
      </div>
    </div>
  );
}


