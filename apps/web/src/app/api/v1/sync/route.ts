import { NextRequest } from "next/server";

import { eq, gt, or } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import {
  serializeAnniversary,
  serializeItem,
  serializeSubscription,
  serializeTodo,
} from "@/server/api/serializers";
import { db } from "@/server/db";
import { anniversaries, items, subscriptions, todos } from "@/server/db/schema";

export const dynamic = "force-dynamic";

/**
 * Sync protocol (Last-Write-Wins by updated_at):
 *
 * Request body:
 * {
 *   since: <iso timestamp | null>,   // client's last successful sync
 *   changes: {
 *     todos?: [{ id, updatedAt, ... full row ... }],
 *     anniversaries?: [...],
 *     subscriptions?: [...],
 *     items?: [...],
 *   }
 * }
 *
 * Response:
 * {
 *   serverTime: <iso>,
 *   changes: {
 *     todos: [...rows updated since `since`],
 *     anniversaries: [...],
 *     subscriptions: [...],
 *     items: [...],
 *   }
 * }
 *
 * Conflict resolution: for each client-provided record, if server has a row
 * with the same id and larger updated_at, server wins (client's write is
 * discarded); otherwise server upserts client's row.
 */

type AnyRecord = Record<string, unknown>;

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function jsonStringifyArray(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "string") return value; // already serialized
  return "[]";
}

export async function POST(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  let body: {
    since?: string | null;
    changes?: {
      todos?: AnyRecord[];
      anniversaries?: AnyRecord[];
      subscriptions?: AnyRecord[];
      items?: AnyRecord[];
    };
  };
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json");
  }

  const sinceDate = parseIsoDate(body.since) ?? new Date(0);
  const serverNow = new Date();
  const clientChanges = body.changes ?? {};

  // --- Apply client changes (LWW) ---
  if (Array.isArray(clientChanges.todos)) {
    for (const row of clientChanges.todos) {
      await applyTodoChange(row);
    }
  }
  if (Array.isArray(clientChanges.anniversaries)) {
    for (const row of clientChanges.anniversaries) {
      await applyAnniversaryChange(row);
    }
  }
  if (Array.isArray(clientChanges.subscriptions)) {
    for (const row of clientChanges.subscriptions) {
      await applySubscriptionChange(row);
    }
  }
  if (Array.isArray(clientChanges.items)) {
    for (const row of clientChanges.items) {
      await applyItemChange(row);
    }
  }

  // --- Collect server changes newer than `since` ---
  // We always include soft-deleted rows so clients learn about deletions.
  const updatedOrDeletedAfter = (tbl: typeof todos | typeof anniversaries | typeof subscriptions | typeof items) =>
    or(gt(tbl.updatedAt, sinceDate), gt(tbl.deletedAt, sinceDate));

  const serverTodos = await db.select().from(todos).where(updatedOrDeletedAfter(todos));
  const serverAnnivs = await db.select().from(anniversaries).where(updatedOrDeletedAfter(anniversaries));
  const serverSubs = await db.select().from(subscriptions).where(updatedOrDeletedAfter(subscriptions));
  const serverItems = await db.select().from(items).where(updatedOrDeletedAfter(items));

  return jsonOk({
    serverTime: serverNow.toISOString(),
    changes: {
      todos: serverTodos.map(serializeTodo),
      anniversaries: serverAnnivs.map(serializeAnniversary),
      subscriptions: serverSubs.map(serializeSubscription),
      items: serverItems.map(serializeItem),
    },
  });
}

async function applyTodoChange(row: AnyRecord) {
  const id = typeof row.id === "string" ? row.id : null;
  const updatedAt = parseIsoDate(row.updatedAt);
  if (!id || !updatedAt) return;

  const existing = await db.select({ updatedAt: todos.updatedAt }).from(todos).where(eq(todos.id, id)).get();
  if (existing && existing.updatedAt && existing.updatedAt >= updatedAt) return; // server wins

  const values = {
    id,
    title: typeof row.title === "string" ? row.title : "",
    description: typeof row.description === "string" ? row.description : null,
    taskType: typeof row.taskType === "string" ? row.taskType : undefined,
    priority: typeof row.priority === "string" ? row.priority : undefined,
    tags: jsonStringifyArray(row.tags),
    dueAt: parseIsoDate(row.dueAt),
    reminderOffsetsMinutes: jsonStringifyArray(row.reminderOffsetsMinutes),
    recurrenceRule: typeof row.recurrenceRule === "string" ? row.recurrenceRule : null,
    recurrenceRootId: typeof row.recurrenceRootId === "string" ? row.recurrenceRootId : null,
    recurrenceNextId: typeof row.recurrenceNextId === "string" ? row.recurrenceNextId : null,
    isDone: row.isDone === true,
    completedAt: parseIsoDate(row.completedAt),
    isArchived: row.isArchived === true,
    archivedAt: parseIsoDate(row.archivedAt),
    deletedAt: parseIsoDate(row.deletedAt),
    updatedAt,
  };

  const { id: _ignored, ...updateSet } = values;
  void _ignored;
  await db
    .insert(todos)
    .values(values as typeof todos.$inferInsert)
    .onConflictDoUpdate({
      target: todos.id,
      set: updateSet as Partial<typeof todos.$inferInsert>,
    });
}

