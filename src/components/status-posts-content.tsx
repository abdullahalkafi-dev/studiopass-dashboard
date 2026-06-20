"use client";

import { useState, useMemo } from "react";
import { useRole } from "@/contexts/role-context";
import { KpiCard } from "@/components/shared/kpi-card";
import { FilterSelect } from "@/components/shared/filter-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { Megaphone, Download, Search, Eye, X, FileText, Image, TrendingUp, Clock, AlertCircle } from "lucide-react";

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda"];
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

export default function StatusPostsContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";
  const isStationAdmin = role === "station_admin";

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [station, setStation] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [pg, setPg] = useState(1);
  const PER = 10;

  const showCountry = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;
  const showCountryFilter = isSuperAdmin;
  const showStationFilter = isSuperAdmin || isPartnerAdmin;

  const filtered = useMemo(() => {
    return POSTS.filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.title.toLowerCase().includes(q) && !p.station.toLowerCase().includes(q)) return false;
      if (showCountryFilter && country && p.country !== country) return false;
      if (showStationFilter && station && p.station !== station) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (durationFilter && p.duration !== durationFilter) return false;
      return true;
    });
  }, [search, country, station, statusFilter, durationFilter, showCountryFilter, showStationFilter]);

  const totalPgs = Math.max(1, Math.ceil(filtered.length / PER));
  const paged = filtered.slice((pg - 1) * PER, pg * PER);
  const total = filtered.length;
  const active = POSTS.filter((p) => p.status === "Active").length;
  const expired = POSTS.filter((p) => p.status === "Expired").length;

  function clearFilters() {
    setSearch("");
    setCountry("");
    setStation("");
    setStatusFilter("");
    setDurationFilter("");
    setPg(1);
  }
  const hasFilters = !!(search || country || station || statusFilter || durationFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center">
            <Megaphone size={18} className="text-[#02B2FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Status Posts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage all station campaign posts and status content across the platform.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
          + Create Status Post
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Status Posts"
          value={String(POSTS.length)}
          sub="All campaign posts"
          trend={{ val: "+3 this month vs last month", up: true }}
          icon={<Megaphone size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Active Posts"
          value={String(active)}
          sub="Currently live"
          trend={{ val: "47% of total vs last month", up: true }}
          icon={<TrendingUp size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Expired Posts"
          value={String(expired)}
          sub="No longer running"
          icon={<Clock size={16} className="text-slate-400" />}
          iconBg="bg-slate-50"
        />
        <KpiCard
          label="All Time Posts"
          value={String(POSTS.length)}
          sub="Since platform launch"
          trend={{ val: "+15 last month vs last month", up: true }}
          icon={<FileText size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by post title or station..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>
          {showCountryFilter && (
            <FilterSelect value={country} onChange={(v) => { setCountry(v); setPg(1); }}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              placeholder="All Countries" className="w-40" />
          )}
          {showStationFilter && (
            <FilterSelect value={station} onChange={(v) => { setStation(v); setPg(1); }}
              options={STATIONS.map((s) => ({ value: s, label: s }))}
              placeholder="All Stations" className="w-48" />
          )}
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPg(1); }}
            options={[
              { value: "Active", label: "Active" },
              { value: "Expired", label: "Expired" },
            ]}
            placeholder="All Status" className="w-36" />
          <FilterSelect value={durationFilter} onChange={(v) => { setDurationFilter(v); setPg(1); }}
            options={DURATIONS.map((d) => ({ value: d, label: d }))}
            placeholder="All Durations" className="w-40" />
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap flex items-center gap-1.5">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            Showing <span className="text-foreground">{paged.length}</span> of <span className="text-foreground">{total}</span> posts
          </span>
          <span className="text-xs text-muted-foreground">Page {pg} of {totalPgs}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Post Title</th>
                {showStation && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Station</th>}
                {showCountry && <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Country</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Content Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Duration</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Views</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Created Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={showStation ? (showCountry ? 9 : 8) : (showCountry ? 8 : 7)} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Search size={18} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No posts found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="mt-1 text-xs text-[#02B2FF] font-semibold hover:underline">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paged.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-foreground">{p.title}</span>
                  </td>
                  {showStation && <td className="px-4 py-3.5 text-xs font-medium text-foreground">{p.station}</td>}
                  {showCountry && <td className="px-4 py-3.5 text-xs font-medium text-foreground">{p.country}</td>}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.contentType === "Image"
                        ? "bg-violet-50 text-violet-700 border border-violet-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {p.contentType === "Image" ? <Image size={10} /> : <FileText size={10} />}
                      {p.contentType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">{p.duration}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs font-bold font-['JetBrains_Mono',monospace] text-foreground">{p.views.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.status === "Active"
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-slate-500 bg-slate-100"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground whitespace-nowrap">{p.created}</td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all" title="View post">
                        <Eye size={14} />
                      </button>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all" title="Delete post">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination pg={pg} totalPages={totalPgs} totalItems={total} itemLabel="posts" setPg={setPg} />
      </div>
    </div>
  );
}
