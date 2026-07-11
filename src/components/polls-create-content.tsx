"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { useCreatePollMutation } from "@/features/poll/pollApi";
import { useGetStationsQuery } from "@/features/station/stationApi";
import { useGetShowsQuery } from "@/features/show/showApi";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, BarChart3 } from "lucide-react";

export default function PollsCreateContent() {
  const role = useRole();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userStationId = user?.stationId;
  const isStationScoped = role === "station_admin" || role === "media_station";
  const [createPoll, { isLoading }] = useCreatePollMutation();

  const [question, setQuestion] = useState("");
  const [stationId, setStationId] = useState("");
  const [showId, setShowId] = useState("");
  const [duration, setDuration] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [created, setCreated] = useState(false);

  // Auto-inject stationId for station_admin / media_station
  useEffect(() => {
    if (isStationScoped && userStationId) {
      setStationId(userStationId);
    }
  }, [isStationScoped, userStationId]);

  const { data: stationsData } = useGetStationsQuery(
    { page: 1, limit: 100 },
    { skip: isStationScoped }
  );
  const stations = stationsData?.data || [];

  const { data: showsData } = useGetShowsQuery(
    { station: stationId || undefined, page: 1, limit: 100 },
    { skip: !stationId }
  );
  const shows = showsData?.data || [];

  // Resolve station name for display when scoped
  const scopedStationName = isStationScoped
    ? stations.find((s: any) => s._id === stationId)?.name || "Your Station"
    : null;

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const removeOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error("Please enter a poll question");
      return;
    }
    if (!isStationScoped && !stationId) {
      toast.error("Please select a station");
      return;
    }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    // Calculate expiresAt from duration
    let expiresAt: string | undefined;
    if (duration && duration !== "no_limit") {
      const hours = parseInt(duration, 10);
      const expiryDate = new Date(Date.now() + hours * 60 * 60 * 1000);
      expiresAt = expiryDate.toISOString();
    }

    const resolvedStationId = isStationScoped ? userStationId : stationId;

    try {
      await createPoll({
        stationId: resolvedStationId,
        question: question.trim(),
        options: validOptions,
        showId: showId || undefined,
        expiresAt,
      }).unwrap();

      setCreated(true);
      toast.success("Poll created successfully!");
      setTimeout(() => router.push("/campaigns/polls"), 1500);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create poll");
    }
  };

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <BarChart3 size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Poll Created!</h2>
        <p className="text-sm text-muted-foreground mt-1">Redirecting to polls list…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/campaigns/polls" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft size={16} className="text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Poll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Launch a new audience poll for a show</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Question */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Poll Question</label>
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. What genre should we play next?"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all" />
          </div>

          {/* Station (only for super_admin / partner_admin) */}
          {!isStationScoped && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Station</label>
              <select value={stationId} onChange={(e) => { setStationId(e.target.value); setShowId(""); }}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all">
                <option value="">Select a station</option>
                {stations.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Show + Duration row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Show */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Assign Show</label>
              <select value={showId} onChange={(e) => setShowId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all">
                <option value="">Select Show</option>
                {shows.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            {/* Poll Duration */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Poll Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all">
                <option value="">Select Poll Duration</option>
                <option value="1">1 Hour</option>
                <option value="3">3 Hours</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours</option>
                <option value="72">3 Days (72h)</option>
                <option value="no_limit">No Limit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Poll Options</label>
            {options.length < 6 && (
              <button type="button" onClick={addOption} className="text-xs font-semibold text-[#02B2FF] hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Option
              </button>
            )}
          </div>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
              <input type="text" value={opt} onChange={(e) => updateOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`}
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all" />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(idx)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Link href="/campaigns/polls" className="px-5 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors text-foreground">Cancel</Link>
          <button type="submit" disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold bg-[#02B2FF] text-white rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Creating…" : "Create Poll"}
          </button>
        </div>
      </form>
    </div>
  );
}
