import "server-only";

import { addDaysToDateString, addMonthsClampedToDateString, formatDateInTimeZone, parseDateString } from "@/server/date";
import { dateTimeLocalToUtcDate } from "@/server/datetime";

export type DigestPeriod = {
  startDate: string; // YYYY-MM-DD in app time zone
  endDate: string; // YYYY-MM-DD in app time zone
  startUtc: Date;
  endExclusiveUtc: Date;
};

function getUtcWeekdayFromDateString(dateString: string): number | null {
  const parts = parseDateString(dateString);
  if (!parts) return null;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay(); // 0=Sun..6=Sat
}

function getWeekStartMonday(dateString: string): string | null {
  const weekday = getUtcWeekdayFromDateString(dateString);
  if (weekday === null) return null;
  const daysSinceMonday = (weekday + 6) % 7; // Mon=0 ... Sun=6
  return addDaysToDateString(dateString, -daysSinceMonday);
}

function buildPeriodFromDateRange(args: { startDate: string; endDate: string; timeZone: string }): DigestPeriod {
  const startUtc = dateTimeLocalToUtcDate(`${args.startDate}T00:00`, args.timeZone);
  const endExclusiveDate = addDaysToDateString(args.endDate, 1);
  const endExclusiveUtc = endExclusiveDate
    ? dateTimeLocalToUtcDate(`${endExclusiveDate}T00:00`, args.timeZone)
    : null;

  if (!startUtc || !endExclusiveUtc) {
    throw new Error("Failed to compute digest UTC range");
  }

  return { startDate: args.startDate, endDate: args.endDate, startUtc, endExclusiveUtc };
}

export function getWeeklyDigestPeriods(now: Date, timeZone: string): {
  lastWeek: DigestPeriod;
  thisWeek: DigestPeriod;
} {
  const today = formatDateInTimeZone(now, timeZone);
  const thisWeekStart = getWeekStartMonday(today);
  if (!thisWeekStart) throw new Error("Failed to compute week start");

  const thisWeekEnd = addDaysToDateString(thisWeekStart, 6);
  const lastWeekStart = addDaysToDateString(thisWeekStart, -7);
  const lastWeekEnd = addDaysToDateString(thisWeekStart, -1);

  if (!thisWeekEnd || !lastWeekStart || !lastWeekEnd) {
    throw new Error("Failed to compute weekly digest date range");
  }

  return {
    lastWeek: buildPeriodFromDateRange({ startDate: lastWeekStart, endDate: lastWeekEnd, timeZone }),
    thisWeek: buildPeriodFromDateRange({ startDate: thisWeekStart, endDate: thisWeekEnd, timeZone }),
  };
}

export function getMonthlyDigestPeriods(now: Date, timeZone: string): {
  lastMonth: DigestPeriod;
  thisMonth: DigestPeriod;
} {
  const today = formatDateInTimeZone(now, timeZone);
  const parts = parseDateString(today);
  if (!parts) throw new Error("Failed to parse today date");

  const thisMonthStart = `${parts.year}-${String(parts.month).padStart(2, "0")}-01`;
  const nextMonthStart = addMonthsClampedToDateString(thisMonthStart, 1);
  const lastMonthStart = addMonthsClampedToDateString(thisMonthStart, -1);
  const lastMonthEnd = addDaysToDateString(thisMonthStart, -1);
  const thisMonthEnd = nextMonthStart ? addDaysToDateString(nextMonthStart, -1) : null;

  if (!nextMonthStart || !lastMonthStart || !lastMonthEnd || !thisMonthEnd) {
    throw new Error("Failed to compute monthly digest date range");
  }

  return {
    lastMonth: buildPeriodFromDateRange({ startDate: lastMonthStart, endDate: lastMonthEnd, timeZone }),
    thisMonth: buildPeriodFromDateRange({ startDate: thisMonthStart, endDate: thisMonthEnd, timeZone }),
  };
}

