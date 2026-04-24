import "server-only";

import type { InferSelectModel } from "drizzle-orm";

import {
  anniversaries,
  items,
  subscriptions,
  todos,
  todoSubtasks,
} from "@/server/db/schema";

/**
 * SQLite stores JSON fields as strings and timestamps as numbers.
 * Serializers convert raw rows into a client-friendly JSON shape.
 */

function toIsoOrNull(value: Date | null | undefined): string | null {
  return value instanceof Date ? value.toISOString() : null;
}

function parseJsonArray(value: string | null | undefined, fallback: unknown[] = []): unknown[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function serializeTodo(row: InferSelectModel<typeof todos>) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    taskType: row.taskType,
    priority: row.priority,
    tags: parseJsonArray(row.tags),
    dueAt: toIsoOrNull(row.dueAt),
    reminderOffsetsMinutes: parseJsonArray(row.reminderOffsetsMinutes),
    recurrenceRule: row.recurrenceRule,
    recurrenceRootId: row.recurrenceRootId,
    recurrenceNextId: row.recurrenceNextId,
    isDone: row.isDone,
    completedAt: toIsoOrNull(row.completedAt),
    isArchived: row.isArchived,
    archivedAt: toIsoOrNull(row.archivedAt),
    deletedAt: toIsoOrNull(row.deletedAt),
    createdAt: toIsoOrNull(row.createdAt),
    updatedAt: toIsoOrNull(row.updatedAt),
  };
}

export function serializeSubtask(row: InferSelectModel<typeof todoSubtasks>) {
  return {
    id: row.id,
    todoId: row.todoId,
    title: row.title,
    isDone: row.isDone,
    createdAt: toIsoOrNull(row.createdAt),
    updatedAt: toIsoOrNull(row.updatedAt),
  };
}

export function serializeAnniversary(row: InferSelectModel<typeof anniversaries>) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    dateType: row.dateType,
    isLeapMonth: row.isLeapMonth,
    date: row.date,
    remindOffsetsDays: parseJsonArray(row.remindOffsetsDays),
    isArchived: row.isArchived,
    archivedAt: toIsoOrNull(row.archivedAt),
    deletedAt: toIsoOrNull(row.deletedAt),
    createdAt: toIsoOrNull(row.createdAt),
    updatedAt: toIsoOrNull(row.updatedAt),
  };
}

export function serializeSubscription(row: InferSelectModel<typeof subscriptions>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    category: row.category,
    currency: row.currency,
    cycleUnit: row.cycleUnit,
    cycleInterval: row.cycleInterval,
    nextRenewDate: row.nextRenewDate,
    autoRenew: row.autoRenew,
    remindOffsetsDays: parseJsonArray(row.remindOffsetsDays),
    icon: row.icon,
    color: row.color,
    isArchived: row.isArchived,
    archivedAt: toIsoOrNull(row.archivedAt),
    deletedAt: toIsoOrNull(row.deletedAt),
    createdAt: toIsoOrNull(row.createdAt),
    updatedAt: toIsoOrNull(row.updatedAt),
  };
}

export function serializeItem(row: InferSelectModel<typeof items>) {
  return {
    id: row.id,
    name: row.name,
    priceCents: row.priceCents,
    currency: row.currency,
    purchasedDate: row.purchasedDate,
    category: row.category,
    status: row.status,
    usageCount: row.usageCount,
    targetDailyCostCents: row.targetDailyCostCents,
    deletedAt: toIsoOrNull(row.deletedAt),
    createdAt: toIsoOrNull(row.createdAt),
    updatedAt: toIsoOrNull(row.updatedAt),
  };
}
