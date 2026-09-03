"use client";

import { useState, useEffect } from "react";
import { X, Filter, RotateCcw, Check, Calendar, Globe, Building2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { useGetPartnersQuery } from "@/features/partner/partnerApi";
import { useGetStationsQuery } from "@/features/station/stationApi";

interface DashboardFilterModalProps {
  open: boolean;
  onClose: () => void;
  role: string;
  currentFilters: {
    country?: string;
    partnerId?: string;
    stationId?: string;
    startDate?: string;
    endDate?: string;
    dateRange?: string;
  };
  onApply: (filters: {
    country?: string;
    partnerId?: string;
    stationId?: string;
    startDate?: string;
    endDate?: string;
    dateRange?: string;
  }) => void;
}

export function DashboardFilterModal({
  open,
  onClose,
  role,
  currentFilters,
  onApply,
}: DashboardFilterModalProps) {
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";

  const [country, setCountry] = useState(currentFilters.country || "all");
  const [partnerId, setPartnerId] = useState(currentFilters.partnerId || "all");
  const [stationId, setStationId] = useState(currentFilters.stationId || "all");
  const [dateRange, setDateRange] = useState(currentFilters.dateRange || "all");
  const [startDate, setStartDate] = useState(currentFilters.startDate || "");
  const [endDate, setEndDate] = useState(currentFilters.endDate || "");

  // Sync state when opened
  useEffect(() => {
    if (open) {
      setCountry(currentFilters.country || "all");
      setPartnerId(currentFilters.partnerId || "all");
      setStationId(currentFilters.stationId || "all");
      setDateRange(currentFilters.dateRange || "all");
      setStartDate(currentFilters.startDate || "");
      setEndDate(currentFilters.endDate || "");
    }
  }, [open, currentFilters]);

  // Cascading queries
  const { data: countriesData } = useGetCountriesQuery(undefined, { skip: !isSuperAdmin });
  const { data: partnersData } = useGetPartnersQuery(
    country !== "all" ? { country } : {},
    { skip: !isSuperAdmin }
  );
  const { data: stationsData } = useGetStationsQuery(
    {
      partner: partnerId !== "all" ? partnerId : undefined,
      country: country !== "all" ? country : undefined,
      limit: 100,
    },
    { skip: !isSuperAdmin && !isPartnerAdmin }
  );

  const countries = countriesData?.data || [];
  const partners = partnersData?.data || [];
  const stations = stationsData?.data || [];

  if (!open) return null;

  const handleReset = () => {
    setCountry("all");
    setPartnerId("all");
    setStationId("all");
    setDateRange("all");
    setStartDate("");
    setEndDate("");
  };

  const handleApply = () => {
    onApply({
      country: country !== "all" ? country : undefined,
      partnerId: partnerId !== "all" ? partnerId : undefined,
      stationId: stationId !== "all" ? stationId : undefined,
      dateRange: dateRange !== "all" ? dateRange : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#02B2FF]/10 text-[#02B2FF]">
              <Filter size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Advanced Dashboard Filters</h2>
              <p className="text-xs text-muted-foreground">Scope metrics, charts, and operational views</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Fields */}
        <div className="space-y-4 text-xs">
          {/* Country (Super Admin only) */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Globe size={13} className="text-[#02B2FF]" /> Country Scope
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setPartnerId("all");
                  setStationId("all");
                }}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              >
                <option value="all">Global (All Countries)</option>
                {countries.map((c: any) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Partner (Super Admin only) */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Building2 size={13} className="text-violet-500" /> Partner Organization
              </label>
              <select
                value={partnerId}
                onChange={(e) => {
                  setPartnerId(e.target.value);
                  setStationId("all");
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
          )}

          {/* Station (Super Admin & Partner Admin) */}
          {(isSuperAdmin || isPartnerAdmin) && (
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Radio size={13} className="text-emerald-500" /> Target Station
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              >
                <option value="all">All Stations</option>
                {stations.map((st: any) => (
                  <option key={st.id || st._id} value={st.id || st._id}>
                    {st.name} ({st.type?.toUpperCase() || "STATION"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Presets */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar size={13} className="text-amber-500" /> Date Preset Range
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "today", label: "Today" },
                { id: "7days", label: "7 Days" },
                { id: "30days", label: "30 Days" },
                { id: "month", label: "This Month" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (dateRange === preset.id) {
                      setDateRange("all");
                    } else {
                      setDateRange(preset.id);
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
                    dateRange === preset.id
                      ? "border-[#02B2FF] bg-[#02B2FF]/10 text-[#02B2FF]"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground">Custom Date Range (From - To)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRange("all");
                }}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRange("all");
                }}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#02B2FF]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs border-border gap-1"
          >
            <RotateCcw size={12} /> Reset to Default
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="bg-[#02B2FF] hover:bg-[#029BDC] text-white text-xs font-semibold gap-1 shadow-sm"
            >
              <Check size={14} /> Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
