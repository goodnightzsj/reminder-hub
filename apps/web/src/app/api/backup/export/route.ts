import { NextResponse } from "next/server";

import type { BackupV2 } from "@/server/backup/backup-parser";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import {
  anniversaries,
  brandMetadata,
  digestDeliveries,
  items,
  notificationDeliveries,
  serviceIcons,
  subscriptions,
  todoSubtasks,
  todos,
} from "@/server/db/schema";

export const dynamic = "force-dynamic";

function toMs(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  return null;
}

function withDateFields<T extends Record<string, unknown>, K extends keyof T>(
  row: T,
  keys: readonly K[],
): T {
  const next = { ...row };
  for (const key of keys) {
    next[key] = toMs(row[key]) as T[K];
  }
  return next;
}

export async function GET() {
  const settings = await getAppSettings();

  const [
    todosRows,
    subtasksRows,
    anniversariesRows,
    subscriptionsRows,
    itemsRows,
    notificationDeliveriesRows,
    digestDeliveriesRows,
    serviceIconRows,
    brandMetadataRows,
  ] =
    await Promise.all([
      db.select().from(todos),
      db.select().from(todoSubtasks),
      db.select().from(anniversaries),
      db.select().from(subscriptions),
      db.select().from(items),
      db.select().from(notificationDeliveries),
      db.select().from(digestDeliveries),
      db.select().from(serviceIcons),
      db.select().from(brandMetadata),
    ]);

  const payload: BackupV2 = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    app: {
      timeZone: settings.timeZone,
      dateReminderTime: settings.dateReminderTime,
      settings: withDateFields(settings, ["createdAt", "updatedAt"]),
    },
    data: {
      todos: todosRows.map((row) =>
        withDateFields(row, ["dueAt", "completedAt", "archivedAt", "deletedAt", "createdAt", "updatedAt"]),
      ),
      todoSubtasks: subtasksRows.map((row) => withDateFields(row, ["createdAt", "updatedAt"])),
      anniversaries: anniversariesRows.map((row) =>
        withDateFields(row, ["archivedAt", "deletedAt", "createdAt", "updatedAt"]),
      ),
      subscriptions: subscriptionsRows.map((row) =>
        withDateFields(row, ["archivedAt", "deletedAt", "createdAt", "updatedAt"]),
      ),
      items: itemsRows.map((row) => withDateFields(row, ["deletedAt", "createdAt", "updatedAt"])),
      notificationDeliveries: notificationDeliveriesRows.map((row) =>
        withDateFields(row, ["scheduledAt", "sentAt", "createdAt", "updatedAt"]),
      ),
      digestDeliveries: digestDeliveriesRows.map((row) =>
        withDateFields(row, ["sentAt", "createdAt", "updatedAt"]),
      ),
      serviceIcons: serviceIconRows.map((row) =>
        withDateFields(row, ["lastFetchedAt", "createdAt", "updatedAt"]),
      ),
      brandMetadata: brandMetadataRows.map((row) => withDateFields(row, ["updatedAt"])),
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const filename = `todo-list-backup-${payload.exportedAt.replace(/[:.]/g, "-")}.json`;

  return new NextResponse(json, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
