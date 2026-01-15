import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { items } from "@/server/db/schema";
import { formatDateInTimeZone } from "@/server/date";
import { computeDaysUsed } from "@/server/item-metrics";
import { DEFAULT_ITEM_STATUS, isItemStatus, type ItemStatus } from "@/lib/items";
import { ROUTES } from "@/lib/routes";

export type ItemDetailItemData = {
  id: string;
  name: string;
  category: string | null;
  status: ItemStatus;
  purchasedDate: string | null;
  priceCents: number | null;
  currency: string;
  usageCount: number;
  targetDailyCostCents: number | null;
};

export type ItemDetailPageData = {
  item: ItemDetailItemData;
  itemDetailHref: string;
  daysUsed: number | null;
  dailyCents: number | null;
  costPerUseCents: number | null;
  targetReached: boolean;
};

export async function getItemDetailPageData(id: string): Promise<ItemDetailPageData | null> {
  const { timeZone } = await getAppTimeSettings();
  const today = formatDateInTimeZone(new Date(), timeZone);

  const row = await db
    .select({
      id: items.id,
      name: items.name,
      category: items.category,
      status: items.status,
      purchasedDate: items.purchasedDate,
      priceCents: items.priceCents,
      currency: items.currency,
      usageCount: items.usageCount,
      targetDailyCostCents: items.targetDailyCostCents,
    })
    .from(items)
    .where(eq(items.id, id))
    .get();
  if (!row) return null;

  const status =
    typeof row.status === "string" && isItemStatus(row.status)
      ? row.status
      : DEFAULT_ITEM_STATUS;

  const item: ItemDetailItemData = {
    ...row,
    status,
  };

  const daysUsed = computeDaysUsed(item.purchasedDate, today);
  const dailyCents =
    typeof item.priceCents === "number" && typeof daysUsed === "number" && daysUsed > 0
      ? Math.round(item.priceCents / daysUsed)
      : null;

  const costPerUseCents =
    typeof item.priceCents === "number" && item.usageCount > 0
      ? Math.round(item.priceCents / item.usageCount)
      : null;

  const targetReached =
    typeof item.targetDailyCostCents === "number" &&
    typeof dailyCents === "number" &&
    dailyCents <= item.targetDailyCostCents;

  return {
    item,
    itemDetailHref: `${ROUTES.items}/${item.id}`,
    daysUsed,
    dailyCents,
    costPerUseCents,
    targetReached,
  };
}
