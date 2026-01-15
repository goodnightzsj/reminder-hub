import "server-only";

import { and, asc, desc, eq, inArray, ne, isNull, isNotNull, type SQL } from "drizzle-orm";

import type { AnniversaryCardItemData } from "@/app/_components/anniversary/AnniversaryCard";
import { diffDays, formatDateInTimeZone } from "@/server/date";
import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { anniversaries } from "@/server/db/schema";
import { getNextLunarOccurrenceDateString, getNextSolarOccurrenceDateString } from "@/server/anniversary";
import {
  ANNIVERSARY_DATE_TYPE,
  canonicalizeAnniversaryCategory,
  getAnniversaryCategoryAliases,
  getAnniversaryCategoryLabel,
} from "@/lib/anniversary";

import { ANNIVERSARY_FILTER, type AnniversaryFilter } from "./anniversary-filters";

export type AnniversaryListEntry = {
  item: AnniversaryCardItemData;
  daysLeft: number | null;
  nextDate: string | null;
};

type AnniversaryRow = {
  id: string;
  title: string;
  category: string;
  dateType: AnniversaryCardItemData["dateType"];
  isLeapMonth: boolean;
  date: string;
  isArchived: boolean;
  deletedAt: Date | null;
};

function buildAnniversaryOrderBy(filter: AnniversaryFilter): SQL[] {
  // Trash: sort by deletion time (oldest first)
  return filter === ANNIVERSARY_FILTER.TRASH
    ? [asc(anniversaries.deletedAt)]
    : [asc(anniversaries.isArchived), desc(anniversaries.createdAt)];
}

function buildAnniversaryBaseWhere(filter: AnniversaryFilter): SQL {
  const baseWhere =
    filter === ANNIVERSARY_FILTER.TRASH
      ? isNotNull(anniversaries.deletedAt)
      : isNull(anniversaries.deletedAt);

  if (filter === ANNIVERSARY_FILTER.ACTIVE) {
    return and(baseWhere, eq(anniversaries.isArchived, false)) ?? baseWhere;
  }
  if (filter === ANNIVERSARY_FILTER.ARCHIVED) {
    return and(baseWhere, eq(anniversaries.isArchived, true)) ?? baseWhere;
  }

  return baseWhere;
}

function buildAnniversaryWhere(filter: AnniversaryFilter, category: string | null): SQL {
  const baseWhere = buildAnniversaryBaseWhere(filter);
  if (!category) return baseWhere;

  const aliases = getAnniversaryCategoryAliases(category);
  const categoryCondition =
    aliases.length <= 1
      ? eq(anniversaries.category, aliases[0] ?? category)
      : inArray(anniversaries.category, aliases);

  return and(baseWhere, categoryCondition) ?? baseWhere;
}

export async function getAnniversariesPageData(args: {
  filter: AnniversaryFilter;
  categoryFilterCanonical: string | null;
}): Promise<{
  timeZone: string;
  dateReminderTime: string;
  items: AnniversaryListEntry[];
  distinctCategories: string[];
}> {
  const { timeZone, dateReminderTime } = await getAppTimeSettings();
  const today = formatDateInTimeZone(new Date(), timeZone);

  const whereForCategories = buildAnniversaryBaseWhere(args.filter);
  const where = buildAnniversaryWhere(args.filter, args.categoryFilterCanonical);
  const orderBy = buildAnniversaryOrderBy(args.filter);

  const rows: AnniversaryRow[] = await db
    .select({
      id: anniversaries.id,
      title: anniversaries.title,
      category: anniversaries.category,
      dateType: anniversaries.dateType,
      isLeapMonth: anniversaries.isLeapMonth,
      date: anniversaries.date,
      isArchived: anniversaries.isArchived,
      deletedAt: anniversaries.deletedAt,
    })
    .from(anniversaries)
    .where(where)
    .orderBy(...orderBy);

  const distinctCategoriesRaw = await db
    .selectDistinct({ name: anniversaries.category })
    .from(anniversaries)
    .where(
      and(
        isNotNull(anniversaries.category),
        ne(anniversaries.category, ""),
        whereForCategories,
      ),
    )
    .orderBy(anniversaries.category);

  const distinctCategories = Array.from(
    new Set(
      distinctCategoriesRaw
        .map((c) => (c.name ? canonicalizeAnniversaryCategory(c.name) : ""))
        .filter(Boolean),
    ),
  ).sort((a, b) =>
    getAnniversaryCategoryLabel(a).localeCompare(getAnniversaryCategoryLabel(b), "zh-CN"),
  );

  const itemsForUi: AnniversaryListEntry[] = rows.map((row) => {
    const nextDate =
      row.dateType === ANNIVERSARY_DATE_TYPE.SOLAR
        ? getNextSolarOccurrenceDateString(row.date, today)
        : getNextLunarOccurrenceDateString(row.date, today, { isLeapMonth: row.isLeapMonth });

    const daysLeft = nextDate ? diffDays(today, nextDate) : null;
    const item: AnniversaryCardItemData = {
      id: row.id,
      title: row.title,
      category: row.category,
      dateType: row.dateType,
      isLeapMonth: row.isLeapMonth,
      isArchived: row.isArchived,
      deletedAt: row.deletedAt,
    };

    return { item, daysLeft, nextDate };
  });

  return { timeZone, dateReminderTime, items: itemsForUi, distinctCategories };
}

