"use client";

import { Users, FileText, MessageSquare, Phone, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/shared/kpi-card";
import { useGetListenersQuery } from "@/features/crm/crmApi";
import { useGetStatementKPIsQuery } from "@/features/statement/statementApi";

function CustomerCareSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-xl animate-pulse" />
    </div>
  );
}

export default function CustomerCareDashboard() {
  const { data: listenersData, isLoading: listenersLoading } = useGetListenersQuery({ page: 1, limit: 10 });
  const { data: kpiData } = useGetStatementKPIsQuery({});

  const listeners = listenersData?.data || [];
  const totalListeners = listenersData?.meta?.total ?? listeners.length;

  if (listenersLoading) return <CustomerCareSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customer Care Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage listener issues and support requests
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Listeners"
          value={String(totalListeners)}
          sub="Registered listeners"
          icon={<Users size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Interactions"
          value={String(kpiData?.data?.totalInteractions ?? 0)}
          sub="Total interactions"
          icon={<MessageSquare size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Messages"
          value={String(kpiData?.data?.totalMessages ?? 0)}
          sub="Listener messages"
          icon={<FileText size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Calls"
          value={String(kpiData?.data?.totalCalls ?? 0)}
          sub="Listener calls"
          icon={<Phone size={16} className="text-rose-500" />}
          iconBg="bg-rose-50"
        />
      </div>

      {/* Recent Listeners */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <p className="text-sm font-bold text-foreground">Recent Listeners</p>
          <Link href="/crm" className="text-xs font-semibold text-[#02B2FF] hover:underline">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {listeners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No listeners found.
                  </td>
                </tr>
              ) : (
                listeners.map((listener: any) => (
                  <tr key={listener._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-foreground">{listener.fullName || "Unknown"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{listener.phone || "N/A"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground">{listener.countryName || "N/A"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        listener.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {listener.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link href={`/crm/${listener._id}`} className="w-7 h-7 rounded-lg inline-flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all">
                        <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/crm" className="bg-card rounded-xl border border-border shadow-sm p-4 hover:border-[#02B2FF]/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center group-hover:bg-[#02B2FF]/10 transition-colors">
              <Users size={18} className="text-[#02B2FF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">CRM</p>
              <p className="text-[10px] text-muted-foreground">Manage listeners</p>
            </div>
          </div>
        </Link>
        <Link href="/listener-statement" className="bg-card rounded-xl border border-border shadow-sm p-4 hover:border-[#02B2FF]/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center group-hover:bg-[#02B2FF]/10 transition-colors">
              <FileText size={18} className="text-[#02B2FF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Statements</p>
              <p className="text-[10px] text-muted-foreground">View listener statements</p>
            </div>
          </div>
        </Link>
        <Link href="/messages" className="bg-card rounded-xl border border-border shadow-sm p-4 hover:border-[#02B2FF]/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center group-hover:bg-[#02B2FF]/10 transition-colors">
              <MessageSquare size={18} className="text-[#02B2FF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Messages</p>
              <p className="text-[10px] text-muted-foreground">View all messages</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
