"use client";

import { Headphones, CheckCircle2, Clock, Users, ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/shared/kpi-card";
import { useGetSupportStatsQuery, useGetMyTicketsQuery } from "@/features/support/supportApi";

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
  const { data: statsData, isLoading: statsLoading } = useGetSupportStatsQuery({});
  const { data: myTicketsData, isLoading: myTicketsLoading } = useGetMyTicketsQuery({});

  const stats = statsData?.data || {
    totalResolved: 0,
    activeAssigned: 0,
    openUnassigned: 0,
    uniqueListenersServed: 0,
  };

  const myActiveTickets = myTicketsData?.data || [];

  if (statsLoading || myTicketsLoading) return <CustomerCareSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Care Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your support tickets and listener service statistics
          </p>
        </div>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#02B2FF] text-white font-semibold text-sm shadow-md hover:bg-[#029BDC] transition-all"
        >
          <Headphones size={16} />
          Go to Support Inbox
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Resolved Tickets"
          value={String(stats.totalResolved)}
          sub="Support tickets completed"
          icon={<CheckCircle2 size={18} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Running Tickets"
          value={String(stats.activeAssigned)}
          sub="Currently assigned to you"
          icon={<Clock size={18} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Open Queue"
          value={String(stats.openUnassigned)}
          sub="Unassigned tickets waiting"
          icon={<Headphones size={18} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Listeners Served"
          value={String(stats.uniqueListenersServed)}
          sub="Unique listeners helped"
          icon={<Users size={18} className="text-purple-500" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* Quick Access / Active Tickets Overview */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <div>
            <h3 className="text-sm font-bold text-foreground">My Active Support Tickets</h3>
            <p className="text-xs text-muted-foreground">Tickets assigned to you that require attention</p>
          </div>
          <Link href="/support" className="text-xs font-semibold text-[#02B2FF] hover:underline">
            Manage All Tickets →
          </Link>
        </div>

        {myActiveTickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">No running tickets assigned to you right now</p>
            <p className="text-xs text-muted-foreground mt-1">Check the Open Queue in Support Inbox to claim new tickets</p>
            <Link
              href="/support"
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"
            >
              View Open Queue
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {myActiveTickets.slice(0, 5).map((ticket: any) => (
              <div key={ticket._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EFF8FF] text-[#02B2FF] flex items-center justify-center font-bold text-xs">
                    {ticket.ticketId?.slice(-3) || "TKT"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{ticket.ticketId}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        ASSIGNED
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                      {ticket.lastMessage || "Ticket started"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/support"
                  className="px-3 py-1.5 rounded-lg bg-[#EFF8FF] text-[#02B2FF] text-xs font-semibold hover:bg-[#02B2FF]/20 transition-colors"
                >
                  Reply →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
