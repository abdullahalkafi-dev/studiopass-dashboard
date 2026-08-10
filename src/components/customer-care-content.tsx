"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Headphones,
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
import { StatusBadge, sv, Avatar } from "@/components/shared/section-header";
import { useRole } from "@/contexts/role-context";
import {
  useGetCustomerCareUsersQuery,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useUpdateUserMutation,
  useCreateCustomerCareAgentMutation,
} from "@/features/user/userApi";
import { useGetCountriesQuery } from "@/features/country/countryApi";
import { ViewUserDetailsModal } from "@/components/modals/view-user-details-modal";
import { ImageLightboxModal } from "@/components/modals/image-lightbox-modal";
import { resolveUrl } from "@/lib/utils";
import usersData from "@/mock/users.json";
import { toast } from "sonner";

type CustomerCare = (typeof usersData.customerCare)[number];

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda", "South Africa", "Ethiopia"];

const PER_PAGE = 8;

export default function CustomerCareContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const showCountry = isSuperAdmin;

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pg, setPg] = useState(1);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // Create Agent Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFullName, setCreateFullName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createScopeType, setCreateScopeType] = useState<"global" | "country">("global");
  const [createCountryId, setCreateCountryId] = useState("");

  const { data: countriesData } = useGetCountriesQuery();
  const [createAgent, { isLoading: isCreating }] = useCreateCustomerCareAgentMutation();

  const [deactivateUser] = useDeactivateUserMutation();
  const [reactivateUser] = useReactivateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createAgent({
        fullName: createFullName,
        username: createUsername,
        email: createEmail || undefined,
        phone: createPhone || undefined,
        password: createPassword,
        scopeType: createScopeType,
        countryId: createScopeType === "country" ? createCountryId : undefined,
      });

      if ("error" in res) {
        const errData = res.error as any;
        toast.error(errData?.data?.message || "Failed to create Customer Care agent");
        return;
      }

      toast.success(`Customer Care agent ${createFullName} created successfully!`);
      setCreateModalOpen(false);
      setCreateFullName("");
      setCreateUsername("");
      setCreateEmail("");
      setCreatePhone("");
      setCreatePassword("");
      setCreateScopeType("global");
      setCreateCountryId("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create agent");
    }
  };

  const handleStartEdit = (row: any) => {
    setEditing(row);
    setEditFullName(row.name || "");
    setEditEmail(row.email === "N/A" ? "" : row.email || "");
    setEditPhone(row.phone === "N/A" ? "" : row.phone || "");
    setEditPassword("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload: any = {
        id: editing.id,
        fullName: editFullName,
        email: editEmail || undefined,
        phone: editPhone || undefined,
      };
      if (editPassword) {
        payload.password = editPassword;
      }
      const res = await updateUser(payload);
      if ("error" in res) {
        const errData = res.error as any;
        toast.error(errData?.data?.message || errData?.message || "Failed to update customer care agent");
        return;
      }
      toast.success(`${editFullName} updated successfully`);
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update customer care agent");
    }
  };

  const { data: apiData, isLoading } = useGetCustomerCareUsersQuery({
    page: pg,
    limit: PER_PAGE,
    search: search || undefined,
    country: countryFilter || undefined,
    isActive: statusFilter === "Active" ? "true" : statusFilter === "Inactive" ? "false" : undefined,
  });

  const rawRows = apiData?.data || [];
  const meta = apiData?.meta;

  const rows = rawRows.map((u: any) => ({
    id: u._id || u.id,
    name: u.fullName || u.name || "Customer Care Agent",
    email: u.email || "N/A",
    phone: u.phone || "N/A",
    country: u.countryName || u.country || "N/A",
    status: u.isBlocked ? "Inactive" : "Active",
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "2026-01-01",
    resolvedTickets: u.resolvedTickets ?? 0,
    openTickets: u.openTickets ?? 0,
  }));

  const total = meta?.total ?? rows.length;
  const active = meta?.activeTotal ?? rows.filter((r: any) => r.status === "Active").length;
  const inactive = meta?.inactiveTotal ?? (total - active);

  const filtered = rows;
  const totalPgs = meta?.totalPage || Math.max(1, Math.ceil(total / PER_PAGE));
  const paged = filtered;

  const colCount = (showCountry ? 1 : 0) + 5;

  async function toggleStatus(id: string, currentStatus: string) {
    try {
      if (currentStatus === "Active") {
        await deactivateUser(id).unwrap();
        toast.success("User deactivated successfully");
      } else {
        await reactivateUser(id).unwrap();
        toast.success("User activated successfully");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update user status");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <Headphones size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Customer Care</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage customer care representative accounts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors">
            <Download size={14} className="text-muted-foreground" /> Export
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} /> Add Customer Care
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Customer Care"
          value={String(total)}
          icon={<Headphones size={16} className="text-rose-500" />}
          iconBg="bg-rose-50"
          trend={{ val: "+1 this month", up: true }}
        />
        <KpiCard
          label="Active"
          value={String(active)}
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Inactive"
          value={String(inactive)}
          icon={<AlertCircle size={16} className="text-red-400" />}
          iconBg="bg-red-50"
        />
        <KpiCard
          label="New This Month"
          value="1"
          icon={<UserPlus size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
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
              placeholder="Search customer care..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPg(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showCountry && (
            <div className="w-44">
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setPg(1);
                }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
          <div className="w-44">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPg(1);
              }}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} records
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Email
                </th>
                {showCountry && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Country
                  </th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Created Date
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                paged.map((row: any) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={row.avatar}
                          initials={row.name?.charAt(0) || "C"}
                          size="sm"
                          onClick={() => {
                            if (row.avatar) {
                              const resolved = resolveUrl(row.avatar);
                              if (resolved) setLightboxSrc(resolved);
                            }
                          }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{row.email}</span>
                    </td>
                    {/* Country */}
                    {showCountry && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">
                          {row.country}
                        </span>
                      </td>
                    )}
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge label={row.status} variant={sv(row.status)} />
                    </td>
                    {/* Created Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                        {row.created}
                      </span>
                    </td>
                    {/* Actions */}
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
                          onClick={() => handleStartEdit(row)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleStatus(row.id, row.status)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            row.status === "Active"
                              ? "hover:bg-red-50 text-muted-foreground hover:text-red-500"
                              : "hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"
                          }`}
                          title={row.status === "Active" ? "Deactivate" : "Activate"}
                        >
                          {row.status === "Active" ? (
                            <UserX size={14} />
                          ) : (
                            <UserCheck size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {filtered.length} total records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPg((p) => Math.max(1, p - 1))}
              disabled={pg === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPgs) }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  onClick={() => setPg(n)}
                  className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                    pg === n
                      ? "bg-[#02B2FF] text-white"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setPg((p) => Math.min(totalPgs, p + 1))}
              disabled={pg === totalPgs}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ViewUserDetailsModal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        data={viewing}
        title="Customer Care Agent Profile"
      />

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-popover rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <Edit2 size={16} className="text-[#02B2FF]" />
                Edit Customer Care Agent
              </div>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div className="pt-2 border-t border-border">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  New Password <span className="text-xs text-muted-foreground font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#02B2FF] hover:bg-[#00A0E8] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdating && <Loader2 size={14} className="animate-spin" />}
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Customer Care Agent Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Headphones size={18} className="text-[#02B2FF]" />
                <h3 className="font-bold text-foreground">Create Customer Care Agent</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Username (Login Credential)<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. agent_sarah or sarah_support"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="sarah@studiopass.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+254 712345678"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Password<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                />
              </div>

              {/* Scope Selection: Global vs Country */}
              <div className="p-3.5 bg-muted/40 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-foreground">
                  Access Scope<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setCreateScopeType("global")}
                    className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex flex-col gap-1 transition-all ${
                      createScopeType === "global"
                        ? "border-[#02B2FF] bg-[#02B2FF]/10 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <span className="font-bold text-foreground">Global Scope</span>
                    <span className="text-[10px] opacity-80">Access to all data & support tickets across all countries</span>
                  </label>

                  <label
                    onClick={() => setCreateScopeType("country")}
                    className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex flex-col gap-1 transition-all ${
                      createScopeType === "country"
                        ? "border-[#02B2FF] bg-[#02B2FF]/10 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <span className="font-bold text-foreground">Country-Wise Scope</span>
                    <span className="text-[10px] opacity-80">Access restricted to assigned country data & tickets</span>
                  </label>
                </div>

                {createScopeType === "country" && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Assigned Country<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select
                      value={createCountryId}
                      onChange={(e) => setCreateCountryId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF]"
                    >
                      <option value="">Select country...</option>
                      {(countriesData?.data || countriesData || []).map((c: any) => (
                        <option key={c._id || c.id} value={c._id || c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#02B2FF] hover:bg-[#00A0E8] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreating && <Loader2 size={14} className="animate-spin" />}
                  {isCreating ? "Creating..." : "Create Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ImageLightboxModal
        isOpen={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
        src={lightboxSrc}
      />
    </div>
  );
}
