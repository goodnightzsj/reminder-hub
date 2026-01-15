import "server-only";

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDateString(parts: DateParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  return formatDateString(getDatePartsInTimeZone(date, timeZone));
}

export function parseDateString(value: string): DateParts | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const maxDay = daysInMonth(year, month);
  if (day > maxDay) return null;

  return { year, month, day };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDaysToDateString(dateString: string, daysToAdd: number): string | null {
  const parts = parseDateString(dateString);
  if (!parts) return null;

  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  utc.setUTCDate(utc.getUTCDate() + daysToAdd);

  return formatDateString({
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  });
}

export function addMonthsClampedToDateString(
  dateString: string,
  monthsToAdd: number,
): string | null {
  const parts = parseDateString(dateString);
  if (!parts) return null;

  const totalMonths = parts.year * 12 + (parts.month - 1) + monthsToAdd;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;

  const maxDay = daysInMonth(year, month);
  const day = Math.min(parts.day, maxDay);

  return formatDateString({ year, month, day });
}

export function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  let year: string | null = null;
  let month: string | null = null;
  let day: string | null = null;

  for (const part of parts) {
    if (part.type === "year") year = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "day") day = part.value;
  }

  if (!year || !month || !day) {
    throw new Error("Failed to get date parts for time zone");
  }

  return { year: Number(year), month: Number(month), day: Number(day) };
}

export function diffDays(fromDateString: string, toDateString: string): number | null {
  const from = parseDateString(fromDateString);
  const to = parseDateString(toDateString);
  if (!from || !to) return null;

  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toUtc - fromUtc) / 86400000);
}
