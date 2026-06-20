"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Post = {
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

const POSTS: Post[] = [
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

export default function StatusPostDetailContent({ id }: { id: string }) {
  const post = POSTS.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="space-y-6">
        <Link href="/campaigns/status-posts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Status Posts
        </Link>
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-foreground">Post not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/campaigns/status-posts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back to Status Posts
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Status Post Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Viewing: {post.title}</p>
      </div>

      {/* Details Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden max-w-2xl">
        {/* Title bar with status */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <div className="text-sm font-bold text-foreground">{post.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{post.station} · {post.country}</div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            post.status === "Active" ? "text-emerald-700 bg-emerald-50" : "text-slate-500 bg-slate-100"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${post.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
            {post.status}
          </span>
        </div>

        {/* Content */}
        <div className="px-6 py-4 border-b border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Post Content</div>
          <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Post Title</div>
            <div className="text-sm font-semibold text-foreground">{post.title}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Station</div>
            <div className="text-sm font-semibold text-foreground">{post.station}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Country</div>
            <div className="text-sm font-semibold text-foreground">{post.country}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Content Type</div>
            <div className="text-sm font-semibold text-foreground">{post.contentType}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Duration</div>
            <div className="text-sm font-semibold text-foreground">{post.duration}</div>
          </div>
          <div className="px-6 py-4 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created Date</div>
            <div className="text-sm font-semibold text-foreground">{post.created}</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Views</div>
            <div className="text-lg font-bold font-['JetBrains_Mono',monospace] text-foreground">{post.views.toLocaleString()}</div>
          </div>
          <div className="px-6 py-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Status</div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              post.status === "Active" ? "text-emerald-700 bg-emerald-50" : "text-slate-500 bg-slate-100"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${post.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
              {post.status}
            </span>
          </div>
        </div>
      </div>

      {/* Back button */}
      <Link href="/campaigns/status-posts"
        className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-white hover:bg-muted transition-colors">
        <ArrowLeft size={14} /> Back to Status Posts
      </Link>
    </div>
  );
}
