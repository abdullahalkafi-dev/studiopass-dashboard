"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Database,
  Download,
  Search,
  Eye,
  Users,
  MessageSquare,
  Phone,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import { useGetListenersQuery } from "@/features/crm/crmApi";

const PER_PAGE = 20;

export default function CrmContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const showCountry = isSuperAdmin;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);

  const { data, isLoading } = useGetListenersQuery({
    page: pg,
    limit: PER_PAGE,
    search: debouncedSearch || undefined,
    isActive: statusFilter || undefined,
    country: countryFilter || undefined,
  });

  const listeners = data?.data || [];
  const meta = data?.meta;
  const total = meta?.total || 0;
  const totalPgs = meta?.totalPage || 1;

  const activeCount = listeners.filter((l: any) => !l.isBlocked).length;
  const inactiveCount = listeners.filter((l: any) => l.isBlocked).length;

  const colCount = (showCountry ? 1 : 0) + 6;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
            <Database size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CRM</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage listener profiles and interaction history across the platform.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
          <Download size={14} /> Export CRM Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Listeners"
          value={String(total)}
          sub="All registered listeners"
          icon={<Users size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Active Listeners"
          value={String(activeCount)}
          sub="Active accounts"
          icon={<TrendingUp size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Inactive Listeners"
          value={String(inactiveCount)}
          sub="Blocked accounts"
          icon={<Users size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Total Messages"
          value="—"
          sub="Coming soon"
          icon={<MessageSquare size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, or country..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPg(1);
                clearTimeout((window as any).__crmSearchTimer);
                (window as any).__crmSearchTimer = setTimeout(() => setDebouncedSearch(e.target.value), 300);
              }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showCountry && (
            <FilterSelect
              value={countryFilter}
              onChange={(v) => { setCountryFilter(v); setPg(1); }}
              options={[]}
              placeholder="All Countries"
              className="w-40"
            />
          )}
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
            {isLoading ? "Loading..." : `Showing ${listeners.length} of ${total} listeners`}
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</th>
                {showCountry && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calls</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Registered</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : listeners.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No listeners found.
                  </td>
                </tr>
              ) : (
                listeners.map((row: any) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={row.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "L"} size="sm" />
                        <span className="text-xs font-semibold text-foreground">{row.fullName || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground font-['JetBrains_Mono',monospace]">{row.phone || "—"}</span>
                    </td>
                    {showCountry && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">🌍</span>
                          <span className="text-xs text-muted-foreground">{row.countryName || "—"}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={12} className="text-violet-400" />
                        <span className="text-xs font-medium text-foreground">—</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-400" />
                        <span className="text-xs font-medium text-foreground">—</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge
                        label={row.isBlocked ? "Inactive" : "Active"}
                        variant={sv(row.isBlocked ? "Inactive" : "Active")}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/crm/${row.id}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="View"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={totalPgs} totalItems={total} itemLabel="listeners" setPg={setPg} />
      </div>
    </div>
  );
}
