"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

const HOURS = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const PERIODS = ["AM", "PM"];

function to12Hour(time24: string): { hour: string; minute: string; period: "AM" | "PM" } {
  if (!time24) return { hour: "12", minute: "00", period: "AM" };
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(m).padStart(2, "0"),
    period,
  };
}

function to24Hour(hour: string, minute: string, period: "AM" | "PM"): string {
  let h = Number(hour);
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export function TimePicker({ value, onChange, label, placeholder = "HH:MM AM/PM", error }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = to12Hour(value);
  const [selHour, setSelHour] = useState(parsed.hour);
  const [selMin, setSelMin] = useState(parsed.minute);
  const [selPeriod, setSelPeriod] = useState<"AM" | "PM">(parsed.period);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = to12Hour(value);
    setSelHour(p.hour);
    setSelMin(p.minute);
    setSelPeriod(p.period);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOk = useCallback(() => {
    onChange(to24Hour(selHour, selMin, selPeriod));
    setOpen(false);
  }, [selHour, selMin, selPeriod, onChange]);

  const displayValue = value ? (() => {
    const p = to12Hour(value);
    return `${p.hour}:${p.minute} ${p.period}`;
  })() : "";

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          {label}<span className="text-red-500 ml-0.5">*</span>
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer ${error ? "border-red-500" : "border-border"}`}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {displayValue || placeholder}
        </span>
        <Clock size={15} className="text-muted-foreground" />
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1 bg-[#1a1a2e] rounded-xl shadow-2xl border border-white/10 p-3 flex items-end gap-2">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Hour</span>
            <div className="h-[180px] w-[60px] overflow-y-auto rounded-lg bg-black/30 scrollbar-thin scrollbar-thumb-white/20">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelHour(h)}
                  className={`w-full py-2 text-sm font-mono transition-colors ${
                    selHour === h
                      ? "bg-[#02B2FF] text-white font-bold"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <span className="text-lg font-bold text-[#02B2FF] pb-2">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Min</span>
            <div className="h-[180px] w-[60px] overflow-y-auto rounded-lg bg-black/30 scrollbar-thin scrollbar-thumb-white/20">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelMin(m)}
                  className={`w-full py-2 text-sm font-mono transition-colors ${
                    selMin === m
                      ? "bg-[#02B2FF] text-white font-bold"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Period</span>
            <div className="rounded-lg bg-black/30 overflow-hidden">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelPeriod(p as "AM" | "PM")}
                  className={`w-[52px] py-2.5 text-sm font-bold transition-colors block ${
                    selPeriod === p
                      ? "bg-[#02B2FF] text-white"
                      : "text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* OK Button */}
          <button
            type="button"
            onClick={handleOk}
            className="ml-1 px-3 py-2 bg-[#02B2FF] text-white text-xs font-bold rounded-lg hover:bg-[#0190D0] transition-colors"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Format a 24h HH:mm string to display as "06:00 AM" etc.
 */
export function formatTime12h(time24: string): string {
  if (!time24) return "";
  const p = to12Hour(time24);
  return `${p.hour}:${p.minute} ${p.period}`;
}
