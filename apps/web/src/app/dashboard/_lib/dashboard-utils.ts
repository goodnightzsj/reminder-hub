import "server-only";

import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
} from "@/server/anniversary";
import {
  addDaysToDateString,
  diffDays,
  formatDateInTimeZone,
} from "@/server/date";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import { computeDaysUsed } from "@/server/item-metrics";

import type { UpcomingItem } from "@/app/_components/dashboard/UpcomingList.types";
import { ANNIVERSARY_DATE_TYPE, type AnniversaryDateType } from "@/lib/anniversary";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { SUBSCRIPTION_CYCLE_UNIT, type SubscriptionCycleUnit } from "@/lib/subscriptions";

export type DashboardDateRange = {
  today: string;
  tomorrow: string;
  upcomingEnd: string;
  startUtc: Date;
  endUtc: Date;
  upcomingEndExclusiveUtc: Date;
};

export function computeDashboardDateRange(now: Date, timeZone: string): DashboardDateRange {
  const today = formatDateInTimeZone(now, timeZone);
  const tomorrow = addDaysToDateString(today, 1);
  const upcomingEnd = addDaysToDateString(today, 7);
  const upcomingEndExclusive = addDaysToDateString(today, 8);

  if (!tomorrow || !upcomingEnd || !upcomingEndExclusive) {
    throw new Error("Failed to compute dashboard date range");
  }

  const startUtc = dateTimeLocalToUtcDate(`${today}T00:00`, timeZone);
  const endUtc = dateTimeLocalToUtcDate(`${tomorrow}T00:00`, timeZone);
  const upcomingEndExclusiveUtc = dateTimeLocalToUtcDate(
    `${upcomingEndExclusive}T00:00`,
    timeZone,
  );

  if (!startUtc || !endUtc || !upcomingEndExclusiveUtc) {
    throw new Error("Failed to compute dashboard UTC range");
  }

  return {
    today,
    tomorrow,
    upcomingEnd,
    startUtc,
    endUtc,
    upcomingEndExclusiveUtc,
  };
}

function getTimeOfDay(hour: number) {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function getGreeting(timeZone: string, now: Date = new Date()): string {
  const hour = parseInt(new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).format(now), 10);

  const timeOfDay = getTimeOfDay(hour);

  switch (timeOfDay) {
    case "morning": return "早上好";
    case "afternoon": return "下午好";
    case "evening": return "晚上好";
    case "night": return "夜深了";
    default: return "你好";
  }
}

export type ActiveAnniversaryRow = {
  id: string;
  title: string;
  dateType: AnniversaryDateType;
  isLeapMonth: boolean;
  date: string;
};

export type AnniversaryWithNext = ActiveAnniversaryRow & {
  nextDate: string;
  daysLeft: number;
  at: Date;
};

