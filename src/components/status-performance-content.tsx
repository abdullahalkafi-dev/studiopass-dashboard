"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRole } from "@/contexts/role-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import {
  BarChart3, Eye, FileText, Image, TrendingUp, Activity, Star, BarChart2,
} from "lucide-react";

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania"];
const STATIONS = ["Capital FM Kenya", "Radio Uganda", "Joy FM Ghana", "Citizen TV", "NTV Uganda", "Peace FM", "Hot 96"];
const DURATIONS = ["All Time", "72 Hours", "48 Hours", "24 Hours", "12 Hours"];

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

export default function StatusPerformanceContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";

  const showCountry = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;

  const [country, setCountry] = useState("");
  const [station, setStation] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [pg, setPg] = useState(1);
  const PER = 8;

  const sorted = useMemo(() => {
    return [...POSTS].sort((a, b) => b.views - a.views);
  }, []);

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      if (showCountry && country && p.country !== country) return false;
      if (showStation && station && p.station !== station) return false;
      if (durationFilter && p.duration !== durationFilter) return false;
      return true;
    });
  }, [sorted, country, station, durationFilter, showCountry, showStation]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER));
  const paged = filtered.slice((pg - 1) * PER, pg * PER);

  const totalViews = POSTS.reduce((s, p) => s + p.views, 0);
  const activeCampaigns = POSTS.filter((p) => p.status === "Active").length;
  const topCampaign = sorted[0];
  const avgViews = Math.round(totalViews / POSTS.length);
  const maxViews = sorted[0]?.views ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <BarChart3 size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Status Performance</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor campaign reach and viewing performance.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Campaign Views"
          value={formatViews(totalViews)}
          sub="Across all campaigns"
          trend={{ val: "+18.6%", up: true }}
          icon={<Eye size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Active Campaigns"
          value={String(activeCampaigns)}
          sub="Currently running"
          icon={<Activity size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top Campaign</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50">
              <Star size={16} className="text-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">{topCampaign?.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{topCampaign?.station}</div>
          </div>
          <div className="text-lg font-bold text-foreground font-['JetBrains_Mono',monospace]">
            {formatViews(topCampaign?.views ?? 0)} <span className="text-xs font-normal text-muted-foreground">views</span>
          </div>
        </div>
        <KpiCard
          label="Avg Views Per Campaign"
          value={formatViews(avgViews)}
          sub="Average across all posts"
          trend={{ val: "+8.3%", up: true }}
          icon={<BarChart2 size={16} className="text-rose-500" />}
          iconBg="bg-rose-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filters
          </div>
          {showCountry && (
            <FilterSelect
              value={country}
              onChange={(v) => { setCountry(v); setPg(1); }}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="All Countries"
              className="w-44"
            />
          )}
          {showStation && (
            <FilterSelect
              value={station}
              onChange={(v) => { setStation(v); setPg(1); }}
              options={STATIONS.map((s) => ({ value: s, label: s }))}
              placeholder="All Stations"
              className="w-44"
            />
          )}
          <FilterSelect
            value={durationFilter}
            onChange={(v) => { setDurationFilter(v); setPg(1); }}
            options={DURATIONS.map((d) => ({ value: d, label: d }))}
            placeholder="Date Range"
            className="w-44"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing {paged.length} of {filtered.length} campaigns · sorted by views
          </span>
          <span className="text-xs text-muted-foreground">
            Page {pg} of {totalPgs}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 w-12 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campaign Title</th>
                {showStation && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Station</th>
                )}
                {showCountry && (
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                )}
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Content Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[200px]">Total Views</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => {
                const rank = (pg - 1) * PER + i + 1;
                const pct = Math.round((row.views / maxViews) * 100);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        rank <= 3 ? "bg-[#02B2FF] text-white" : "text-muted-foreground"
                      }`}>
                        {rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-foreground">{row.title}</span>
                    </td>
                    {showStation && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">{row.station}</span>
                      </td>
                    )}
                    {showCountry && (
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-foreground">{row.country}</span>
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        row.contentType === "Text"
                          ? "bg-[#EFF8FF] text-[#02B2FF] border-[#02B2FF]/20"
                          : "bg-violet-50 text-violet-600 border-violet-200"
                      }`}>
                        {row.contentType === "Text" ? <FileText size={10} /> : <Image size={10} />}
                        {row.contentType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{row.duration}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-[#02B2FF] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground font-['JetBrains_Mono',monospace] whitespace-nowrap">
                          {formatViews(row.views)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={row.status} variant={sv(row.status)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/campaigns/status-performance/${row.id}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <TablePagination
          pg={pg}
          totalPages={totalPgs}
          totalItems={filtered.length}
          itemLabel="posts"
          setPg={setPg}
        />
      </div>
    </div>
  );
}
