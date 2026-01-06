import { daysInMonth, formatDateString, parseDateString } from "./date";

export type LeapDayStrategy = "feb28" | "mar1";

type MonthDay = {
  month: number;
  day: number;
};

function parseMonthDayString(value: string): MonthDay | null {
  const match = value.trim().match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);

  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 30) return null;

  return { month, day };
}

function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

function normalizeMonthDayForYear(input: { month: number; day: number }, year: number, strategy: LeapDayStrategy) {
  if (input.month === 2 && input.day === 29 && !isLeapYear(year)) {
    if (strategy === "mar1") return { month: 3, day: 1 };
    return { month: 2, day: 28 };
  }

  const maxDay = daysInMonth(year, input.month);
  return { month: input.month, day: Math.min(input.day, maxDay) };
}

export function getNextSolarOccurrenceDateString(
  originalDateString: string,
  todayDateString: string,
  strategy: LeapDayStrategy = "feb28",
): string | null {
  const original = parseDateString(originalDateString);
  const today = parseDateString(todayDateString);
  if (!original || !today) return null;

  const monthDay = { month: original.month, day: original.day };
  const candidateMonthDay = normalizeMonthDayForYear(monthDay, today.year, strategy);

  const candidate = formatDateString({
    year: today.year,
    month: candidateMonthDay.month,
    day: candidateMonthDay.day,
  });

  if (candidate >= todayDateString) return candidate;

  const nextYear = today.year + 1;
  const nextMonthDay = normalizeMonthDayForYear(monthDay, nextYear, strategy);
  return formatDateString({
    year: nextYear,
    month: nextMonthDay.month,
    day: nextMonthDay.day,
  });
}

export function getNextLunarOccurrenceDateString(
  lunarMonthDayString: string,
  todayDateString: string,
  opts?: { isLeapMonth?: boolean },
): string | null {
  const today = parseDateString(todayDateString);
  if (!today) return null;

  const md = parseMonthDayString(lunarMonthDayString);
  if (!md) return null;

  const isLeapMonth = opts?.isLeapMonth ?? false;

  // lunar-javascript is a CommonJS package without TypeScript types.
  // Use require() so TS doesn't need .d.ts files.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Lunar } = require("lunar-javascript") as {
    Lunar: {
      fromYmd: (year: number, month: number, day: number) => {
        getSolar: () => { toYmd: () => string };
      };
    };
  };

  const candidates = [today.year - 1, today.year, today.year + 1, today.year + 2];
  let best: string | null = null;

  for (const lunarYear of candidates) {
    try {
      const lunarMonth = isLeapMonth ? -md.month : md.month;
      const solarYmd = Lunar.fromYmd(lunarYear, lunarMonth, md.day)
        .getSolar()
        .toYmd();

      if (solarYmd < todayDateString) continue;
      if (!best || solarYmd < best) best = solarYmd;
    } catch {
      continue;
    }
  }

  return best;
}
