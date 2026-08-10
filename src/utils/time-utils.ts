/**
 * Shared time formatting utilities.
 * All timezone-aware formatting uses Intl.DateTimeFormat.
 */

function warnIfInvalid(label: string, isoString: string, timezone?: string, err?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[time-utils] ${label} failed:`, { isoString, timezone, err });
  }
}

/**
 * Format an ISO date string to "HH:MM AM/PM" in the given timezone.
 * Falls back to browser local time if no timezone provided.
 * Input MUST include a timezone designator (Z or offset) for correct results.
 */
export function formatTime12h(isoString: string, timezone?: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || undefined,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return formatter.format(date);
  } catch (err) {
    warnIfInvalid("formatTime12h", isoString, timezone, err);
    return "";
  }
}

/**
 * Format an ISO date string to "HH:MM:SS" (24h) in the given timezone.
 * Used for live clocks and ON AIR displays.
 */
export function formatTime24h(isoString: string | Date, timezone?: string): string {
  if (!isoString) return "";
  try {
    const date = typeof isoString === "string" ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone || undefined,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return formatter.format(date);
  } catch (err) {
    warnIfInvalid("formatTime24h", String(isoString), timezone, err);
    return "";
  }
}

/**
 * Format an ISO date string to a full datetime like "Jul 18, 2026, 3:42 PM" in the given timezone.
 */
export function formatDateTime(isoString: string, timezone?: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || undefined,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return formatter.format(date);
  } catch (err) {
    warnIfInvalid("formatDateTime", isoString, timezone, err);
    return "";
  }
}

/**
 * Format an ISO date string to a date-only like "Jul 18, 2026" in the given timezone.
 */
export function formatDate(isoString: string, timezone?: string, formatStr?: string): string {
  if (!isoString) return "";
  if (formatStr && (formatStr.includes("H") || formatStr.includes("h"))) {
    return formatDateTime(isoString, timezone);
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || undefined,
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return formatter.format(date);
  } catch (err) {
    warnIfInvalid("formatDate", isoString, timezone, err);
    return "";
  }
}

/**
 * Format seconds to "HH:MM:SS" duration string.
 * Handles: undefined, 0, negative, NaN, Infinity, fractional seconds.
 */
export function formatDuration(seconds?: number): string {
  if (seconds == null || !isFinite(seconds) || seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
