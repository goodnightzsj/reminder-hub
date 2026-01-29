import "server-only";

import { canonicalizeAnniversaryCategory, isAnniversaryDateType } from "@/lib/anniversary";
import { anniversaries } from "@/server/db/schema";

import { asBoolean, asDateFromMs, asString, hasOwn } from "./backup-parser.utils";

export function parseAnniversaryRow(
  row: Record<string, unknown>,
  index: number,
): typeof anniversaries.$inferInsert {
  const id = asString(row.id);
  const title = asString(row.title);
  const date = asString(row.date);
  if (!id) throw new Error(`anniversaries[${index}].id is missing`);
  if (!title) throw new Error(`anniversaries[${index}].title is missing`);
  if (!date) throw new Error(`anniversaries[${index}].date is missing`);

  const insert: typeof anniversaries.$inferInsert = { id, title, date };

  if (hasOwn(row, "category")) {
    const value = row.category;
    if (typeof value !== "string") throw new Error(`anniversaries[${index}].category must be string`);
    insert.category = canonicalizeAnniversaryCategory(value);
  }

  if (hasOwn(row, "dateType")) {
    const value = row.dateType;
    if (typeof value !== "string") throw new Error(`anniversaries[${index}].dateType must be string`);
    if (!isAnniversaryDateType(value)) {
      throw new Error(`anniversaries[${index}].dateType is invalid`);
    }
    insert.dateType = value;
  }

  if (hasOwn(row, "isLeapMonth")) {
    const value = asBoolean(row.isLeapMonth);
    if (value === null) throw new Error(`anniversaries[${index}].isLeapMonth must be boolean`);
    insert.isLeapMonth = value;
  }

  if (hasOwn(row, "remindOffsetsDays")) {
    const value = row.remindOffsetsDays;
    if (typeof value !== "string") {
      throw new Error(`anniversaries[${index}].remindOffsetsDays must be string`);
    }
    insert.remindOffsetsDays = value;
  }

  if (hasOwn(row, "isArchived")) {
    const value = asBoolean(row.isArchived);
    if (value === null) throw new Error(`anniversaries[${index}].isArchived must be boolean`);
    insert.isArchived = value;
  }

  if (hasOwn(row, "archivedAt")) {
    const value = row.archivedAt;
    if (value === null) {
      insert.archivedAt = null;
    } else {
      const dateValue = asDateFromMs(value);
      if (!dateValue) throw new Error(`anniversaries[${index}].archivedAt must be ms timestamp|null`);
      insert.archivedAt = dateValue;
    }
  }

  if (hasOwn(row, "createdAt")) {
    const dateValue = asDateFromMs(row.createdAt);
    if (!dateValue) throw new Error(`anniversaries[${index}].createdAt must be ms timestamp`);
    insert.createdAt = dateValue;
  }

  if (hasOwn(row, "updatedAt")) {
    const dateValue = asDateFromMs(row.updatedAt);
    if (!dateValue) throw new Error(`anniversaries[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = dateValue;
  }

  return insert;
}
