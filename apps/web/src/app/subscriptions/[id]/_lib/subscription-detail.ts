import "server-only";

import { eq } from "drizzle-orm";

import { parseNumberArrayJson } from "@/lib/json";
import {
  DEFAULT_SUBSCRIPTION_CYCLE_UNIT,
  SUBSCRIPTION_CYCLE_UNIT,
  isSubscriptionCycleUnit,
  type SubscriptionCycleUnit,
} from "@/lib/subscriptions";
import { ROUTES } from "@/lib/routes";
import { diffDays, formatDateInTimeZone } from "@/server/date";
import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { subscriptions } from "@/server/db/schema";
import { buildDateReminderPreview } from "@/server/reminder-preview";

export type SubscriptionDetailItemData = {
  id: string;
  name: string;
  category: string;
  nextRenewDate: string;
  autoRenew: boolean;
  isArchived: boolean;
  cycleUnit: SubscriptionCycleUnit;
  cycleInterval: number;
  priceCents: number | null;
  currency: string;
  description: string | null;
  remindOffsetsDays: string;
};

export type SubscriptionDetailPageData = {
  item: SubscriptionDetailItemData;
  subscriptionDetailHref: string;
  offsets: number[];
  daysLeft: number | null;
  preview: ReturnType<typeof buildDateReminderPreview>;
  cycleLabel: string;
  archiveToggle: { value: "0" | "1"; label: string };
  timeZone: string;
};

export async function getSubscriptionDetailPageData(
  id: string,
): Promise<SubscriptionDetailPageData | null> {
  const { timeZone, dateReminderTime } = await getAppTimeSettings();
  const now = new Date();
  const today = formatDateInTimeZone(now, timeZone);

  const row = await db
    .select({
      id: subscriptions.id,
      name: subscriptions.name,
      category: subscriptions.category,
      nextRenewDate: subscriptions.nextRenewDate,
      autoRenew: subscriptions.autoRenew,
      isArchived: subscriptions.isArchived,
      cycleUnit: subscriptions.cycleUnit,
      cycleInterval: subscriptions.cycleInterval,
      priceCents: subscriptions.priceCents,
      currency: subscriptions.currency,
      description: subscriptions.description,
      remindOffsetsDays: subscriptions.remindOffsetsDays,
    })
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .get();
  if (!row) return null;

  const cycleUnit =
    typeof row.cycleUnit === "string" && isSubscriptionCycleUnit(row.cycleUnit)
      ? row.cycleUnit
      : DEFAULT_SUBSCRIPTION_CYCLE_UNIT;

  const item: SubscriptionDetailItemData = {
    ...row,
    cycleUnit,
  };

  const offsets = parseNumberArrayJson(item.remindOffsetsDays, { min: 0 });
  const daysLeft = diffDays(today, item.nextRenewDate);
  const preview = buildDateReminderPreview({
    baseDate: item.nextRenewDate,
    offsetsDays: offsets,
    dateReminderTime,
    timeZone,
  });
  const subscriptionDetailHref = `${ROUTES.subscriptions}/${item.id}`;
  const cycleLabel = item.cycleUnit === SUBSCRIPTION_CYCLE_UNIT.YEAR ? "年付" : "月付";
  const archiveToggle = item.isArchived
    ? { value: "0" as const, label: "取消归档" }
    : { value: "1" as const, label: "归档" };

  return {
    item,
    subscriptionDetailHref,
    offsets,
    daysLeft,
    preview,
    cycleLabel,
    archiveToggle,
    timeZone,
  };
}
