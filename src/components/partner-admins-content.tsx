"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Download,
  Plus,
  Search,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  X,
  Loader2,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import {
  useGetPartnersQuery,
  useDeactivatePartnerMutation,
  useReactivatePartnerMutation,
} from "@/features/partner/partnerApi";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { toast } from "sonner";

const PER_PAGE = 8;

export default function PartnerAdminsContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const [viewing, setViewing] = useState<any | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPg(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: partnersData, isLoading, error } = useGetPartnersQuery({
    page: pg,
    limit: PER_PAGE,
    search: debouncedSearch || undefined,
    country: countryFilter || undefined,
    isActive: statusFilter || undefined,
  });
  const { data: countriesData } = useGetCountriesQuery();
  const [deactivatePartner] = useDeactivatePartnerMutation();
  const [reactivatePartner] = useReactivatePartnerMutation();

  const rows = partnersData?.data || [];
  const meta = partnersData?.meta;
  const countries = countriesData?.data || [];

  const total = meta?.total || 0;

  function handleToggleStatus(id: string, currentStatus: string) {
    if (currentStatus === "active") {
      deactivatePartner(id)
        .unwrap()
        .then(() => toast.success("Partner deactivated"))
        .catch(() => toast.error("Failed to deactivate"));
    } else {
      reactivatePartner(id)
        .unwrap()
        .then(() => toast.success("Partner reactivated"))
        .catch(() => toast.error("Failed to reactivate"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-[#02B2FF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-500">Failed to load partners.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
            <Building2 size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Partner Admins</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage all partner administrator accounts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-white hover:bg-muted transition-colors">
            <Download size={14} className="text-muted-foreground" /> Export
          </button>
          <Link
            href="/users/partner-admins/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Partner Admin
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Partners"
          value={String(total)}
          icon={<Building2 size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Active"
          value={String(rows.filter((r: any) => r.status === "active").length)}
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Inactive"
          value={String(rows.filter((r: any) => r.status === "inactive").length)}
          icon={<AlertCircle size={16} className="text-red-400" />}
          iconBg="bg-red-50"
        />
        <KpiCard
          label="Countries"
          value={String(countries.length)}
          icon={<UserPlus size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          <FilterSelect
            value={countryFilter}
            onChange={(v) => { setCountryFilter(v); setPg(1); }}
            options={countries.map((c: any) => ({ value: c.id, label: `${c.name} (${c.code})` }))}
            placeholder="All Countries"
            className="w-48"
          />
          <FilterSelect
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            placeholder="All Status"
            className="w-40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {rows.length} of {total} records
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {meta?.totalPage || 1}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Partner Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Contact Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Country
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Phone
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Created
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No partners found.
                  </td>
                </tr>
              ) : (
                rows.map((row: any) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={row.name?.charAt(0) || "P"} size="sm" />
                        <span className="text-xs font-semibold text-foreground">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.contactEmail || "-"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground">
                        {typeof row.country === "object" ? row.country?.name : countries.find((c: any) => c.id === row.country)?.name || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.contactPhone || "-"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={row.status === "active" ? "Active" : "Inactive"}
                        variant={sv(row.status === "active" ? "Active" : "Inactive")}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewing(row)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(row.id, row.status)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            row.status === "active"
                              ? "hover:bg-red-50 text-muted-foreground hover:text-red-500"
                              : "hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"
                          }`}
                          title={row.status === "active" ? "Deactivate" : "Reactivate"}
                        >
                          {row.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          pg={pg}
          totalPages={meta?.totalPage || 1}
          totalItems={total}
          itemLabel="records"
          setPg={setPg}
        />
      </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar initials={viewing.name?.charAt(0) || "P"} />
                <div>
                  <div className="text-sm font-bold text-foreground">{viewing.name}</div>
                  <div className="text-xs text-muted-foreground">{viewing.contactEmail || "No email"}</div>
                </div>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Partner Name</div>
                <div className="text-sm font-medium text-foreground">{viewing.name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contact Email</div>
                <div className="text-sm font-medium text-foreground">{viewing.contactEmail || "-"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div>
                <div className="text-sm font-medium text-foreground">
                  {typeof viewing.country === "object" ? viewing.country?.name : countries.find((c: any) => c.id === viewing.country)?.name || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone</div>
                <div className="text-sm font-medium text-foreground">{viewing.contactPhone || "-"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
                <StatusBadge
                  label={viewing.status === "active" ? "Active" : "Inactive"}
                  variant={sv(viewing.status === "active" ? "Active" : "Inactive")}
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created</div>
                <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">
                  {new Date(viewing.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
