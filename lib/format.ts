import { format, formatDistanceToNowStrict, isValid } from "date-fns";

/**
 * All dates render in a fixed locale and the server's timezone is avoided by
 * formatting in UTC-insensitive ways where possible. Every component that shows
 * a date also emits <time dateTime> so the browser has the exact instant.
 */

export function formatDate(d: Date | string | null | undefined, pattern = "MMMM d, yyyy"): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!isValid(date)) return "";
  return format(date, pattern);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  return formatDate(d, "MMM d, yyyy 'at' h:mm a");
}

export function formatLongDate(d: Date | string | null | undefined): string {
  return formatDate(d, "EEEE, MMMM d, yyyy");
}

export function formatRelative(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!isValid(date)) return "";
  return `${formatDistanceToNowStrict(date, { addSuffix: false })} ago`;
}

export function toIso(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return isValid(date) ? date.toISOString() : "";
}

/** Value for <input type="datetime-local"> in the viewer's local time. */
export function toLocalInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!isValid(date)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function readingTimeLabel(minutes: number) {
  return `${Math.max(1, minutes)} min read`;
}
