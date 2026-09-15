"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Loader2,
  Search,
  CreditCard,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useGetCountriesQuery, useUpdateCountryMutation } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetTransactionsQuery } from "@/features/credit/creditApi";
import { useTimezone } from "@/hooks/use-timezone";
import { formatDate } from "@/utils/time-utils";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { TablePagination } from "@/components/shared/table-pagination";

const FLAGS: Record<string, string> = {
  BD: "🇧🇩",
  IN: "🇮🇳",
  KE: "🇰🇪",
  UG: "🇺🇬",
  NG: "🇳🇬",
  TZ: "🇹🇿",
  GH: "🇬🇭",
  PK: "🇵🇰",
  ZA: "🇿🇦",
  EG: "🇪🇬",
};

export default function BillingPage() {
  const timezone = useTimezone();
  const [activeTab, setActiveTab] = useState<"transactions" | "pricing">("transactions");

  // Countries & Partners for filter dropdowns
  const { data: countriesData, isLoading: countriesLoading } = useGetCountriesQuery();
  const { data: partnersData } = useGetPartnersQuery({});
  const [updateCountry, { isLoading: isSaving }] = useUpdateCountryMutation();

  const countries = countriesData?.data || [];
  const partners = partnersData?.data || [];

  // Filter States for Transactions
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Pricing State
  const [pricing, setPricing] = useState<
    { id: string; name: string; code: string; currency: string; msgRate: string; callRate: string }[]
  >([]);

  useEffect(() => {
    if (countries.length > 0) {
      setPricing(
        countries.map((c: any) => ({
          id: c.id || c._id,
          name: c.name,
          code: c.code,
          currency: c.currency || "UGX",
          msgRate: String(c.messageCreditPrice ?? 1),
          callRate: String(c.callCreditPrice ?? 5),
        }))
      );
    }
  }, [countries]);

  const updateRate = (index: number, field: "msgRate" | "callRate", value: string) => {
    setPricing((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleSavePricing = async () => {
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

  const handleResetPricing = () => {
    setPricing(
      countries.map((c: any) => ({
        id: c.id || c._id,
        name: c.name,
        code: c.code,
        currency: c.currency || "UGX",
        msgRate: String(c.messageCreditPrice ?? 1),
        callRate: String(c.callCreditPrice ?? 5),
      }))
    );
  };

  // Transactions Query
  const { data: txData, isLoading: txLoading } = useGetTransactionsQuery({
    search: debouncedSearch || undefined,
    country: countryFilter !== "all" ? countryFilter : undefined,
    partner: partnerFilter !== "all" ? partnerFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    startDate: dateFrom || undefined,
    endDate: dateTo || undefined,
    page,
    limit,
  });

  const transactions = txData?.data || [];
  const meta = txData?.meta || { total: 0, totalPage: 1 };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCountryFilter("all");
    setPartnerFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    countryFilter !== "all" ||
    partnerFilter !== "all" ||
    statusFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} className="mr-1" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Manage Billing & Finances</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track transactions, listener invoices, and country-level pricing models
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 sm:flex-none text-center px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "transactions"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Transactions & Invoices
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex-1 sm:flex-none text-center px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "pricing"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Country Pricing
          </button>
        </div>
      </div>

      {/* TAB 1: TRANSACTIONS & INVOICES */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Filters Card */}
          <Card className="p-4 bg-card border-border shadow-sm">
            <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 w-full sm:min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  placeholder="Search ref, provider, listener..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-9 bg-background w-full"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Country Filter */}
              <div className="w-full sm:w-auto sm:min-w-[140px]">
                <select
                  value={countryFilter}
                  onChange={(e) => {
                    setCountryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
                >
                  <option value="all">All Countries</option>
                  {countries.map((c: any) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name} {FLAGS[c.code] || ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Partner Filter */}
              <div className="w-full sm:w-auto sm:min-w-[140px]">
                <select
                  value={partnerFilter}
                  onChange={(e) => {
                    setPartnerFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
                >
                  <option value="all">All Partners</option>
                  {partners.map((p: any) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-auto sm:min-w-[130px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="admin_granted">Admin Granted</option>
                  <option value="admin_deducted">Admin Deducted</option>
                </select>
              </div>

              {/* Date From */}
              <div className="flex items-center justify-between sm:justify-start gap-1.5 text-xs text-muted-foreground w-full sm:w-auto">
                <span className="shrink-0">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 sm:flex-none h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
                />
              </div>

              {/* Date To */}
              <div className="flex items-center justify-between sm:justify-start gap-1.5 text-xs text-muted-foreground w-full sm:w-auto">
                <span className="shrink-0">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 sm:flex-none h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="w-full sm:w-auto h-9 text-xs gap-1 border-border text-muted-foreground hover:text-foreground justify-center"
                >
                  <RotateCcw size={12} /> Reset
                </Button>
              )}
            </div>
          </Card>

          {/* Transactions Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Date / Time</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Listener / User</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Country</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Reference</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Type & Note</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {txLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#02B2FF]" />
                        Loading transactions...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <CreditCard size={24} className="mx-auto mb-2 text-muted-foreground/60" />
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx: any) => {
                      const isDeduction = tx.type === "admin_deduction" || tx.type === "admin_deduct";
                      const isGrant = tx.type === "admin_grant" || tx.type === "admin_credit";
                      return (
                        <tr key={tx._id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-mono">
                            {formatDate(tx.createdAt, timezone)}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {tx.user?.fullName || tx.user?.phone || tx.msisdn || "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            <span className="mr-1.5">{FLAGS[tx.country?.code] || "🌐"}</span>
                            {tx.country?.name || tx.countryName || "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-foreground">
                            {tx.paymentReference || tx.reference || "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                            <span className="font-semibold text-foreground capitalize mr-1">
                              {tx.type ? tx.type.replace(/_/g, " ") : "Purchase"}
                            </span>
                            {tx.reason && <span className="text-[10px] text-muted-foreground italic">({tx.reason})</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                            <span className={isDeduction ? "text-red-500" : "text-emerald-500"}>
                              {isDeduction ? `-${tx.amount}` : `+${tx.amount}`} Credits
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <StatusBadge label={tx.status || "completed"} variant={sv(tx.status || "completed")} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <TablePagination
              pg={page}
              totalPages={meta.totalPage || 1}
              totalItems={meta.total || 0}
              itemLabel="transactions"
              setPg={(fn) => setPage(fn(page))}
            />
          </div>
        </div>
      )}

      {/* TAB 2: PRICING CONFIGURATION */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Country Credit Rates</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure cost per SMS message and inbound voice call for each regional market
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPricing}
                className="flex-1 sm:flex-none text-xs gap-1 border-border justify-center"
              >
                <RotateCcw size={13} /> Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSavePricing}
                disabled={isSaving}
                className="flex-1 sm:flex-none bg-[#02B2FF] hover:bg-[#029BDC] text-white text-xs font-semibold gap-1 justify-center"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save Pricing
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {countriesLoading ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#02B2FF]" />
                Loading pricing configurations...
              </div>
            ) : (
              pricing.map((p, idx) => (
                <Card key={p.id} className="p-4 bg-card border-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{FLAGS[p.code] || "🌐"}</span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {p.code} · {p.currency}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Message Rate ({p.currency})
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={p.msgRate}
                        onChange={(e) => updateRate(idx, "msgRate", e.target.value)}
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Call Rate ({p.currency})
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={p.callRate}
                        onChange={(e) => updateRate(idx, "callRate", e.target.value)}
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
