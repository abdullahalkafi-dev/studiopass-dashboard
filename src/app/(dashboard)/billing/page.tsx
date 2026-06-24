"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RotateCcw, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useGetCountriesQuery, useUpdateCountryMutation } from "@/features/country/countryApi";

const FLAGS: Record<string, string> = {
  BD: "\ud83c\udde7\ud83c\udde9",
  IN: "\ud83c\uddee\ud83c\uddf3",
  KE: "\ud83c\uddf0\ud83c\uddea",
  UG: "\ud83c\uddfa\ud83c\uddec",
  NG: "\ud83c\uddf3\ud83c\uddec",
  TZ: "\ud83c\uddf9\ud83c\uddff",
  GH: "\ud83c\uddec\ud83c\udded",
  PK: "\ud83c\uddf5\ud83c\uddf0",
  ZA: "\ud83c\uddff\ud83c\udde6",
  EG: "\ud83c\uddea\ud83c\uddec",
};

export default function BillingPage() {
  const { data: countriesData, isLoading } = useGetCountriesQuery();
  const [updateCountry, { isLoading: isSaving }] = useUpdateCountryMutation();

  const countries = countriesData?.data || [];

  const [pricing, setPricing] = useState<
    { id: string; name: string; code: string; currency: string; msgRate: string; callRate: string }[]
  >([]);

  useEffect(() => {
    if (countries.length > 0) {
      setPricing(
        countries.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          currency: c.currency,
          msgRate: String(c.messageCreditPrice),
          callRate: String(c.callCreditPrice),
        }))
      );
    }
  }, [countries]);

  const updateRate = (index: number, field: "msgRate" | "callRate", value: string) => {
    setPricing((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleSave = async () => {
    try {
      const updates = pricing.map((p) =>
        updateCountry({
          id: p.id,
          messageCreditPrice: Number(p.msgRate),
          callCreditPrice: Number(p.callRate),
        }).unwrap()
      );
      await Promise.all(updates);
      toast.success("Pricing updated successfully");
    } catch {
      toast.error("Failed to update pricing");
    }
  };

  const handleReset = () => {
    setPricing(
      countries.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        currency: c.currency,
        msgRate: String(c.messageCreditPrice),
        callRate: String(c.callCreditPrice),
      }))
    );
    toast.info("Pricing reset to database values");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-[#02B2FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Billing Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure per-country credit pricing for messages and calls</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Globe size={16} className="text-[#02B2FF]" />
          <span className="text-sm font-bold text-foreground">Country Pricing</span>
          <span className="text-xs text-muted-foreground ml-auto">{pricing.length} countries</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Currency</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Msg Rate (per credit)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Rate (per credit)</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((row, i) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{FLAGS[row.code] || "\ud83c\uddf3\ud83c\uddf1"}</span>
                    <div>
                      <span className="text-sm font-semibold text-foreground">{row.name}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">({row.code})</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground font-['JetBrains_Mono',monospace]">{row.currency}</td>
                <td className="px-6 py-4">
                  <Input
                    value={row.msgRate}
                    onChange={(e) => updateRate(i, "msgRate", e.target.value)}
                    className="w-28 h-9 text-sm font-['JetBrains_Mono',monospace]"
                  />
                </td>
                <td className="px-6 py-4">
                  <Input
                    value={row.callRate}
                    onChange={(e) => updateRate(i, "callRate", e.target.value)}
                    className="w-28 h-9 text-sm font-['JetBrains_Mono',monospace]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
          {isSaving ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Save size={15} className="mr-2" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isSaving}>
          <RotateCcw size={15} className="mr-2" /> Reset
        </Button>
      </div>
    </div>
  );
}
