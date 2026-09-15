"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Clock } from "lucide-react";

const HOURS = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
/** Every minute 00–59 (not 5/15-min steps) — client feedback #16 */
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
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
  /** Hide the required asterisk on the label */
  optional?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  label,
  placeholder = "HH:MM AM/PM",
  error,
  optional = false,
  disabled = false,
  className = "",
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = to12Hour(value);
  const [selHour, setSelHour] = useState(parsed.hour);
  const [selMin, setSelMin] = useState(parsed.minute);
  const [selPeriod, setSelPeriod] = useState<"AM" | "PM">(parsed.period);
  const ref = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minListRef = useRef<HTMLDivElement>(null);

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

  // Scroll selected values into view when the panel opens
  useEffect(() => {
    if (!open) return;
    const hourEl = hourListRef.current?.querySelector(`[data-hour="${selHour}"]`);
    const minEl = minListRef.current?.querySelector(`[data-minute="${selMin}"]`);
    hourEl?.scrollIntoView({ block: "center" });
    minEl?.scrollIntoView({ block: "center" });
  }, [open, selHour, selMin]);

  const handleOk = useCallback(() => {
    onChange(to24Hour(selHour, selMin, selPeriod));
    setOpen(false);
  }, [selHour, selMin, selPeriod, onChange]);

  const displayValue = useMemo(() => {
    if (!value) return "";
    const p = to12Hour(value);
    return `${p.hour}:${p.minute} ${p.period}`;
  }, [value]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          {label}
          {!optional && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${error ? "border-red-500" : "border-border"}`}
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
            <div
              ref={hourListRef}
              className="h-[180px] w-[60px] overflow-y-auto rounded-lg bg-black/30 scrollbar-thin scrollbar-thumb-white/20"
            >
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-hour={h}
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

          {/* Minutes — 00–59 */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">Min</span>
            <div
              ref={minListRef}
              className="h-[180px] w-[60px] overflow-y-auto rounded-lg bg-black/30 scrollbar-thin scrollbar-thumb-white/20"
            >
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-minute={m}
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

/** Split "YYYY-MM-DDTHH:mm" into date + time parts */
export function splitDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [date, time] = value.split("T");
  return { date: date || "", time: (time || "").slice(0, 5) };
}

export function joinDateTime(date: string, time: string): string {
  if (!date) return "";
  const t = time && time.length >= 5 ? time.slice(0, 5) : "00:00";
  return `${date}T${t}`;
}

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  min?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Date + Time pair. Emits "YYYY-MM-DDTHH:mm" (same shape as native datetime-local).
 * Minutes use the shared TimePicker (00–59).
 */
export function DateTimePicker({
  value,
  onChange,
  label,
  error,
  min,
  disabled = false,
  className = "",
}: DateTimePickerProps) {
  const { date, time } = splitDateTime(value);
  const minDate = min ? splitDateTime(min).date : undefined;
  const minTime = min ? splitDateTime(min).time : undefined;

  const handleDate = (nextDate: string) => {
    onChange(joinDateTime(nextDate, time || "00:00"));
  };

  const handleTime = (nextTime: string) => {
    onChange(joinDateTime(date || new Date().toISOString().slice(0, 10), nextTime));
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-foreground mb-1.5">
          {label}
          <span className="text-red-500 ml-0.5">*</span>
        </label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="date"
          value={date}
          min={minDate}
          disabled={disabled}
          onChange={(e) => handleDate(e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all disabled:opacity-50"
        />
        <TimePicker
          value={time || ""}
          onChange={handleTime}
          placeholder="Select time"
          optional
          disabled={disabled || !date}
          className={error ? "" : ""}
        />
      </div>
      {/* When min is same day, block earlier times via min on date input only —
          server still validates ordering. Time minTime is informational. */}
      {minTime && date === minDate && (
        <p className="text-[10px] text-muted-foreground mt-1">
          Earliest today: {formatTime12h(minTime)}
        </p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
