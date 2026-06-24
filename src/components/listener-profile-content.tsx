"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Phone,
  DollarSign,
  Clock,
  Coins,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import { useGetListenerByIdQuery } from "@/features/crm/crmApi";
import {
  useGetBalanceQuery,
  useAddCreditsMutation,
} from "@/features/credit/creditApi";
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
  const role = useRole();
  const isStationAdmin = role === "station_admin";
  const isSuperAdmin = role === "super_admin";

  const { data, isLoading } = useGetListenerByIdQuery(id);
  const listener = data?.data;

  const { data: balanceData } = useGetBalanceQuery(id);
  const currentBalance = balanceData?.data?.balance ?? 0;

  const [addCredits, { isLoading: isAddingCredits }] = useAddCreditsMutation();
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");

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
            <div className="w-12 h-12 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{listener.fullName || "Unnamed Listener"}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {listener.phone ? `📱 ${listener.phone}` : "No phone"} · {listener.countryName || "Unknown country"} · Registered {listener.createdAt ? new Date(listener.createdAt).toLocaleDateString() : "—"}
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
        <KpiCard
          label="Total Messages"
          value="—"
          sub="Coming soon"
          icon={<MessageSquare size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Total Calls"
          value="—"
          sub="Coming soon"
          icon={<Phone size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Total Spend"
          value="—"
          sub="Coming soon"
          icon={<DollarSign size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
        <KpiCard
          label="Last Activity"
          value={listener.updatedAt ? new Date(listener.updatedAt).toLocaleDateString() : "—"}
          sub={listener.updatedAt ? new Date(listener.updatedAt).toLocaleTimeString() : ""}
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
              {listener.createdAt ? new Date(listener.createdAt).toLocaleDateString() : "—"}
            </div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Last Updated</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
              {listener.updatedAt ? new Date(listener.updatedAt).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Interaction History — Placeholder */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interaction History</h3>
        </div>
        <div className="px-6 py-12 text-center">
          <MessageSquare size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No interactions yet</p>
          <p className="text-xs text-muted-foreground mt-1">Message and call history will appear here once the interaction module is fully connected.</p>
        </div>
      </div>

      {/* Transaction History — Placeholder */}
      {!isStationAdmin && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transaction History</h3>
          </div>
          <div className="px-6 py-12 text-center">
            <DollarSign size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Credit transactions will appear here once the billing module is fully connected.</p>
          </div>
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
    </div>
  );
}
