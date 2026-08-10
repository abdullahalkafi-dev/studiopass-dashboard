"use client";

import Link from "next/link";
import { ArrowLeft, Eye, FileText, Image, Loader2 } from "lucide-react";
import { useGetStatusByIdQuery } from "@/features/status/statusApi";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

export default function StatusPerformanceDetails({ id }: { id: string }) {
  const timezone = useTimezone();
  const { data, isLoading, error } = useGetStatusByIdQuery(id);
  const post = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/campaigns/status-performance" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Performance
        </Link>
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <Link href="/campaigns/status-performance" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Performance
        </Link>
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-foreground">Post not found</p>
        </div>
      </div>
    );
  }

  const isActive = new Date(post.expiresAt) > new Date();
  const hasMedia = !!post.media;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/campaigns/status-performance" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back to Performance
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Campaign Performance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance details for this status post</p>
      </div>

      {/* Summary Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden max-w-2xl">
        <div className="px-6 py-4 border-b border-border">
          <div className="text-sm font-bold text-foreground line-clamp-2">{post.content}</div>
          <div className="text-xs text-muted-foreground mt-1">{post.type === "auto_weekly_top_fans" ? "Auto Weekly Top Fans" : "Manual Post"}</div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="px-6 py-4 text-center">
            <div className="text-2xl font-bold font-['JetBrains_Mono',monospace] text-foreground">{(post.viewCount || 0).toLocaleString()}</div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">Total Views</div>
          </div>
          <div className="px-6 py-4 text-center">
            <div className="text-2xl font-bold font-['JetBrains_Mono',monospace] text-foreground">
              {hasMedia ? "Image" : "Text"}
            </div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">Content Type</div>
          </div>
          <div className="px-6 py-4 text-center">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isActive ? "text-emerald-700 bg-emerald-50" : "text-muted-foreground bg-muted"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
              {isActive ? "Active" : "Expired"}
            </span>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">Status</div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created</div>
            <div className="text-sm font-semibold text-foreground">{post.createdAt ? formatDate(post.createdAt, timezone) : "—"}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Expires</div>
            <div className="text-sm font-semibold text-foreground">{post.expiresAt ? formatDate(post.expiresAt, timezone) : "—"}</div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <Link href="/campaigns/status-performance"
        className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors">
        <ArrowLeft size={14} /> Back to Performance
      </Link>
    </div>
  );
}
