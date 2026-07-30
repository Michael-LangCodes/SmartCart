import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The days of the week used across the planner, Monday-first. */
export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** Meal slots available for each day. */
export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"] as const;

export type MealType = (typeof MEAL_TYPES)[number];

/**
 * Return the ISO date (YYYY-MM-DD) of the Monday on or before the given day.
 *
 * - Pass a `Date` for "now" (uses the local calendar day).
 * - Pass an ISO date string `YYYY-MM-DD` for URL/query params (parsed as a
 *   pure calendar date, no timezone shift). Mixing these wrongly used to make
 *   "Next week" snap back to the current week in US timezones.
 */
export function getWeekStart(input: Date | string = new Date()): string {
  let d: Date;
  if (typeof input === "string") {
    const [y, m, day] = input.split("-").map(Number);
    d = new Date(Date.UTC(y, m - 1, day));
  } else {
    d = new Date(
      Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()),
    );
  }
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** Add `weeks` weeks to an ISO week-start date and return the new ISO date. */
export function addWeeks(weekStart: string, weeks: number): string {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

/** Human-friendly label for a week, e.g. "Jul 21 - Jul 27, 2026". */
export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(start)} - ${fmt(end)}, ${end.getUTCFullYear()}`;
}
