import "server-only";

import { eq } from "drizzle-orm";

import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
  parseMonthDayString,
  type MonthDay,
} from "@/server/anniversary";
import { diffDays, formatDateInTimeZone } from "@/server/date";
import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { anniversaries } from "@/server/db/schema";
import {
  ANNIVERSARY_DATE_TYPE,
  DEFAULT_ANNIVERSARY_DATE_TYPE,
  isAnniversaryDateType,
  type AnniversaryDateType,
} from "@/lib/anniversary";
import { parseNumberArrayJson } from "@/lib/json";

export type AnniversaryDetailItemData = {
  id: string;
  title: string;
  category: string;
  dateType: AnniversaryDateType;
  isLeapMonth: boolean;
  date: string;
  remindOffsetsDays: string;
  isArchived: boolean;
};

export type AnniversaryDetailPageData = {
  item: AnniversaryDetailItemData;
  offsets: number[];
  nextDate: string | null;
  daysLeft: number | null;
  lunarMd: MonthDay | null;
  enteredDateLabel: string;
  archiveToggle: { value: "0" | "1"; label: string };
  defaultSolarDate: string | undefined;
};

export async function getAnniversaryDetailPageData(
  id: string,
): Promise<AnniversaryDetailPageData | null> {
  const { timeZone } = await getAppTimeSettings();
  const today = formatDateInTimeZone(new Date(), timeZone);

  const row = await db
    .select({
      id: anniversaries.id,
      title: anniversaries.title,
      category: anniversaries.category,
      dateType: anniversaries.dateType,
      isLeapMonth: anniversaries.isLeapMonth,
      date: anniversaries.date,
      remindOffsetsDays: anniversaries.remindOffsetsDays,
      isArchived: anniversaries.isArchived,
    })
    .from(anniversaries)
    .where(eq(anniversaries.id, id))
    .get();
  if (!row) return null;

  const dateType =
    typeof row.dateType === "string" && isAnniversaryDateType(row.dateType)
      ? row.dateType
      : DEFAULT_ANNIVERSARY_DATE_TYPE;

  const item: AnniversaryDetailItemData = {
    ...row,
    dateType,
  };

  const offsets = parseNumberArrayJson(item.remindOffsetsDays, { min: 0 });
  const nextDate =
    item.dateType === ANNIVERSARY_DATE_TYPE.SOLAR
      ? getNextSolarOccurrenceDateString(item.date, today)
      : getNextLunarOccurrenceDateString(item.date, today, {
          isLeapMonth: item.isLeapMonth,
        });
  const daysLeft = nextDate ? diffDays(today, nextDate) : null;

  const lunarMd =
    item.dateType === ANNIVERSARY_DATE_TYPE.LUNAR ? parseMonthDayString(item.date) : null;

  let enteredDateLabel =
    item.dateType === ANNIVERSARY_DATE_TYPE.SOLAR ? item.date : `农历${item.date}`;
  if (item.dateType === ANNIVERSARY_DATE_TYPE.LUNAR && lunarMd) {
    enteredDateLabel = `农历${item.isLeapMonth ? "闰" : ""}${lunarMd.month}月${lunarMd.day}日`;
  }

  const archiveToggle = item.isArchived
    ? { value: "0" as const, label: "取消归档" }
    : { value: "1" as const, label: "归档" };
  const defaultSolarDate = item.dateType === ANNIVERSARY_DATE_TYPE.SOLAR ? item.date : undefined;

  return {
    item,
    offsets,
    nextDate,
    daysLeft,
    lunarMd,
    enteredDateLabel,
    archiveToggle,
    defaultSolarDate,
  };
}
