import { NextResponse } from "next/server";

import type { BackupV1 } from "@/app/_actions/backup-parser";
import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import {
  anniversaries,
  items,
  notificationDeliveries,
  subscriptions,
  todoSubtasks,
  todos,
} from "@/server/db/schema";

export const dynamic = "force-dynamic";

function toMs(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  return null;
}

export async function GET() {
  const { timeZone, dateReminderTime } = await getAppTimeSettings();

  const [
    todosRows,
    subtasksRows,
    anniversariesRows,
    subscriptionsRows,
    itemsRows,
    deliveriesRows,
  ] =
    await Promise.all([
      db.select().from(todos),
      db.select().from(todoSubtasks),
      db.select().from(anniversaries),
      db.select().from(subscriptions),
      db.select().from(items),
      db.select().from(notificationDeliveries),
    ]);

  const payload: BackupV1 = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: {
      timeZone,
      dateReminderTime,
    },
    data: {
      todos: todosRows.map((r) => ({
        ...r,
        dueAt: toMs(r.dueAt),
        completedAt: toMs(r.completedAt),
        archivedAt: toMs(r.archivedAt),
        createdAt: toMs(r.createdAt),
        updatedAt: toMs(r.updatedAt),
      })),
      todoSubtasks: subtasksRows.map((r) => ({
        ...r,
        createdAt: toMs(r.createdAt),
        updatedAt: toMs(r.updatedAt),
      })),
      anniversaries: anniversariesRows.map((r) => ({
        ...r,
        archivedAt: toMs(r.archivedAt),
        createdAt: toMs(r.createdAt),
        updatedAt: toMs(r.updatedAt),
      })),
      subscriptions: subscriptionsRows.map((r) => ({
        ...r,
        archivedAt: toMs(r.archivedAt),
        createdAt: toMs(r.createdAt),
        updatedAt: toMs(r.updatedAt),
      })),
      items: itemsRows.map((r) => ({
        ...r,
        createdAt: toMs(r.createdAt),
        updatedAt: toMs(r.updatedAt),
      })),
      notificationDeliveries: deliveriesRows.map((r) => ({
        ...r,
        scheduledAt: toMs(r.scheduledAt),
        sentAt: toMs(r.sentAt),
        createdAt: toMs(r.createdAt),
        updatedAt: toMs(r.updatedAt),
      })),
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
