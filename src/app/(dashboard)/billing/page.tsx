"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RotateCcw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CountryPricing {
  country: string;
  flag: string;
  currency: string;
  msgRate: string;
  callRate: string;
}

const INITIAL_PRICING: CountryPricing[] = [
  { country: "Kenya", flag: "🇰🇪", currency: "KES", msgRate: "0.50", callRate: "1.20" },
  { country: "Uganda", flag: "🇺🇬", currency: "UGX", msgRate: "200", callRate: "500" },
  { country: "Ghana", flag: "🇬🇭", currency: "GHS", msgRate: "0.80", callRate: "2.00" },
  { country: "Tanzania", flag: "🇹🇿", currency: "TZS", msgRate: "300", callRate: "750" },
  { country: "Nigeria", flag: "🇳🇬", currency: "NGN", msgRate: "50", callRate: "120" },
];

export default function BillingPage() {
  const [pricing, setPricing] = useState(INITIAL_PRICING);

  const updateRate = (index: number, field: "msgRate" | "callRate", value: string) => {
    setPricing((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleSave = () => toast.success("Pricing saved successfully");
  const handleReset = () => { setPricing(INITIAL_PRICING); toast.info("Pricing reset to defaults"); };

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Billing Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure pricing, charges, and revenue sharing</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Globe size={16} className="text-[#02B2FF]" />
          <span className="text-sm font-bold text-foreground">Country Pricing</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Currency</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Msg Rate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Rate</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((row, i) => (
              <tr key={row.country} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{row.flag}</span>
                    <span className="text-sm font-semibold text-foreground">{row.country}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground font-['JetBrains_Mono',monospace]">{row.currency}</td>
                <td className="px-6 py-4">
                  <Input
                    value={row.msgRate}
                    onChange={(e) => updateRate(i, "msgRate", e.target.value)}
                    className="w-24 h-9 text-sm font-['JetBrains_Mono',monospace]"
                  />
                </td>
                <td className="px-6 py-4">
                  <Input
                    value={row.callRate}
                    onChange={(e) => updateRate(i, "callRate", e.target.value)}
                    className="w-24 h-9 text-sm font-['JetBrains_Mono',monospace]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} className="bg-[#02B2FF] hover:bg-[#0190D0] text-white">
          <Save size={15} className="mr-2" /> Save Changes
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw size={15} className="mr-2" /> Reset
        </Button>
      </div>
    </div>
  );
}
