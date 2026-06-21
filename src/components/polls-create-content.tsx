"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const SHOWS = [
  "Morning Drive Show",
  "Midday Rhythms",
  "Evening News Live",
  "Weekend Vibes",
  "Sports Hour",
  "Breakfast Show",
  "Community Hour",
];

const DURATIONS = ["12 Hours", "24 Hours", "48 Hours", "72 Hours", "All Time"];

export default function PollsCreateContent() {
  const [question, setQuestion] = useState("");
  const [show, setShow] = useState("");
  const [duration, setDuration] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [created, setCreated] = useState(false);

  function addOption() {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !show || options.filter((o) => o.trim()).length < 2) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreated(true);
    toast.success("Poll created successfully!");
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back Link */}
      <Link
        href="/campaigns/polls"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors"
      >
        <ArrowLeft size={13} /> Back to Polls
      </Link>

      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
          <BarChart3 size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Poll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage polls for audience engagement.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
          {/* Poll Question */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Poll Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. What topic should we cover next?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
            />
          </div>

          {/* Show & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Show <span className="text-red-500">*</span>
              </label>
              <select
                value={show}
                onChange={(e) => setShow(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Show</option>
                {SHOWS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all appearance-none cursor-pointer"
              >
                <option value="">Select Duration</option>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Poll Options <span className="text-red-500">*</span>
              <span className="text-muted-foreground font-normal ml-2">(minimum 2 options)</span>
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#EFF8FF] text-[#02B2FF] text-xs font-bold flex items-center justify-center shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#02B2FF] hover:text-[#00A0E8] transition-colors"
              >
                <Plus size={14} /> Add Option
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#02B2FF] text-white text-sm font-semibold rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2"
          >
            <BarChart3 size={15} /> Create Poll
          </button>
          <Link
            href="/campaigns/polls"
            className="px-6 py-2.5 bg-white text-foreground text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
