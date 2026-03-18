import "server-only";

import { isSubscriptionCycleUnit } from "@/lib/subscriptions";
import { subscriptions } from "@/server/db/schema";

import { asBoolean, asDateFromMs, asInteger, asString, hasOwn } from "./backup-parser.utils";

export function parseSubscriptionRow(
  row: Record<string, unknown>,
  index: number,
): typeof subscriptions.$inferInsert {
  const id = asString(row.id);
  const name = asString(row.name);
  const nextRenewDate = asString(row.nextRenewDate);
  if (!id) throw new Error(`subscriptions[${index}].id is missing`);
  if (!name) throw new Error(`subscriptions[${index}].name is missing`);
  if (!nextRenewDate) throw new Error(`subscriptions[${index}].nextRenewDate is missing`);

  const insert: typeof subscriptions.$inferInsert = { id, name, nextRenewDate };

  if (hasOwn(row, "description")) {
    const value = row.description;
    const parsed = asString(value);
    if (value !== null && parsed === null) {
      throw new Error(`subscriptions[${index}].description must be string|null`);
    }
    insert.description = parsed;
  }

  if (hasOwn(row, "category")) {
    const value = row.category;
    if (typeof value !== "string") throw new Error(`subscriptions[${index}].category must be string`);
    insert.category = value;
  }

  if (hasOwn(row, "priceCents")) {
    const value = row.priceCents;
    if (value === null) {
      insert.priceCents = null;
    } else {
      const int = asInteger(value);
      if (int === null) throw new Error(`subscriptions[${index}].priceCents must be integer|null`);
      insert.priceCents = int;
    }
  }

  if (hasOwn(row, "currency")) {
    const value = row.currency;
    if (typeof value !== "string") throw new Error(`subscriptions[${index}].currency must be string`);
    insert.currency = value;
  }

  if (hasOwn(row, "cycleUnit")) {
    const value = row.cycleUnit;
    if (typeof value !== "string") throw new Error(`subscriptions[${index}].cycleUnit must be string`);
    if (!isSubscriptionCycleUnit(value)) {
      throw new Error(`subscriptions[${index}].cycleUnit is invalid`);
    }
    insert.cycleUnit = value;
  }

  if (hasOwn(row, "cycleInterval")) {
    const value = asInteger(row.cycleInterval);
    if (value === null) throw new Error(`subscriptions[${index}].cycleInterval must be integer`);
    insert.cycleInterval = value;
  }

  if (hasOwn(row, "autoRenew")) {
    const value = asBoolean(row.autoRenew);
    if (value === null) throw new Error(`subscriptions[${index}].autoRenew must be boolean`);
    insert.autoRenew = value;
  }

  if (hasOwn(row, "remindOffsetsDays")) {
    const value = row.remindOffsetsDays;
    if (typeof value !== "string") {
      throw new Error(`subscriptions[${index}].remindOffsetsDays must be string`);
    }
    insert.remindOffsetsDays = value;
  }

  if (hasOwn(row, "icon")) {
    const value = asString(row.icon);
    if (row.icon !== null && value === null) {
      throw new Error(`subscriptions[${index}].icon must be string|null`);
    }
    insert.icon = value;
  }

  if (hasOwn(row, "color")) {
    const value = asString(row.color);
    if (row.color !== null && value === null) {
      throw new Error(`subscriptions[${index}].color must be string|null`);
    }
    insert.color = value;
  }

  if (hasOwn(row, "isArchived")) {
    const value = asBoolean(row.isArchived);
    if (value === null) throw new Error(`subscriptions[${index}].isArchived must be boolean`);
    insert.isArchived = value;
  }

  if (hasOwn(row, "archivedAt")) {
    const value = row.archivedAt;
    if (value === null) {
      insert.archivedAt = null;
    } else {
      const dateValue = asDateFromMs(value);
      if (!dateValue) throw new Error(`subscriptions[${index}].archivedAt must be ms timestamp|null`);
      insert.archivedAt = dateValue;
    }
  }

  if (hasOwn(row, "deletedAt")) {
    const value = row.deletedAt;
    if (value === null) {
      insert.deletedAt = null;
    } else {
      const dateValue = asDateFromMs(value);
      if (!dateValue) throw new Error(`subscriptions[${index}].deletedAt must be ms timestamp|null`);
      insert.deletedAt = dateValue;
    }
  }

  if (hasOwn(row, "createdAt")) {
    const dateValue = asDateFromMs(row.createdAt);
    if (!dateValue) throw new Error(`subscriptions[${index}].createdAt must be ms timestamp`);
    insert.createdAt = dateValue;
  }

  if (hasOwn(row, "updatedAt")) {
    const dateValue = asDateFromMs(row.updatedAt);
    if (!dateValue) throw new Error(`subscriptions[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = dateValue;
  }

  return insert;
}
