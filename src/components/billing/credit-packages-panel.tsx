"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Power, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/section-header";
import {
  useCreateCreditPackageMutation,
  useGetCreditPackagesQuery,
  useUpdateCreditPackageMutation,
  type CreditPackageAdmin,
} from "@/features/payment/paymentApi";

const errorMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message || fallback;

const formatUgx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;

/** Price of one credit in this package, e.g. 250 or 333.33 */
const perCredit = (p: { amountUgx: number; credits: number }) => {
  if (!p.credits) return 0;
  const v = p.amountUgx / p.credits;
  return Number.isInteger(v) ? v : Math.round(v * 100) / 100;
};

type FormState = { label: string; amountUgx: string; credits: string; sortOrder: string; isActive: boolean };
const EMPTY_FORM: FormState = { label: "", amountUgx: "", credits: "", sortOrder: "0", isActive: true };

export function CreditPackagesPanel() {
  const { data, isLoading, isError, refetch } = useGetCreditPackagesQuery();
  const [createPackage, { isLoading: isCreating }] = useCreateCreditPackageMutation();
  const [updatePackage, { isLoading: isUpdating }] = useUpdateCreditPackageMutation();

  const packages = data?.data ?? [];
  const activeRates = Array.from(new Set(packages.filter((p) => p.isActive).map(perCredit)));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CreditPackageAdmin | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: CreditPackageAdmin) => {
    setEditing(p);
    setForm({
      label: p.label,
      amountUgx: String(p.amountUgx),
      credits: String(p.credits),
      sortOrder: String(p.sortOrder),
      isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const amount = Number(form.amountUgx);
  const credits = Number(form.credits);
  const sortOrder = Number(form.sortOrder || 0);
  const amountOk = Number.isInteger(amount) && amount >= 100 && amount <= 2_000_000;
  const creditsOk = Number.isInteger(credits) && credits >= 1 && credits <= 100_000;
  const formOk = form.label.trim().length > 0 && amountOk && creditsOk && Number.isInteger(sortOrder);
  const saving = isCreating || isUpdating;

  const handleSave = async () => {
    if (!formOk) return;
    const payload = { label: form.label.trim(), amountUgx: amount, credits, sortOrder, isActive: form.isActive };
    try {
      if (editing) {
        await updatePackage({ id: editing.id, patch: payload }).unwrap();
        toast.success("Package updated");
      } else {
        await createPackage(payload).unwrap();
        toast.success("Package created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, "Could not save the package. Please try again."));
    }
  };

  const handleToggle = async (p: CreditPackageAdmin) => {
    setTogglingId(p.id);
    try {
      await updatePackage({ id: p.id, patch: { isActive: !p.isActive } }).unwrap();
      toast.success(p.isActive ? "Package hidden from the app" : "Package is now visible in the app");
    } catch (err) {
      toast.error(errorMessage(err, "Could not change the package status."));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Credit Packages</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Listeners buy these packages with MTN or Airtel Mobile Money. The price and the number of credits are
              fixed here on the server, so the app cannot change them. A listener sees no package until you create one.
              Deactivating a package hides it from the app but keeps the payment history.
            </p>
          </div>
          <Button onClick={openCreate} className="bg-[#02B2FF] hover:bg-[#0295e0] text-white shrink-0">
            <Plus size={14} className="mr-1.5" /> Add package
          </Button>
        </div>

        {activeRates.length > 1 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Active packages have different prices per credit ({activeRates.map((r) => formatUgx(r)).join(", ")}). That
              is fine if you offer discounts; check it is what you intend.
            </span>
          </div>
        )}
      </Card>

      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Credits</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Per credit</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#02B2FF]" /> Loading packages...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-destructive">
                    Could not load the packages.{" "}
                    <button onClick={() => refetch()} className="underline font-semibold">
                      Try again
                    </button>
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-muted-foreground">
                    No packages yet. Listeners cannot buy credits until you add one.
                  </td>
                </tr>
              ) : (
                packages.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold text-foreground">{p.label}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-foreground">{formatUgx(p.amountUgx)}</td>
                    <td className="px-5 py-3.5 text-xs text-foreground">{p.credits.toLocaleString("en-US")}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{formatUgx(perCredit(p))}</td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge label={p.isActive ? "Active" : "Hidden"} variant={p.isActive ? "success" : "neutral"} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                          <Pencil size={12} className="mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggle(p)} disabled={togglingId === p.id}>
                          {togglingId === p.id ? (
                            <Loader2 size={12} className="animate-spin mr-1" />
                          ) : (
                            <Power size={12} className="mr-1" />
                          )}
                          {p.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit package" : "Add package"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Changes apply to new purchases. Payments already made keep the price and credits they were bought at."
                : "The package appears in the listener app straight away when it is active."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-label">Name</Label>
              <Input
                id="pkg-label"
                placeholder="e.g. Starter"
                maxLength={40}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-amount">Price (UGX)</Label>
                <Input
                  id="pkg-amount"
                  type="number"
                  min={100}
                  step={1}
                  placeholder="e.g. 500"
                  value={form.amountUgx}
                  onChange={(e) => setForm({ ...form, amountUgx: e.target.value })}
                />
                {form.amountUgx !== "" && !amountOk && (
                  <p className="text-[11px] text-destructive">Whole number, UGX 100 to 2,000,000.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-credits">Credits</Label>
                <Input
                  id="pkg-credits"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 2"
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                />
                {form.credits !== "" && !creditsOk && (
                  <p className="text-[11px] text-destructive">Whole number, 1 to 100,000.</p>
                )}
              </div>
            </div>

            {amountOk && creditsOk && (
              <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">The listener pays {formatUgx(amount)} for {credits} credit{credits === 1 ? "" : "s"}</span>
                <span className="font-bold text-foreground">{formatUgx(perCredit({ amountUgx: amount, credits }))} per credit</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-order">Display order</Label>
                <Input
                  id="pkg-order"
                  type="number"
                  step={1}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">Lower numbers first. Same number: cheaper first.</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-foreground pb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                Visible in the app
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formOk || saving} className="bg-[#02B2FF] hover:bg-[#0295e0] text-white">
              {saving ? "Saving..." : editing ? "Save changes" : "Create package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
