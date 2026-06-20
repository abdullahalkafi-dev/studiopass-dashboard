"use client";

import Link from "next/link";
import { useRole } from "@/contexts/role-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, sv } from "@/components/shared/section-header";
import { ArrowLeft, Eye, Activity, FileText, Megaphone } from "lucide-react";

type CampaignPost = {
  id: string;
  title: string;
  station: string;
  country: string;
  contentType: "Image" | "Text";
  content: string;
  duration: string;
  views: number;
  status: "Active" | "Expired";
  created: string;
};

const POSTS: CampaignPost[] = [
  { id:"CP-00148", title:"Ramadan Greetings 2024",      station:"Capital FM Kenya", country:"Kenya",    contentType:"Image", content:"Wishing all listeners a blessed Ramadan! Tune in for special programming throughout the holy month.", duration:"All Time", views:28400, status:"Active",   created:"2024-06-01" },
  { id:"CP-00147", title:"Morning Drive Promo",         station:"Radio Uganda",     country:"Uganda",   contentType:"Text",  content:"Start your day right with the Morning Drive show. Live from 6AM to 9AM every weekday!", duration:"72 Hours",  views:12100, status:"Active",   created:"2024-06-10" },
  { id:"CP-00146", title:"Joy FM Birthday Bash",        station:"Joy FM Ghana",     country:"Ghana",    contentType:"Image", content:"Celebrate 25 years of Joy FM! Join us for a massive birthday concert this weekend.", duration:"48 Hours",  views:9800,  status:"Expired",  created:"2024-05-28" },
  { id:"CP-00145", title:"Citizen TV News Special",     station:"Citizen TV",       country:"Kenya",    contentType:"Text",  content:"Breaking coverage of the national elections. Stay tuned to Citizen TV for live updates.", duration:"24 Hours",  views:41200, status:"Expired",  created:"2024-05-20" },
  { id:"CP-00144", title:"Hot 96 Summer Vibes",         station:"Hot 96",           country:"Tanzania", contentType:"Image", content:"The hottest summer playlist is here! Request your favourite songs every evening from 8PM.", duration:"All Time", views:15600, status:"Active",   created:"2024-06-05" },
  { id:"CP-00143", title:"Peace FM Community Hour",     station:"Peace FM",         country:"Ghana",    contentType:"Text",  content:"Listen in for our Community Hour where local heroes share their stories every Saturday at 2PM.", duration:"72 Hours",  views:6200,  status:"Active",   created:"2024-06-12" },
  { id:"CP-00142", title:"NTV Uganda Sports Update",    station:"NTV Uganda",       country:"Uganda",   contentType:"Image", content:"Live AFCON qualifiers coverage every match day. Don't miss a single goal!", duration:"48 Hours",  views:18900, status:"Expired",  created:"2024-05-15" },
  { id:"CP-00141", title:"Capital FM Breakfast",        station:"Capital FM Kenya", country:"Kenya",    contentType:"Text",  content:"Kenya's number one breakfast show returns bigger and better. Competitions, news and great music.", duration:"24 Hours",  views:22300, status:"Active",   created:"2024-06-14" },
  { id:"CP-00140", title:"Radio Uganda Independence",   station:"Radio Uganda",     country:"Uganda",   contentType:"Image", content:"Celebrating Uganda's Independence Day with 24 hours of patriotic programming and live concerts.", duration:"All Time", views:31000, status:"Expired",  created:"2024-05-05" },
  { id:"CP-00139", title:"JoyFM Health Week",           station:"Joy FM Ghana",     country:"Ghana",    contentType:"Text",  content:"Join us this week as we discuss mental health, nutrition, and wellness with top doctors.", duration:"72 Hours",  views:8400,  status:"Expired",  created:"2024-05-10" },
  { id:"CP-00138", title:"Hot 96 New Year Party",       station:"Hot 96",           country:"Tanzania", contentType:"Image", content:"The biggest New Year countdown party in Dar es Salaam! Tune in for live DJ sets.", duration:"12 Hours",  views:44100, status:"Expired",  created:"2024-01-01" },
  { id:"CP-00137", title:"Citizen TV Debate Night",     station:"Citizen TV",       country:"Kenya",    contentType:"Text",  content:"Live presidential debate streaming. Who will win your vote? Watch and decide tonight.", duration:"12 Hours",  views:62000, status:"Expired",  created:"2024-04-18" },
  { id:"CP-00136", title:"Peace FM Ramadan Special",    station:"Peace FM",         country:"Ghana",    contentType:"Image", content:"Special Ramadan programming with Quran recitations, prayers and community messages.", duration:"All Time", views:11200, status:"Active",   created:"2024-06-02" },
  { id:"CP-00135", title:"Capital FM Traffic Alerts",   station:"Capital FM Kenya", country:"Kenya",    contentType:"Text",  content:"Real-time traffic updates for Nairobi. We keep you moving, every morning and evening.", duration:"All Time", views:19800, status:"Active",   created:"2024-05-25" },
  { id:"CP-00134", title:"NTV Sports Gala",             station:"NTV Uganda",       country:"Uganda",   contentType:"Image", content:"Annual Sports Awards live from Kampala. Vote for your favourite athlete of the year.", duration:"48 Hours",  views:14300, status:"Expired",  created:"2024-04-30" },
];

