import "server-only";

import { and, asc, desc, eq, ne, or, isNotNull, isNull, type SQL } from "drizzle-orm";

import type { ItemCardItemData } from "@/app/_components/items/ItemCard";
import { formatDateInTimeZone } from "@/server/date";
import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { items } from "@/server/db/schema";
import { computeDaysUsed } from "@/server/item-metrics";
import { DEFAULT_ITEM_CATEGORY, ITEM_STATUS } from "@/lib/items";

import { ITEM_FILTER, type ItemFilter } from "./item-filters";

export type ItemListEntry = {
  item: ItemCardItemData;
  daysUsed: number | null;
  dailyCents: number | null;
};

type ItemRow = {
  id: string;
  name: string;
  category: string | null;
  status: ItemCardItemData["status"];
  purchasedDate: string | null;
  priceCents: number | null;
  currency: string;
  deletedAt: Date | null;
  createdAt: Date;
};

function canonicalizeItemCategory(category: string | null): string {
  const trimmed = (category ?? "").trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_ITEM_CATEGORY;
}

function buildItemOrderBy(filter: ItemFilter): SQL[] {
  // Trash: sort by deletion time (oldest first)
  return filter === ITEM_FILTER.TRASH
    ? [asc(items.deletedAt)]
    : [asc(items.status), desc(items.createdAt)];
}

function buildItemBaseWhere(filter: ItemFilter): SQL {
  const baseWhere =
    filter === ITEM_FILTER.TRASH
      ? isNotNull(items.deletedAt)
      : isNull(items.deletedAt);

  if (filter === ITEM_FILTER.ACTIVE) {
    return and(baseWhere, ne(items.status, ITEM_STATUS.RETIRED)) ?? baseWhere;
  }
  if (filter === ITEM_FILTER.USING) {
    return and(baseWhere, eq(items.status, ITEM_STATUS.USING)) ?? baseWhere;
  }
  if (filter === ITEM_FILTER.IDLE) {
    return and(baseWhere, eq(items.status, ITEM_STATUS.IDLE)) ?? baseWhere;
  }
  if (filter === ITEM_FILTER.RETIRED) {
    return and(baseWhere, eq(items.status, ITEM_STATUS.RETIRED)) ?? baseWhere;
  }

  return baseWhere;
}

function buildItemWhere(filter: ItemFilter, category: string | null): SQL {
  const baseWhere = buildItemBaseWhere(filter);
  if (!category) return baseWhere;
  if (category === DEFAULT_ITEM_CATEGORY) {
    return (
      and(
        baseWhere,
        or(isNull(items.category), eq(items.category, ""), eq(items.category, DEFAULT_ITEM_CATEGORY)),
      ) ?? baseWhere
    );
  }

  return and(baseWhere, eq(items.category, category)) ?? baseWhere;
}

export async function getItemsPageData(args: {
  filter: ItemFilter;
  categoryFilter: string | null;
}): Promise<{ items: ItemListEntry[]; distinctCategories: string[] }> {
  const where = buildItemWhere(args.filter, args.categoryFilter);
  const orderBy = buildItemOrderBy(args.filter);

  const rows: ItemRow[] = await db
    .select({
      id: items.id,
      name: items.name,
      category: items.category,
      status: items.status,
      purchasedDate: items.purchasedDate,
      priceCents: items.priceCents,
      currency: items.currency,
      deletedAt: items.deletedAt,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(where)
    .orderBy(...orderBy);

  const categoryBaseWhere = buildItemBaseWhere(args.filter);
  const distinctCategoriesRows = await db
    .selectDistinct({ name: items.category })
    .from(items)
    .where(categoryBaseWhere)
    .orderBy(items.category);

  const distinctCategories = Array.from(
    new Set(distinctCategoriesRows.map((c) => canonicalizeItemCategory(c.name))),
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));

  const { timeZone } = await getAppTimeSettings();
  const today = formatDateInTimeZone(new Date(), timeZone);

  const itemListEntries: ItemListEntry[] = rows.map((it) => {
    const dateToUse = it.purchasedDate ?? formatDateInTimeZone(it.createdAt, timeZone);
    const daysUsed = computeDaysUsed(dateToUse, today);
    const dailyCents =
      typeof it.priceCents === "number" && typeof daysUsed === "number" && daysUsed > 0
        ? Math.round(it.priceCents / daysUsed)
        : null;
    const itemForUi: ItemCardItemData = {
      id: it.id,
      name: it.name,
      category: canonicalizeItemCategory(it.category),
      status: it.status,
      purchasedDate: it.purchasedDate,
      priceCents: it.priceCents,
      currency: it.currency,
      deletedAt: it.deletedAt,
    };

    return { item: itemForUi, daysUsed, dailyCents };
  });

  return { items: itemListEntries, distinctCategories };
}
