import "server-only";

import { isDigestType } from "@/lib/digests";
import { isNotificationChannel, isNotificationDeliveryStatus } from "@/lib/notifications";
import { digestDeliveries } from "@/server/db/schema";

import { asDateFromMs, asString, hasOwn } from "./backup-parser.utils";

export function parseDigestDeliveryRow(
  row: Record<string, unknown>,
  index: number,
): typeof digestDeliveries.$inferInsert {
  const id = asString(row.id);
  const digestType = asString(row.digestType);
  const channel = asString(row.channel);
  const periodStart = asString(row.periodStart);
  const periodEnd = asString(row.periodEnd);

  if (!id) throw new Error(`digestDeliveries[${index}].id is missing`);
  if (!digestType) throw new Error(`digestDeliveries[${index}].digestType is missing`);
  if (!isDigestType(digestType)) throw new Error(`digestDeliveries[${index}].digestType is invalid`);
  if (!channel) throw new Error(`digestDeliveries[${index}].channel is missing`);
  if (!isNotificationChannel(channel)) throw new Error(`digestDeliveries[${index}].channel is invalid`);
  if (!periodStart) throw new Error(`digestDeliveries[${index}].periodStart is missing`);
  if (!periodEnd) throw new Error(`digestDeliveries[${index}].periodEnd is missing`);

  const insert: typeof digestDeliveries.$inferInsert = {
    id,
    digestType,
    channel,
    periodStart,
    periodEnd,
  };

  if (hasOwn(row, "status")) {
    const value = asString(row.status);
    if (!value) throw new Error(`digestDeliveries[${index}].status must be string`);
    if (!isNotificationDeliveryStatus(value)) {
      throw new Error(`digestDeliveries[${index}].status is invalid`);
    }
    insert.status = value;
  }

  if (hasOwn(row, "sentAt")) {
    if (row.sentAt === null) {
      insert.sentAt = null;
    } else {
      const value = asDateFromMs(row.sentAt);
      if (!value) throw new Error(`digestDeliveries[${index}].sentAt must be ms timestamp|null`);
      insert.sentAt = value;
    }
  }

  if (hasOwn(row, "error")) {
    const value = asString(row.error);
    if (row.error !== null && value === null) {
      throw new Error(`digestDeliveries[${index}].error must be string|null`);
    }
    insert.error = value;
  }

  if (hasOwn(row, "createdAt")) {
    const value = asDateFromMs(row.createdAt);
    if (!value) throw new Error(`digestDeliveries[${index}].createdAt must be ms timestamp`);
    insert.createdAt = value;
  }

  if (hasOwn(row, "updatedAt")) {
    const value = asDateFromMs(row.updatedAt);
    if (!value) throw new Error(`digestDeliveries[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = value;
  }

  return insert;
}
