import "server-only";

import { and, asc, desc, eq, ne, isNull, isNotNull, type SQL } from "drizzle-orm";

import { parseNumberArrayJson } from "@/lib/json";
import { diffDays, formatDateInTimeZone } from "@/server/date";
import { buildDateReminderPreview } from "@/server/reminder-preview";
import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { subscriptions, serviceIcons } from "@/server/db/schema";
import { buildSubscriptionCycleLabel } from "./subscription-cycle-label";
import { SUBSCRIPTION_FILTER, type SubscriptionFilter } from "./subscription-filters";

import type {
  SubscriptionCardItemData,
  SubscriptionCardPreviewItem,
} from "@/app/_components/subscriptions/SubscriptionCard.types";

export type SubscriptionListEntry = {
  item: SubscriptionCardItemData;
  cycleLabel: string;
  daysLeft: number | null;
  preview: SubscriptionCardPreviewItem[];
};

type SubscriptionRow = {
  id: string;
  name: string;
  category: string;
  priceCents: number | null;
  currency: string;
  cycleUnit: SubscriptionCardItemData["cycleUnit"];
  cycleInterval: number;
  nextRenewDate: string;
  autoRenew: boolean;
  remindOffsetsDays: string;
  isArchived: boolean;
  deletedAt: Date | null;
  icon: string | null;
  color: string | null;
  serviceIcon: string | null;
  serviceColor: string | null;
};

function buildSubscriptionOrderBy(filter: SubscriptionFilter): SQL[] {
  // Trash: sort by deletion time (oldest first). Default: newest first.
  return filter === SUBSCRIPTION_FILTER.TRASH
    ? [asc(subscriptions.deletedAt)]
    : [desc(subscriptions.createdAt)];
}

function buildSubscriptionBaseWhere(filter: SubscriptionFilter): SQL {
  const baseWhere =
    filter === SUBSCRIPTION_FILTER.TRASH
      ? isNotNull(subscriptions.deletedAt)
      : isNull(subscriptions.deletedAt);

  if (filter === SUBSCRIPTION_FILTER.ACTIVE) {
    return and(baseWhere, eq(subscriptions.isArchived, false)) ?? baseWhere;
  }
  if (filter === SUBSCRIPTION_FILTER.ARCHIVED) {
    return and(baseWhere, eq(subscriptions.isArchived, true)) ?? baseWhere;
  }

  return baseWhere;
}

function buildSubscriptionWhere(filter: SubscriptionFilter, category: string | null): SQL {
  const baseWhere = buildSubscriptionBaseWhere(filter);
  if (!category) return baseWhere;
  return and(baseWhere, eq(subscriptions.category, category)) ?? baseWhere;
}

export async function getSubscriptionsPageData(args: {
  filter: SubscriptionFilter;
  categoryFilter: string | null;
}): Promise<{
  timeZone: string;
  dateReminderTime: string;
  items: SubscriptionListEntry[];
  distinctCategories: string[];
}> {
  const { timeZone, dateReminderTime } = await getAppTimeSettings();
  const today = formatDateInTimeZone(new Date(), timeZone);

  const where = buildSubscriptionWhere(args.filter, args.categoryFilter);
  const orderBy = buildSubscriptionOrderBy(args.filter);

  const rows: SubscriptionRow[] = await db
    .select({
      id: subscriptions.id,
      name: subscriptions.name,
      category: subscriptions.category,
      priceCents: subscriptions.priceCents,
      currency: subscriptions.currency,
      cycleUnit: subscriptions.cycleUnit,
      cycleInterval: subscriptions.cycleInterval,
      nextRenewDate: subscriptions.nextRenewDate,
      autoRenew: subscriptions.autoRenew,
      remindOffsetsDays: subscriptions.remindOffsetsDays,
      isArchived: subscriptions.isArchived,
      deletedAt: subscriptions.deletedAt,
      icon: subscriptions.icon,
      color: subscriptions.color,
      serviceIcon: serviceIcons.icon,
      serviceColor: serviceIcons.color,
    })
    .from(subscriptions)
    .leftJoin(serviceIcons, eq(subscriptions.name, serviceIcons.name))
    .where(where)
    .orderBy(...orderBy);

  const itemsForUi: SubscriptionListEntry[] = rows.map((row) => {
    const icon = row.serviceIcon ?? row.icon;
    const color = row.serviceColor ?? row.color;

    const offsets = parseNumberArrayJson(row.remindOffsetsDays);
    const daysLeft = diffDays(today, row.nextRenewDate);
    const cycleLabel = buildSubscriptionCycleLabel(row.cycleUnit, row.cycleInterval);
    const preview = buildDateReminderPreview({
      baseDate: row.nextRenewDate,
      offsetsDays: offsets,
      dateReminderTime,
      timeZone,
    });

    const item: SubscriptionCardItemData = {
      id: row.id,
      name: row.name,
      category: row.category,
      priceCents: row.priceCents,
      currency: row.currency,
      cycleInterval: row.cycleInterval,
      cycleUnit: row.cycleUnit,
      autoRenew: row.autoRenew,
      nextRenewDate: row.nextRenewDate,
      isArchived: row.isArchived,
      deletedAt: row.deletedAt,
      icon,
      color,
    };

    return { item, cycleLabel, daysLeft, preview };
  });

  const categoryBaseWhere = buildSubscriptionBaseWhere(args.filter);
  const distinctCategoriesRows = await db
    .selectDistinct({ name: subscriptions.category })
    .from(subscriptions)
    .where(and(isNotNull(subscriptions.category), ne(subscriptions.category, ""), categoryBaseWhere))
    .orderBy(subscriptions.category);

  const distinctCategories = distinctCategoriesRows
    .map((c) => c.name)
    .filter((c): c is string => typeof c === "string" && c.length > 0);

  return { timeZone, dateReminderTime, items: itemsForUi, distinctCategories };
}
