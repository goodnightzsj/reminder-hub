import "server-only";

import { dateTimeLocalToUtcDate, formatDateTimeLocal } from "./datetime";
import { isRecurrenceUnit, recurrenceUnits, type RecurrenceUnit } from "@/lib/recurrence";

export { recurrenceUnits };
export type { RecurrenceUnit };

export type RecurrenceRule = {
  unit: RecurrenceUnit;
  interval: number;
};

function normalizeInterval(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const asInt = Math.trunc(value);
  if (asInt < 1) return 1;
  if (asInt > 365) return 365;
  return asInt;
}

export function parseRecurrenceRuleJson(value: string | null): RecurrenceRule | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const unitRaw = (parsed as { unit?: unknown }).unit;
    const intervalRaw = (parsed as { interval?: unknown }).interval;
    if (typeof unitRaw !== "string" || !isRecurrenceUnit(unitRaw)) return null;

    const interval =
      typeof intervalRaw === "number" ? normalizeInterval(intervalRaw) : 1;

    return { unit: unitRaw, interval };
  } catch {
    return null;
  }
}

export function serializeRecurrenceRule(rule: RecurrenceRule | null): string | null {
  if (!rule) return null;
  return JSON.stringify({ unit: rule.unit, interval: normalizeInterval(rule.interval) });
}

export function formatRecurrenceRuleZh(rule: RecurrenceRule): string {
  const interval = normalizeInterval(rule.interval);

  if (interval === 1) {
    switch (rule.unit) {
      case "day":
        return "每天";
      case "week":
        return "每周";
      case "month":
        return "每月";
      case "year":
        return "每年";
    }
  }

  const unitLabel = (() => {
    switch (rule.unit) {
      case "day":
        return "天";
      case "week":
        return "周";
      case "month":
        return "月";
      case "year":
        return "年";
    }
  })();

  return `每 ${interval} ${unitLabel}`;
}

type DateTimeLocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseDateTimeLocalParts(value: string): DateTimeLocalParts | null {
  const match = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateTimeLocalString(parts: DateTimeLocalParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(
    parts.hour,
  )}:${pad2(parts.minute)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonthsClamped(
  parts: DateTimeLocalParts,
  monthsToAdd: number,
): DateTimeLocalParts {
  const totalMonths = parts.year * 12 + (parts.month - 1) + monthsToAdd;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;

  const lastDay = daysInMonth(year, month);
  const day = Math.min(parts.day, lastDay);

  return { ...parts, year, month, day };
}

export function computeNextDueAtUtc(
  dueAtUtc: Date,
  timeZone: string,
  rule: RecurrenceRule,
): Date | null {
  const currentLocal = formatDateTimeLocal(dueAtUtc, timeZone);
  const parts = parseDateTimeLocalParts(currentLocal);
  if (!parts) return null;

  const interval = normalizeInterval(rule.interval);

  const nextParts = (() => {
    switch (rule.unit) {
      case "month":
        return addMonthsClamped(parts, interval);
      case "year":
        return addMonthsClamped(parts, interval * 12);
      case "day":
      case "week": {
        const daysToAdd = interval * (rule.unit === "day" ? 1 : 7);
        const naiveUtc = new Date(
          Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute),
        );
        naiveUtc.setUTCDate(naiveUtc.getUTCDate() + daysToAdd);

        return {
          year: naiveUtc.getUTCFullYear(),
          month: naiveUtc.getUTCMonth() + 1,
          day: naiveUtc.getUTCDate(),
          hour: naiveUtc.getUTCHours(),
          minute: naiveUtc.getUTCMinutes(),
        };
      }
    }
  })();

  return dateTimeLocalToUtcDate(toDateTimeLocalString(nextParts), timeZone);
}
