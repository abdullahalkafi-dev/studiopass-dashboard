"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Phone,
  Banknote,
  Clock,
  Coins,
  Plus,
  Minus,
  Eye,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { ImageModal } from "@/components/shared/image-modal";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useGetListenerByIdQuery, useGetListenerVotesQuery } from "@/features/crm/crmApi";
import { formatDate, formatTime12h, formatDateTime } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { resolveUrl } from "@/lib/utils";
import { useChannelType } from "@/hooks/use-channel-type";
import {
  useGetBalanceQuery,
  useAddCreditsMutation,
  useDeductCreditsMutation,
  useGetTransactionsQuery,
} from "@/features/credit/creditApi";
import { useGetStatementsQuery } from "@/features/statement/statementApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ListenerProfileContent({ id }: { id: string }) {
  const timezone = useTimezone();
  const { isPollChannel } = useChannelType();
  const role = useRole();
  const authUser = useAppSelector((state) => state.auth.user);

  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isCustomerCare = role === "customer_care";
  const isStationAdmin = role === "station_admin";

  // Station admin is explicitly excluded from viewing or requesting user credit
  const canViewCredit = isSuperAdmin || isPartnerAdmin || isCustomerCare;

  const { data, isLoading, refetch: refetchListener } = useGetListenerByIdQuery(id);
  const listener = data?.data;

  // Partner country matching for credit management
  const partnerCountryId = typeof (authUser as any)?.partnerId === "object"
    ? ((authUser as any)?.partnerId?.country?._id || (authUser as any)?.partnerId?.country)
    : (authUser as any)?.countryId || undefined;

  const isCountryMatch = isSuperAdmin || (
    isPartnerAdmin && (
      !partnerCountryId ||
      !listener?.countryId ||
      partnerCountryId.toString() === listener.countryId.toString()
    )
  );
  const canManageCredits = isSuperAdmin || (isPartnerAdmin && isCountryMatch);

  const { data: votesData, isLoading: votesLoading } = useGetListenerVotesQuery(id, { skip: !isPollChannel });
  const pollVotes = votesData?.data || [];

  // Only request credit balance if user has permission (Station Admin skips this)
  const { data: balanceData } = useGetBalanceQuery(id, { skip: !canViewCredit });
  const currentBalance = canViewCredit
    ? (balanceData?.data?.balance ?? listener?.balance ?? listener?.creditBalance ?? 0)
    : 0;

  const { data: statementsData, isLoading: statementsLoading } = useGetStatementsQuery({ userId: id });
  const statements = statementsData?.data || [];

  const { data: transactionsData, isLoading: transactionsLoading } = useGetTransactionsQuery(
    { userId: id },
    { skip: isStationAdmin },
  );
  const transactions = transactionsData?.data || [];

  // Add Credits State
  const [addCredits, { isLoading: isAddingCredits }] = useAddCreditsMutation();
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");

  // Deduct Credits State
  const [deductCredits, { isLoading: isDeductingCredits }] = useDeductCreditsMutation();
  const [deductDialogOpen, setDeductDialogOpen] = useState(false);
  const [deductAmount, setDeductAmount] = useState("");
  const [deductReason, setDeductReason] = useState("");

  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const handleAddCredits = async () => {
    const amount = parseInt(creditAmount, 10);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid credit amount");
      return;
    }
    try {
      await addCredits({
        userId: id,
        amount,
        isFree: true,
        reason: creditReason.trim() || undefined,
      }).unwrap();
      refetchListener();
      toast.success(`${amount} credits added successfully`);
      setCreditDialogOpen(false);
      setCreditAmount("");
      setCreditReason("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add credits. Please try again.");
    }
  };

  const handleDeductCredits = async () => {
    const amount = parseInt(deductAmount, 10);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid deduction amount");
      return;
    }
    if (amount > currentBalance) {
      toast.error(`Cannot deduct more than available balance (${currentBalance})`);
      return;
    }
    if (!deductReason.trim()) {
      toast.error("Please provide a reason for credit deduction");
      return;
    }
    try {
      await deductCredits({
        userId: id,
        amount,
        reason: deductReason.trim(),
      }).unwrap();
      refetchListener();
      toast.success(`${amount} credits deducted successfully`);
      setDeductDialogOpen(false);
      setDeductAmount("");
      setDeductReason("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to deduct credits. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/crm" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to CRM
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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

  const initials = listener.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "L";
  const numDeduct = parseInt(deductAmount, 10) || 0;
  const isOverDeduct = numDeduct > currentBalance;

  return (
    <div className="space-y-6">
      <Link href="/crm" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to CRM
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Listener Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Profile for {listener.phone || listener.fullName}</p>
      </div>

      {/* Hero Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar
              src={listener.avatar}
              initials={initials}
              size="xl"
              className="w-12 h-12 sm:w-14 sm:h-14 text-base font-bold shadow-sm shrink-0"
              onClick={listener.avatar ? () => setViewerImage(resolveUrl(listener.avatar) || null) : undefined}
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{listener.fullName || "Unnamed Listener"}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {listener.phone ? `📱 ${listener.phone}` : "No phone"}
                {listener.operator ? ` (${listener.operator})` : ""} · {listener.countryName || "Unknown country"} · Registered {listener.createdAt ? formatDate(listener.createdAt, timezone) : "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {canManageCredits && (
              <>
                <Button
                  size="sm"
                  onClick={() => setCreditDialogOpen(true)}
                  className="gap-1.5 bg-[#02B2FF] hover:bg-[#0295e0] text-white shadow-xs"
                >
                  <Plus size={14} />
                  Add Credits
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeductDialogOpen(true)}
                  className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <Minus size={14} />
                  Deduct Credits
                </Button>
              </>
            )}
            <StatusBadge
              label={listener.isBlocked ? "Inactive" : "Active"}
              variant={sv(listener.isBlocked ? "Inactive" : "Active")}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards — Station Admin excluded from viewing credit balance */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${canViewCredit ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3 sm:gap-4`}>
        {canViewCredit && (
          <KpiCard
            label="Credit Balance"
            value={String(currentBalance)}
            sub={currentBalance > 0 ? "Available credits" : "No credits"}
            icon={<Coins size={16} className="text-[#02B2FF]" />}
            iconBg="bg-[#EFF8FF]"
          />
        )}
        {isPollChannel ? (
          <KpiCard
            label="Total Votes"
            value={String(listener.totalVotes ?? pollVotes.length)}
            sub={listener.totalVotes ? "Poll votes cast" : "No votes cast"}
            icon={<BarChart3 size={16} className="text-emerald-500" />}
            iconBg="bg-emerald-50"
          />
        ) : (
          <KpiCard
            label="Total Messages"
            value={String(listener.totalMessages ?? 0)}
            sub={listener.totalMessages ? "Total sent" : "No messages"}
            icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
            iconBg="bg-[#EFF8FF]"
          />
        )}
        <KpiCard
          label="Total Calls"
          value={String(listener.totalCalls ?? 0)}
          sub={listener.totalCalls ? "Total calls" : "No calls"}
          icon={<Phone size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Total Spend"
          value={`${listener.totalSpend ?? 0} ${listener.currency || "UGX"}`}
          sub={listener.totalSpend ? "Total spend" : "No spend"}
          icon={<Banknote size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
        <KpiCard
          label="Last Activity"
          value={listener.updatedAt ? formatDate(listener.updatedAt, timezone) : "—"}
          sub={listener.updatedAt ? formatTime12h(listener.updatedAt, timezone) : ""}
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Profile Information */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          <div className="px-6 py-4 border-b sm:border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Listener ID</div>
            <div className="text-sm font-mono font-medium text-foreground break-all">{listener.id || listener._id}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Full Name</div>
            <div className="text-sm font-medium text-foreground">{listener.fullName || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b sm:border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone Number</div>
            <div className="text-sm font-mono font-medium text-foreground">
              {listener.phone || "—"}
              {listener.operator && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                  {listener.operator}
                </span>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Email</div>
            <div className="text-sm font-medium text-foreground">{listener.email || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b sm:border-b-0 sm:border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div>
            <div className="text-sm font-medium text-foreground">{listener.countryName || "—"}</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Registration Date</div>
            <div className="text-sm font-medium text-foreground">{listener.createdAt ? formatDateTime(listener.createdAt, timezone) : "—"}</div>
          </div>
        </div>
      </div>

      {/* Activity Section — Poll Channel vs Radio/TV Station */}
      {isPollChannel ? (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Channel Poll Votes</h3>
            <span className="text-xs text-muted-foreground">{pollVotes.length} total votes</span>
          </div>
          {votesLoading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading votes...</div>
          ) : pollVotes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BarChart3 size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No channel poll votes recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">S/N</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">VOTED AT</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">POLL TITLE</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">CATEGORY</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">NOMINEE</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">CREDIT COST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pollVotes.map((v: any, i: number) => (
                    <tr key={v.id || i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="px-6 py-3 text-foreground font-mono">{v.createdAt ? formatDateTime(v.createdAt, timezone) : "—"}</td>
                      <td className="px-6 py-3 font-medium text-foreground">{v.pollTitle || "—"}</td>
                      <td className="px-6 py-3 text-foreground">{v.categoryName || "—"}</td>
                      <td className="px-6 py-3 font-semibold text-foreground">{v.nomineeName || "—"}</td>
                      <td className="px-6 py-3 font-mono font-semibold text-foreground">
                        {v.creditCost > 0 ? (
                          <span className="text-[#02B2FF]">{v.creditCost} credits</span>
                        ) : (
                          <span className="text-emerald-600 font-normal">Free</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Activity History</h3>
            <span className="text-xs text-muted-foreground">{statements.length} total activities</span>
          </div>
          {statementsLoading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading activity...</div>
          ) : statements.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No interactions recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">S/N</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">TIME</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">TYPE</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">MEDIA STATION</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">SHOW</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">AMOUNT</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">TICKET</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {statements.map((s: any, i: number) => (
                    <tr key={s._id || i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="px-6 py-3 text-foreground font-mono">{s.createdAt ? formatDateTime(s.createdAt, timezone) : "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${s.type === "Call" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}>
                          {s.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-foreground">{s.mediaStation || "—"}</td>
                      <td className="px-6 py-3 text-muted-foreground">{s.showName || "—"}</td>
                      <td className="px-6 py-3 font-mono font-semibold text-foreground">
                        {s.isFree ? (
                          <span className="text-emerald-600 font-normal">Free</span>
                        ) : (
                          `${s.currencySymbol || "UGX "}${s.amount}`
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-[#02B2FF] font-medium">{s.ticket || "—"}</td>
                      <td className="px-6 py-3">
                        <StatusBadge label={s.status || "Successful"} variant={sv(s.status || "Successful")} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transaction History & Audit Trail — Station Admin excluded */}
      {!isStationAdmin && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credit Transaction History & Audit Trail</h3>
            <span className="text-xs text-muted-foreground">{transactions.length} total transactions</span>
          </div>
          {transactionsLoading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Banknote size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No transactions recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">S/N</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">DATE / TIME</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">TYPE</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">CREDIT CHANGE</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">BALANCE SHIFT</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">NOTE / AUDIT</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t: any, i: number) => {
                    const isGrant = t.type === "admin_grant" || t.type === "purchase" || t.type === "challenge_reward";
                    const isDeduction = t.type === "admin_deduction";
                    const creditVal = Math.abs(t.amount ?? 1);
                    const statusText = t.status ? (t.status.charAt(0).toUpperCase() + t.status.slice(1)) : "Completed";

                    let typeBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                        {t.type}
                      </span>
                    );

                    if (t.type === "admin_grant") {
                      typeBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Admin Grant
                        </span>
                      );
                    } else if (t.type === "admin_deduction") {
                      typeBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Admin Deduction
                        </span>
                      );
                    } else if (t.type === "purchase") {
                      typeBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Purchase
                        </span>
                      );
                    } else if (t.type === "message_deduction") {
                      typeBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Message Sent
                        </span>
                      );
                    } else if (t.type === "call_deduction") {
                      typeBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                          Call Placed
                        </span>
                      );
                    }

                    return (
                      <tr key={t._id || i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-6 py-3 text-foreground font-mono">{t.createdAt ? formatDateTime(t.createdAt, timezone) : "—"}</td>
                        <td className="px-6 py-3">{typeBadge}</td>
                        <td className={`px-6 py-3 font-mono font-bold ${isGrant ? "text-emerald-600" : isDeduction ? "text-rose-600" : "text-foreground"}`}>
                          {isGrant ? `+${creditVal}` : `-${creditVal}`} Credits
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                          {t.previousBalance !== undefined && t.newBalance !== undefined ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                              <span>{t.previousBalance}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className={isGrant ? "text-emerald-600" : isDeduction ? "text-rose-600" : "text-foreground"}>
                                {t.newBalance}
                              </span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-3 max-w-xs truncate text-xs">
                          {t.reason ? (
                            <div>
                              <p className="text-foreground font-medium truncate">{t.reason}</p>
                              {(t.adminName || t.adminRole) && (
                                <p className="text-[10px] text-muted-foreground">
                                  by {t.adminName || "Admin"} ({t.adminRole || "Admin"})
                                </p>
                              )}
                            </div>
                          ) : t.grantedBy ? (
                            <span className="text-muted-foreground">By Admin ({t.adminRole || "Admin"})</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge label={statusText} variant={sv(statusText)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Credits Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Coins size={18} className="text-[#02B2FF]" />
              Add Free Credits
            </DialogTitle>
            <DialogDescription>
              Credits will be added to this user&apos;s balance. This will be recorded in the platform audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="p-3 bg-muted/60 rounded-lg flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Current Available Balance:</span>
              <span className="font-bold text-foreground text-sm">{currentBalance} Credits</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credit-amount">Amount <span className="text-rose-500">*</span></Label>
              <Input
                id="credit-amount"
                type="number"
                min={1}
                placeholder="e.g. 50"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            {parseInt(creditAmount, 10) > 0 && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-lg text-xs flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">New Balance after grant:</span>
                <span className="font-bold text-blue-800 dark:text-blue-200">
                  {currentBalance + parseInt(creditAmount, 10)} Credits
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="credit-reason">Reason / Note (Optional)</Label>
              <Input
                id="credit-reason"
                placeholder="e.g. Goodwill top-up, Campaign compensation"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreditDialogOpen(false);
                setCreditAmount("");
                setCreditReason("");
              }}
              disabled={isAddingCredits}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCredits}
              disabled={isAddingCredits || !creditAmount || parseInt(creditAmount, 10) <= 0}
              className="bg-[#02B2FF] hover:bg-[#0295e0] text-white"
            >
              {isAddingCredits ? "Adding..." : "Add Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deduct Credits Dialog with Zero-Floor Guard */}
      <Dialog open={deductDialogOpen} onOpenChange={setDeductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Minus size={18} className="text-rose-600" />
              Deduct User Credits
            </DialogTitle>
            <DialogDescription>
              Deduct credits from this listener&apos;s balance. This action cannot be undone and is permanently logged in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="p-3 bg-muted/60 rounded-lg flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Current Available Balance:</span>
              <span className="font-bold text-foreground text-sm">{currentBalance} Credits</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deduct-amount">Amount to Deduct <span className="text-rose-500">*</span></Label>
              <Input
                id="deduct-amount"
                type="number"
                min={1}
                max={currentBalance}
                placeholder="Enter amount to deduct"
                value={deductAmount}
                onChange={(e) => setDeductAmount(e.target.value)}
              />
              {isOverDeduct && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                  <AlertTriangle size={13} />
                  <span>Deduction exceeds user balance ({currentBalance}). Maximum deductible is {currentBalance}.</span>
                </div>
              )}
            </div>

            {numDeduct > 0 && !isOverDeduct && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-xs flex justify-between">
                <span className="text-emerald-700 dark:text-emerald-300">New Balance after deduction:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-200">
                  {currentBalance - numDeduct} Credits
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="deduct-reason">Reason / Note <span className="text-rose-500">*</span></Label>
              <Textarea
                id="deduct-reason"
                rows={2}
                placeholder="Required: e.g. Correction for duplicate grant, dispute reversal"
                value={deductReason}
                onChange={(e) => setDeductReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeductDialogOpen(false);
                setDeductAmount("");
                setDeductReason("");
              }}
              disabled={isDeductingCredits}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeductCredits}
              disabled={
                isDeductingCredits ||
                !deductAmount ||
                numDeduct <= 0 ||
                isOverDeduct ||
                !deductReason.trim()
              }
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeductingCredits ? "Deducting..." : "Confirm Deduction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageModal src={viewerImage} onClose={() => setViewerImage(null)} />
    </div>
  );
}
