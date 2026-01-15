import "server-only";

import {
  isNotificationChannel,
  isNotificationDeliveryStatus,
  isNotificationItemType,
} from "@/lib/notifications";
import { notificationDeliveries } from "@/server/db/schema";

import { asDateFromMs, asString, hasOwn } from "./backup-parser.utils";

export function parseNotificationDeliveryRow(
  row: Record<string, unknown>,
  index: number,
): typeof notificationDeliveries.$inferInsert {
  const id = asString(row.id);
  const itemTypeRaw = asString(row.itemType);
  const itemId = asString(row.itemId);
  const itemTitle = asString(row.itemTitle);
  if (!id) throw new Error(`notificationDeliveries[${index}].id is missing`);
  if (!itemTypeRaw) throw new Error(`notificationDeliveries[${index}].itemType is missing`);
  if (!itemId) throw new Error(`notificationDeliveries[${index}].itemId is missing`);
  if (!itemTitle) throw new Error(`notificationDeliveries[${index}].itemTitle is missing`);

  const scheduledAt = asDateFromMs(row.scheduledAt);
  if (!scheduledAt) throw new Error(`notificationDeliveries[${index}].scheduledAt is missing`);

  if (!isNotificationItemType(itemTypeRaw)) {
    throw new Error(`notificationDeliveries[${index}].itemType is invalid`);
  }
  const itemType = itemTypeRaw;

  const insert: typeof notificationDeliveries.$inferInsert = {
    id,
    itemType,
    itemId,
    itemTitle,
    scheduledAt,
  };

  if (hasOwn(row, "channel")) {
    const value = row.channel;
    if (typeof value !== "string") throw new Error(`notificationDeliveries[${index}].channel must be string`);
    if (!isNotificationChannel(value)) {
      throw new Error(`notificationDeliveries[${index}].channel is invalid`);
    }
    insert.channel = value;
  }

  if (hasOwn(row, "status")) {
    const value = row.status;
    if (typeof value !== "string") throw new Error(`notificationDeliveries[${index}].status must be string`);
    if (!isNotificationDeliveryStatus(value)) {
      throw new Error(`notificationDeliveries[${index}].status is invalid`);
    }
    insert.status = value;
  }

  if (hasOwn(row, "sentAt")) {
    const value = row.sentAt;
    if (value === null) {
      insert.sentAt = null;
    } else {
      const dateValue = asDateFromMs(value);
      if (!dateValue) throw new Error(`notificationDeliveries[${index}].sentAt must be ms timestamp|null`);
      insert.sentAt = dateValue;
    }
  }

  if (hasOwn(row, "error")) {
    const value = row.error;
    const parsed = asString(value);
    if (value !== null && parsed === null) {
      throw new Error(`notificationDeliveries[${index}].error must be string|null`);
    }
    insert.error = parsed;
  }

  if (hasOwn(row, "createdAt")) {
    const dateValue = asDateFromMs(row.createdAt);
    if (!dateValue) throw new Error(`notificationDeliveries[${index}].createdAt must be ms timestamp`);
    insert.createdAt = dateValue;
  }

  if (hasOwn(row, "updatedAt")) {
    const dateValue = asDateFromMs(row.updatedAt);
    if (!dateValue) throw new Error(`notificationDeliveries[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = dateValue;
  }

  return insert;
}