async function applyAnniversaryChange(row: AnyRecord) {
  const id = typeof row.id === "string" ? row.id : null;
  const updatedAt = parseIsoDate(row.updatedAt);
  if (!id || !updatedAt) return;

  const existing = await db.select({ updatedAt: anniversaries.updatedAt }).from(anniversaries).where(eq(anniversaries.id, id)).get();
  if (existing && existing.updatedAt && existing.updatedAt >= updatedAt) return;

  const values = {
    id,
    title: typeof row.title === "string" ? row.title : "",
    category: typeof row.category === "string" ? row.category : undefined,
    dateType: typeof row.dateType === "string" ? row.dateType : undefined,
    isLeapMonth: row.isLeapMonth === true,
    date: typeof row.date === "string" ? row.date : "",
    remindOffsetsDays: jsonStringifyArray(row.remindOffsetsDays),
    isArchived: row.isArchived === true,
    archivedAt: parseIsoDate(row.archivedAt),
    deletedAt: parseIsoDate(row.deletedAt),
    updatedAt,
  };

  const { id: _ignored, ...updateSet } = values;
  void _ignored;
  await db
    .insert(anniversaries)
    .values(values as typeof anniversaries.$inferInsert)
    .onConflictDoUpdate({
      target: anniversaries.id,
      set: updateSet as Partial<typeof anniversaries.$inferInsert>,
    });
}

async function applySubscriptionChange(row: AnyRecord) {
  const id = typeof row.id === "string" ? row.id : null;
  const updatedAt = parseIsoDate(row.updatedAt);
  if (!id || !updatedAt) return;

  const existing = await db.select({ updatedAt: subscriptions.updatedAt }).from(subscriptions).where(eq(subscriptions.id, id)).get();
  if (existing && existing.updatedAt && existing.updatedAt >= updatedAt) return;

  const values = {
    id,
    name: typeof row.name === "string" ? row.name : "",
    description: typeof row.description === "string" ? row.description : null,
    priceCents: typeof row.priceCents === "number" ? row.priceCents : null,
    category: typeof row.category === "string" ? row.category : undefined,
    currency: typeof row.currency === "string" ? row.currency : undefined,
    cycleUnit: typeof row.cycleUnit === "string" ? row.cycleUnit : undefined,
    cycleInterval: typeof row.cycleInterval === "number" ? row.cycleInterval : 1,
    nextRenewDate: typeof row.nextRenewDate === "string" ? row.nextRenewDate : "",
    autoRenew: row.autoRenew !== false,
    remindOffsetsDays: jsonStringifyArray(row.remindOffsetsDays),
    icon: typeof row.icon === "string" ? row.icon : null,
    color: typeof row.color === "string" ? row.color : null,
    isArchived: row.isArchived === true,
    archivedAt: parseIsoDate(row.archivedAt),
    deletedAt: parseIsoDate(row.deletedAt),
    updatedAt,
  };

  const { id: _ignored, ...updateSet } = values;
  void _ignored;
  await db
    .insert(subscriptions)
    .values(values as typeof subscriptions.$inferInsert)
    .onConflictDoUpdate({
      target: subscriptions.id,
      set: updateSet as Partial<typeof subscriptions.$inferInsert>,
    });
}

async function applyItemChange(row: AnyRecord) {
  const id = typeof row.id === "string" ? row.id : null;
  const updatedAt = parseIsoDate(row.updatedAt);
  if (!id || !updatedAt) return;

  const existing = await db.select({ updatedAt: items.updatedAt }).from(items).where(eq(items.id, id)).get();
  if (existing && existing.updatedAt && existing.updatedAt >= updatedAt) return;

  const values = {
    id,
    name: typeof row.name === "string" ? row.name : "",
    priceCents: typeof row.priceCents === "number" ? row.priceCents : null,
    currency: typeof row.currency === "string" ? row.currency : undefined,
    purchasedDate: typeof row.purchasedDate === "string" ? row.purchasedDate : null,
    category: typeof row.category === "string" ? row.category : null,
    status: typeof row.status === "string" ? row.status : undefined,
    usageCount: typeof row.usageCount === "number" ? row.usageCount : 0,
    targetDailyCostCents: typeof row.targetDailyCostCents === "number" ? row.targetDailyCostCents : null,
    deletedAt: parseIsoDate(row.deletedAt),
    updatedAt,
  };

  const { id: _ignored, ...updateSet } = values;
  void _ignored;
  await db
    .insert(items)
    .values(values as typeof items.$inferInsert)
    .onConflictDoUpdate({
      target: items.id,
      set: updateSet as Partial<typeof items.$inferInsert>,
    });
}
