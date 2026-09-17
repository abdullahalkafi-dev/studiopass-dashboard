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
 * Pick the best IANA timezone from candidates.
 * Prefer a real resolved value (including explicit "UTC" from country data).
 * Skip empty/null — do not treat a failed profile lookup as authoritative.
 */
export function pickTimezone(
  ...candidates: Array<string | null | undefined>
): string {
  for (const tz of candidates) {
    if (typeof tz === "string" && tz.trim()) return tz.trim();
  }
  return "UTC";
}

/**
 * Format an ISO date string to "HH:MM AM/PM" in the given timezone.
 * Falls back to browser local time if no timezone provided.
 * Input MUST include a timezone designator (Z or offset) for correct results.
 */
export function formatTime12h(isoString: string | Date, timezone?: string): string {
  if (!isoString) return "";
  try {
    const date = typeof isoString === "string" ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || undefined,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return formatter.format(date);
  } catch (err) {
    warnIfInvalid("formatTime12h", String(isoString), timezone, err);
    return "";
  }
}

/**
 * Live studio clock in 12-hour format with seconds: "12:23:33 AM".
 * Uses station/country timezone when provided.
 */
export function formatClock12h(date: Date | string, timezone?: string): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || undefined,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return formatter.format(d);
  } catch (err) {
    warnIfInvalid("formatClock12h", String(date), timezone, err);
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
 * Supports formatStr: "MMM d" → "Jul 18", "PPP" → "July 18th, 2026", default → "MMM DD, YYYY"
 */
export function formatDate(isoString: string, timezone?: string, formatStr?: string): string {
  if (!isoString) return "";
  if (formatStr && (formatStr.includes("H") || formatStr.includes("h"))) {
    return formatDateTime(isoString, timezone);
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    // "PPP" format — long date like "July 18th, 2026"
    if (formatStr === "PPP") {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone || undefined,
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return formatter.format(date);
    }

    // "MMM d" format — compact like "Jul 18"
    if (formatStr === "MMM d") {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone || undefined,
        month: "short",
        day: "numeric",
      });
      return formatter.format(date);
    }

    // Default: "MMM DD, YYYY"
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
 * Convert a raw "HH:mm" string (24h) to "h:mm AM/PM" format.
 * Input is already in the user's local timezone — no timezone conversion needed.
 * Example: "01:21" → "1:21 AM", "13:45" → "1:45 PM", "00:00" → "12:00 AM"
 */
export function formatTime12hRaw(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
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

/**
 * Convert a naive datetime-local input string ("YYYY-MM-DDTHH:mm")
 * in a specific IANA timezone (e.g. "Africa/Kampala", "Asia/Dhaka")
 * into an unambiguous UTC ISO-8601 string ("...Z").
 */
export function toUtcIsoString(localDateTimeStr: string, timeZone?: string): string {
  if (!localDateTimeStr) return "";
  if (localDateTimeStr.includes("Z") || /[+-]\d{2}:\d{2}$/.test(localDateTimeStr)) {
    return new Date(localDateTimeStr).toISOString();
  }

  const [datePart, timePart] = localDateTimeStr.split("T");
  if (!datePart) return new Date(localDateTimeStr).toISOString();

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart || "00:00").split(":").map(Number);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const tz = timeZone && timeZone !== "UTC" ? timeZone : undefined;

  if (!tz) {
    const cleanTime = timePart ? (timePart.split(":").length === 2 ? `${timePart}:00` : timePart) : "00:00:00";
    return new Date(`${datePart}T${cleanTime}Z`).toISOString();
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(utcGuess);
    const getPart = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
    const tzYear = getPart("year");
    const tzMonth = getPart("month");
    const tzDay = getPart("day");
    let tzHour = getPart("hour");
    if (tzHour === 24) tzHour = 0;
    const tzMin = getPart("minute");

    const tzDateAsUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin);
    const offsetMs = tzDateAsUtc - utcGuess.getTime();

    const exactUtc = new Date(utcGuess.getTime() - offsetMs);
    return exactUtc.toISOString();
  } catch {
    return new Date(localDateTimeStr).toISOString();
  }
}

/**
 * Returns current date and time as a "YYYY-MM-DDTHH:mm" string formatted in a specific timezone,
 * suitable for HTML datetime-local inputs.
 */
export function getNowInTimezoneString(timeZone?: string): string {
  const now = new Date();
  const tz = timeZone && timeZone !== "UTC" ? timeZone : undefined;
  if (!tz) {
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localNow.toISOString().slice(0, 16);
  }
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const formatted = formatter.format(now);
    const [datePart, timePart] = formatted.replace(",", "").trim().split(/\s+/);
    return `${datePart}T${timePart}`;
  } catch {
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localNow.toISOString().slice(0, 16);
  }
}

