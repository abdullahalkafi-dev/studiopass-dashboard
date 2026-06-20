"use client";

import { useState } from "react";
import { useRole } from "@/contexts/role-context";
import Link from "next/link";
import { ArrowLeft, FileText, Image, Upload } from "lucide-react";
import { FilterSelect } from "@/components/shared/filter-select";

const COUNTRIES = ["Kenya", "Uganda", "Ghana", "Tanzania", "Nigeria", "Rwanda"];
const PARTNERS = ["Capital FM Group", "Radio Uganda Ltd", "Joy Media Ghana", "Tanzania Media Corp", "Peace FM Group"];
const STATIONS = ["Capital FM Kenya", "Radio Uganda", "Joy FM Ghana", "Citizen TV", "NTV Uganda", "Peace FM", "Hot 96"];
const DURATIONS = ["All Time", "72 Hours", "48 Hours", "24 Hours", "12 Hours"];

export default function CreateStatusPostContent() {
  const role = useRole();
  const isSuperAdmin = role === "super_admin";
  const isPartnerAdmin = role === "partner_admin";

  const showCountry = isSuperAdmin;
  const showPartner = isSuperAdmin;
  const showStation = isSuperAdmin || isPartnerAdmin;

  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [partner, setPartner] = useState("");
  const [station, setStation] = useState("");
  const [contentType, setContentType] = useState<"Text" | "Image">("Text");
  const [duration, setDuration] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/campaigns/status-posts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back to Status Posts
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Create Status Post</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Publish a new campaign post to a station</p>
      </div>

      {/* Form Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden max-w-2xl">
        <div className="p-6 space-y-5">
          {/* Row 1: Post Title + Country (super admin only) */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Post Title<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning Drive Promo"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
            </div>
            {showCountry && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Country</label>
                <FilterSelect value={country} onChange={setCountry}
                  options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                  placeholder="Select Country" />
              </div>
            )}
            {!showCountry && showStation && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Station<span className="text-red-500 ml-0.5">*</span>
                </label>
                <FilterSelect value={station} onChange={setStation}
                  options={STATIONS.map((s) => ({ value: s, label: s }))}
                  placeholder="Select Station" />
              </div>
            )}
          </div>

          {/* Row 2: Partner + Station (super admin) */}
          {showPartner && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Partner</label>
                <FilterSelect value={partner} onChange={setPartner}
                  options={PARTNERS.map((p) => ({ value: p, label: p }))}
                  placeholder="Select partner" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Station<span className="text-red-500 ml-0.5">*</span>
                </label>
                <FilterSelect value={station} onChange={setStation}
                  options={STATIONS.map((s) => ({ value: s, label: s }))}
                  placeholder="Select Station" />
              </div>
            </div>
          )}

          {/* Row 3: Content Type + Duration */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Content Type<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setContentType("Text")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    contentType === "Text"
                      ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <FileText size={14} /> Text
                </button>
                <button
                  onClick={() => setContentType("Image")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    contentType === "Image"
                      ? "bg-[#02B2FF] text-white border-[#02B2FF] shadow-sm"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <Image size={14} /> Image
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Duration<span className="text-red-500 ml-0.5">*</span>
              </label>
              <FilterSelect value={duration} onChange={setDuration}
                options={DURATIONS.map((d) => ({ value: d, label: d }))}
                placeholder="Select duration" />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Content<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={contentType === "Image" ? "Enter image caption or description..." : "Enter your status post text content..."}
              rows={4}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all resize-none"
            />
          </div>

          {/* Image Upload (shown when Image type selected) */}
          {contentType === "Image" && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Image Upload</label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-[#02B2FF]/50 transition-colors cursor-pointer">
                <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">Click to upload image</p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Note:</span> Posts cannot be edited after publishing. Duration starts from the moment of publication.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border flex gap-3 bg-muted/20">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm">
            <span>📢</span> Publish Post
          </button>
          <Link href="/campaigns/status-posts"
            className="px-5 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-white hover:bg-muted transition-colors">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
