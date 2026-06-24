"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { FilterSelect } from "@/components/shared/filter-select";

interface Statement {
  id: string;
  listenerName: string;
  phone: string;
  station: string;
  show: string;
  statement: string;
  submittedTime: string;
  status: "New" | "Replied" | "Pending";
}

const MOCK_STATEMENTS: Statement[] = [
  { id: "ST-001", listenerName: "Grace Njeri", phone: "+254700111222", station: "Radio One FM", show: "Morning Drive", statement: "The morning show with James has changed my daily routine. I now wake up earlier just to catch it. Keep the positive energy flowing!", submittedTime: "2026-06-12 07:05 AM", status: "New" },
  { id: "ST-002", listenerName: "Henry Odhiambo", phone: "+254700333444", station: "Radio One FM", show: "Morning Drive", statement: "I would like to suggest that the show includes more interactive segments with listeners.", submittedTime: "2026-06-12 07:40 AM", status: "Replied" },
  { id: "ST-003", listenerName: "Irene Mutua", phone: "+254700555666", station: "Radio One FM", show: "Morning Drive", statement: "James Doe is by far the best morning show presenter in Kenya!", submittedTime: "2026-06-12 08:15 AM", status: "Replied" },
  { id: "ST-004", listenerName: "Joseph Kariuki", phone: "+254700777888", station: "Radio One FM", show: "Morning Drive", statement: "I'd love to hear more gospel music especially during the morning show.", submittedTime: "2026-06-12 08:50 AM", status: "Replied" },
  { id: "ST-005", listenerName: "Karen Achieng", phone: "+254700999000", station: "Radio One FM", show: "Morning Drive", statement: "The Morning Drive show consistently delivers great content. Thank you for making my mornings better!", submittedTime: "2026-06-12 09:10 AM", status: "New" },
];

export default function PresenterStatementsContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewing, setViewing] = useState<Statement | null>(null);

  const filtered = MOCK_STATEMENTS.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.listenerName.toLowerCase().includes(q) && !s.station.toLowerCase().includes(q)) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Listener Statements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View listener statements related to your assigned show.
        </p>
      </div>

      <hr className="border-border" />

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search listener or station..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "New", label: "New" },
            { value: "Replied", label: "Replied" },
            { value: "Pending", label: "Pending" },
          ]}
          placeholder="All Status"
          className="w-40"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Listener Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statement</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submitted Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">No statements found.</td>
                </tr>
              ) : (
                filtered.map((stmt) => (
                  <tr key={stmt.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-foreground">{stmt.listenerName}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground truncate max-w-xs block">{stmt.statement}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{stmt.submittedTime}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={stmt.status} variant={sv(stmt.status === "New" ? "Pending" : stmt.status === "Pending" ? "Inactive" : "Active")} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setViewing(stmt)}
                        className="inline-flex items-center rounded-lg border border-[#02B2FF] px-4 py-1.5 text-xs font-semibold text-[#02B2FF] hover:bg-[#EFF8FF] transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel (slide-out) */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Statement Details</h2>
              <button onClick={() => setViewing(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              {/* Info grid */}
              <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Listener Name</span>
                  <span className="text-xs font-semibold text-foreground">{viewing.listenerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Phone Number</span>
                  <span className="text-xs font-semibold text-foreground">{viewing.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Station</span>
                  <span className="text-xs font-semibold text-foreground">{viewing.station}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Show Name</span>
                  <span className="text-xs font-semibold text-foreground">{viewing.show}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Submitted Time</span>
                  <span className="text-xs font-semibold text-foreground font-['JetBrains_Mono',monospace]">{viewing.submittedTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <StatusBadge label={viewing.status} variant={sv(viewing.status === "New" ? "Pending" : viewing.status === "Pending" ? "Inactive" : "Active")} />
                </div>
              </div>

              {/* Statement Content */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">Statement Content</label>
                <div className="rounded-lg border bg-muted/20 p-4 text-sm text-foreground leading-relaxed">{viewing.statement}</div>
              </div>
            </div>

            {/* Close */}
            <div className="px-6 py-4 border-t border-border">
              <button
                onClick={() => setViewing(null)}
                className="w-full rounded-lg border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
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