function formatViews(n: number): string {
  return n.toLocaleString("en-US");
}

function getDurationHours(d: string): number {
  if (d === "All Time") return 720;
  return parseInt(d) || 24;
}

export default function StatusPerformanceDetails({ id }: { id: string }) {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const showCountry = isSuperAdmin;

  const post = POSTS.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="space-y-6">
        <Link href="/campaigns/status-performance" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Status Performance
        </Link>
        <div className="text-center py-12 text-muted-foreground text-sm">Campaign not found.</div>
      </div>
    );
  }

  const hours = getDurationHours(post.duration);
  const avgViewsPerHour = Math.round(post.views / hours);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/campaigns/status-performance"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors"
      >
        <ArrowLeft size={13} /> Back to Status Performance
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Campaign Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Performance overview for: {post.title}
        </p>
      </div>

      {/* Campaign Summary Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Megaphone size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{post.title}</h2>
              <p className="text-sm text-muted-foreground">
                {post.station} · {post.country} · {post.duration}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground font-['JetBrains_Mono',monospace]">
              {formatViews(post.views)}
            </div>
            <div className="text-xs text-muted-foreground">total views</div>
            <div className="mt-1">
              <StatusBadge label={post.status} variant={sv(post.status)} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Total Views"
          value={formatViews(post.views)}
          sub="All-time views"
          icon={<Eye size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Avg Views/HR"
          value={formatViews(avgViewsPerHour)}
          sub="Estimated rate"
          icon={<Activity size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content Type</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50">
              <FileText size={16} className="text-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{post.contentType}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Duration: {post.duration}</div>
          </div>
        </div>
      </div>

      {/* Campaign Information */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campaign Information</span>
        </div>
        <div className="grid grid-cols-2">
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Campaign Title</div>
            <div className="text-sm font-medium text-foreground">{post.title}</div>
          </div>
          <div className="px-5 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Station</div>
            <div className="text-sm font-medium text-foreground">{post.station}</div>
          </div>
          {showCountry && (
            <div className="px-5 py-4 border-b border-r border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div>
              <div className="text-sm font-medium text-foreground">{post.country}</div>
            </div>
          )}
          <div className={`px-5 py-4 border-b ${showCountry ? "border-border" : "border-r border-border"}`}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Content Type</div>
            <div className="text-sm font-medium text-foreground">{post.contentType}</div>
          </div>
          <div className="px-5 py-4 border-b border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Duration</div>
            <div className="text-sm font-medium text-foreground">{post.duration}</div>
          </div>
          <div className="px-5 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created Date</div>
            <div className="text-sm font-medium text-foreground font-['JetBrains_Mono',monospace]">{post.created}</div>
          </div>
          <div className="px-5 py-4 border-r border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Views</div>
            <div className="text-sm font-bold text-foreground font-['JetBrains_Mono',monospace]">{formatViews(post.views)}</div>
          </div>
          <div className="px-5 py-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
            <StatusBadge label={post.status} variant={sv(post.status)} />
          </div>
        </div>
      </div>
    </div>
  );
}
