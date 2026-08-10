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
  Eye,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { ImageModal } from "@/components/shared/image-modal";
import { useRole } from "@/contexts/role-context";
import { useGetListenerByIdQuery, useGetListenerVotesQuery } from "@/features/crm/crmApi";
import { formatDate, formatTime12h, formatDateTime } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";
import { resolveUrl } from "@/lib/utils";
import { useChannelType } from "@/hooks/use-channel-type";
import {
  useGetBalanceQuery,
  useAddCreditsMutation,
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

export default function ListenerProfileContent({ id }: { id: string }) {
  const timezone = useTimezone();
  const role = useRole();
  const { isPollChannel } = useChannelType();
  const isStationAdmin = role === "station_admin";
  const isSuperAdmin = role === "super_admin";

  const { data, isLoading } = useGetListenerByIdQuery(id);
  const listener = data?.data;

  const { data: votesData, isLoading: votesLoading } = useGetListenerVotesQuery(id, { skip: !isPollChannel });
  const pollVotes = votesData?.data || [];

  const { data: balanceData } = useGetBalanceQuery(id);
  const currentBalance = balanceData?.data?.balance ?? 0;

  const { data: statementsData, isLoading: statementsLoading } = useGetStatementsQuery({ userId: id });
  const statements = statementsData?.data || [];

  const { data: transactionsData, isLoading: transactionsLoading } = useGetTransactionsQuery({ userId: id });
  const transactions = transactionsData?.data || [];

  const [addCredits, { isLoading: isAddingCredits }] = useAddCreditsMutation();
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const handleAddCredits = async () => {
    const amount = parseInt(creditAmount, 10);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await addCredits({ userId: id, amount, isFree: true }).unwrap();
      toast.success(`${amount} free credits added successfully`);
      setCreditDialogOpen(false);
      setCreditAmount("");
    } catch {
      toast.error("Failed to add credits. Please try again.");
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
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={listener.avatar}
              initials={initials}
              size="xl"
              className="w-14 h-14 text-base font-bold shadow-sm"
              onClick={listener.avatar ? () => setViewerImage(resolveUrl(listener.avatar) || null) : undefined}
            />
            <div>
              <h2 className="text-lg font-bold text-foreground">{listener.fullName || "Unnamed Listener"}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {listener.phone ? `📱 ${listener.phone}` : "No phone"} · {listener.countryName || "Unknown country"} · Registered {listener.createdAt ? formatDate(listener.createdAt, timezone) : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Button
                size="sm"
                onClick={() => setCreditDialogOpen(true)}
                className="gap-1.5 bg-[#02B2FF] hover:bg-[#0295e0] text-white"
              >
                <Plus size={14} />
                Add Credits
              </Button>
            )}
            <StatusBadge
              label={listener.isBlocked ? "Inactive" : "Active"}
              variant={sv(listener.isBlocked ? "Inactive" : "Active")}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard
          label="Credit Balance"
          value={String(currentBalance)}
          sub={currentBalance > 0 ? "Available credits" : "No credits"}
          icon={<Coins size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
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
        <div className="grid grid-cols-2 gap-0">
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Listener ID</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{listener.id}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Full Name</div>
            <div className="text-sm font-medium text-foreground">{listener.fullName || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{listener.phone || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Email</div>
            <div className="text-sm font-medium text-foreground">{listener.email || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div>
            <div className="text-sm font-medium text-foreground">{listener.countryName || "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
            <StatusBadge
              label={listener.isBlocked ? "Inactive" : "Active"}
              variant={sv(listener.isBlocked ? "Inactive" : "Active")}
            />
          </div>
          <div className="px-6 py-4 border-b border-r border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Registered</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
              {listener.createdAt ? formatDate(listener.createdAt, timezone) : "—"}
            </div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Last Updated</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
              {listener.updatedAt ? formatDate(listener.updatedAt, timezone) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Interaction / Voting History */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {isPollChannel ? "Poll Voting History" : "Interaction History"}
          </h3>
          <span className="text-xs text-muted-foreground">
            {isPollChannel ? `${pollVotes.length} total votes` : `${statements.length} total interactions`}
          </span>
        </div>
        {isPollChannel ? (
          votesLoading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading voting history...</div>
          ) : pollVotes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BarChart3 size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No poll votes recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">S/N</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">VOTED AT</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">POLL TITLE</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">CATEGORY</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">NOMINEE VOTED</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">COST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pollVotes.map((v: any, i: number) => (
                    <tr key={v.id || i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="px-6 py-3 text-foreground font-mono">{v.createdAt ? formatDateTime(v.createdAt, timezone) : "—"}</td>
                      <td className="px-6 py-3 font-medium text-foreground">{v.pollTitle}</td>
                      <td className="px-6 py-3 text-muted-foreground">{v.categoryName}</td>
                      <td className="px-6 py-3 font-semibold text-[#02B2FF]">{v.nomineeName}</td>
                      <td className="px-6 py-3 font-mono font-semibold text-foreground">
                        {v.creditCost > 0 ? `${v.creditCost} Credits` : <span className="text-emerald-600 font-normal">Free</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : statementsLoading ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading interactions...</div>
        ) : statements.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MessageSquare size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No interactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">S/N</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">CREATED</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">TYPE</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">STATION</th>
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
                        `${s.currencySymbol || "৳"}${s.amount}`
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

      {/* Transaction History */}
      {!isStationAdmin && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transaction History</h3>
            <span className="text-xs text-muted-foreground">{transactions.length} total transactions</span>
          </div>
          {transactionsLoading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Banknote size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">S/N</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">CREATED</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">TRANSACTION ID</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">TYPE</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">CREDITS</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">AMOUNT</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t: any, i: number) => {
                    const typeLabel =
                      t.type === "admin_grant"
                        ? "Free Credits Granted"
                        : t.type === "purchase"
                        ? "Credit Purchase"
                        : t.type === "message_deduction"
                        ? "Message Sent"
                        : t.type === "call_deduction"
                        ? "Call Interaction"
                        : t.type;
                    const isCreditAdd = t.type === "admin_grant" || t.type === "purchase";
                    const creditVal = Math.abs(t.amount ?? 1);
                    const statusText = t.status ? (t.status.charAt(0).toUpperCase() + t.status.slice(1)) : "Completed";
                    return (
                      <tr key={t._id || i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-6 py-3 text-foreground font-mono">{t.createdAt ? formatDateTime(t.createdAt, timezone) : "—"}</td>
                        <td className="px-6 py-3 font-mono text-[#02B2FF] font-medium">{t._id || "—"}</td>
                        <td className="px-6 py-3 font-medium text-foreground">{typeLabel}</td>
                        <td className={`px-6 py-3 font-mono font-semibold ${isCreditAdd ? "text-emerald-600" : "text-foreground"}`}>
                          {isCreditAdd ? `+${creditVal}` : `-${creditVal}`} Credits
                        </td>
                        <td className="px-6 py-3 font-mono text-muted-foreground">
                          {t.isFree ? (
                            <span className="text-emerald-600 font-normal">Free</span>
                          ) : (
                            `${t.localCurrency || "$"}${t.localAmount || 0}`
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
            <DialogTitle className="flex items-center gap-2">
              <Coins size={18} className="text-[#02B2FF]" />
              Add Free Credits
            </DialogTitle>
            <DialogDescription>
              Credits will be added to this user&apos;s balance at no cost. These are free promotional credits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="credit-amount">Amount</Label>
            <Input
              id="credit-amount"
              type="number"
              min={1}
              placeholder="Enter credit amount"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCredits();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreditDialogOpen(false);
                setCreditAmount("");
              }}
              disabled={isAddingCredits}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCredits}
              disabled={isAddingCredits || !creditAmount}
              className="bg-[#02B2FF] hover:bg-[#0295e0] text-white"
            >
              {isAddingCredits ? "Adding..." : "Add Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageModal src={viewerImage} onClose={() => setViewerImage(null)} />
    </div>
  );
}
