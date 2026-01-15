import "server-only";

import { isItemStatus } from "@/lib/items";
import { items } from "@/server/db/schema";

import { asDateFromMs, asInteger, asString, hasOwn } from "./backup-parser.utils";

export function parseItemRow(row: Record<string, unknown>, index: number): typeof items.$inferInsert {
  const id = asString(row.id);
  const name = asString(row.name);
  if (!id) throw new Error(`items[${index}].id is missing`);
  if (!name) throw new Error(`items[${index}].name is missing`);

  const insert: typeof items.$inferInsert = { id, name };

  if (hasOwn(row, "priceCents")) {
    const value = row.priceCents;
    if (value === null) {
      insert.priceCents = null;
    } else {
      const int = asInteger(value);
      if (int === null) throw new Error(`items[${index}].priceCents must be integer|null`);
      insert.priceCents = int;
    }
  }

  if (hasOwn(row, "currency")) {
    const value = row.currency;
    if (typeof value !== "string") throw new Error(`items[${index}].currency must be string`);
    insert.currency = value;
  }

  if (hasOwn(row, "purchasedDate")) {
    const value = row.purchasedDate;
    const parsed = asString(value);
    if (value !== null && parsed === null) {
      throw new Error(`items[${index}].purchasedDate must be string|null`);
    }
    insert.purchasedDate = parsed;
  }

  if (hasOwn(row, "category")) {
    const value = row.category;
    const parsed = asString(value);
    if (value !== null && parsed === null) {
      throw new Error(`items[${index}].category must be string|null`);
    }
    insert.category = parsed;
  }

  if (hasOwn(row, "status")) {
    const value = row.status;
    if (typeof value !== "string") throw new Error(`items[${index}].status must be string`);
    if (!isItemStatus(value)) {
      throw new Error(`items[${index}].status is invalid`);
    }
    insert.status = value;
  }

  if (hasOwn(row, "usageCount")) {
    const value = asInteger(row.usageCount);
    if (value === null) throw new Error(`items[${index}].usageCount must be integer`);
    if (value < 0) throw new Error(`items[${index}].usageCount must be >= 0`);
    insert.usageCount = value;
  }

  if (hasOwn(row, "targetDailyCostCents")) {
    const value = row.targetDailyCostCents;
    if (value === null) {
      insert.targetDailyCostCents = null;
    } else {
      const int = asInteger(value);
      if (int === null) {
        throw new Error(`items[${index}].targetDailyCostCents must be integer|null`);
      }
      insert.targetDailyCostCents = int;
    }
  }

  if (hasOwn(row, "createdAt")) {
    const dateValue = asDateFromMs(row.createdAt);
    if (!dateValue) throw new Error(`items[${index}].createdAt must be ms timestamp`);
    insert.createdAt = dateValue;
  }

  if (hasOwn(row, "updatedAt")) {
    const dateValue = asDateFromMs(row.updatedAt);
    if (!dateValue) throw new Error(`items[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = dateValue;
  }

  return insert;
}