export function buildAnniversariesWithNext(
  rows: ActiveAnniversaryRow[],
  opts: { today: string; timeZone: string; dateReminderTime: string },
): AnniversaryWithNext[] {
  const { today, timeZone, dateReminderTime } = opts;

  return rows
    .map((a) => {
      const nextDate =
        a.dateType === ANNIVERSARY_DATE_TYPE.SOLAR
          ? getNextSolarOccurrenceDateString(a.date, today)
          : getNextLunarOccurrenceDateString(a.date, today, {
              isLeapMonth: a.isLeapMonth,
            });

      if (!nextDate) return null;
      const daysLeft = diffDays(today, nextDate);
      if (daysLeft === null) return null;
      const at = dateTimeLocalToUtcDate(`${nextDate}T${dateReminderTime}`, timeZone);
      if (!at) return null;
      return { ...a, nextDate, daysLeft, at };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

export type ActiveSubscriptionSpendRow = {
  priceCents: number | null;
  currency: string | null;
  cycleUnit: SubscriptionCycleUnit;
  cycleInterval: number;
};

export type SpendRow = { currency: string; amount: number };

export function buildMonthlySpendRows(rows: ActiveSubscriptionSpendRow[]): SpendRow[] {
  const monthlySpendByCurrency = new Map<string, number>();
  for (const s of rows) {
    if (s.priceCents === null) continue;
    const currency = (s.currency ?? DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY;
    const monthsPerCycle =
      s.cycleUnit === SUBSCRIPTION_CYCLE_UNIT.YEAR ? s.cycleInterval * 12 : s.cycleInterval;
    if (!Number.isFinite(monthsPerCycle) || monthsPerCycle < 1) continue;
    const monthly = s.priceCents / 100 / monthsPerCycle;
    if (!Number.isFinite(monthly)) continue;
    monthlySpendByCurrency.set(currency, (monthlySpendByCurrency.get(currency) ?? 0) + monthly);
  }

  return Array.from(monthlySpendByCurrency.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export type ActiveItemDailyCostRow = {
  id: string;
  name: string;
  priceCents: number | null;
  currency: string | null;
  purchasedDate: string | null;
};

export type LowestDailyCostItem = {
  id: string;
  name: string;
  dailyCents: number;
  currency: string;
};

export function buildLowestDailyCostItems(
  rows: ActiveItemDailyCostRow[],
  today: string,
): LowestDailyCostItem[] {
  const itemsByDailyCost = rows
    .map((it) => {
      if (typeof it.priceCents !== "number") return null;
      const currency = (it.currency ?? DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY;
      const daysUsed = computeDaysUsed(it.purchasedDate, today);
      if (typeof daysUsed !== "number" || daysUsed < 1) return null;
      const dailyCents = Math.round(it.priceCents / daysUsed);
      return { ...it, currency, dailyCents };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort(
      (a, b) =>
        a.dailyCents - b.dailyCents || a.name.localeCompare(b.name, "zh-CN"),
    );

  const itemsByDailyCostByCurrency = new Map<string, typeof itemsByDailyCost>();
  for (const it of itemsByDailyCost) {
    const list = itemsByDailyCostByCurrency.get(it.currency) ?? [];
    list.push(it);
    itemsByDailyCostByCurrency.set(it.currency, list);
  }

  let primaryDailyCostItems: typeof itemsByDailyCost = [];

  for (const [, list] of itemsByDailyCostByCurrency.entries()) {
    list.sort(
      (a, b) =>
        a.dailyCents - b.dailyCents || a.name.localeCompare(b.name, "zh-CN"),
    );

    if (list.length > primaryDailyCostItems.length) {
      primaryDailyCostItems = list;
    }
  }

  return primaryDailyCostItems.slice(0, 3).map((it) => ({
    id: it.id,
    name: it.name,
    dailyCents: it.dailyCents,
    currency: it.currency,
  }));
}

type UpcomingTodoRow = { id: string; title: string; dueAt: Date | null };
type UpcomingSubscriptionRow = { id: string; name: string; nextRenewDate: string };

export function buildUpcomingItems(args: {
  upcomingTodos: UpcomingTodoRow[];
  upcomingAnniversaries: Array<Pick<AnniversaryWithNext, "id" | "title" | "dateType" | "at">>;
  upcomingSubscriptions: UpcomingSubscriptionRow[];
  dateReminderTime: string;
  timeZone: string;
}): UpcomingItem[] {
  const { upcomingTodos, upcomingAnniversaries, upcomingSubscriptions, dateReminderTime, timeZone } = args;

  const upcoming: UpcomingItem[] = [];

  for (const t of upcomingTodos) {
    if (!t.dueAt) continue;
    upcoming.push({ kind: "todo", at: t.dueAt, id: t.id, title: t.title });
  }

  for (const a of upcomingAnniversaries) {
    upcoming.push({
      kind: "anniversary",
      at: a.at,
      id: a.id,
      title: a.title,
      dateType: a.dateType,
    });
  }

  for (const s of upcomingSubscriptions) {
    const at = dateTimeLocalToUtcDate(`${s.nextRenewDate}T${dateReminderTime}`, timeZone);
    if (!at) continue;
    upcoming.push({ kind: "subscription", at, id: s.id, name: s.name });
  }

  upcoming.sort((a, b) => a.at.getTime() - b.at.getTime());

  return upcoming;
}
