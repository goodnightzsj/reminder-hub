"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isValidTimeZone } from "@/server/datetime";
import { db } from "@/server/db";
import { setAppDateReminderTime, setAppTimeZone } from "@/server/db/settings";
import {
  anniversaries,
  anniversaryCategoryValues,
  anniversaryDateTypeValues,
  items,
  itemStatusValues,
  notificationDeliveries,
  notificationDeliveryStatusValues,
  notificationChannelValues,
  notificationItemTypeValues,
  subscriptions,
  subscriptionCycleUnitValues,
  todoSubtasks,
  todos,
  todoPriorityValues,
} from "@/server/db/schema";

type BackupV1 = {
  schemaVersion: 1;
  exportedAt: string;
  app: {
    timeZone: string;
    dateReminderTime?: string;
  };
  data: {
    todos: Array<Record<string, unknown>>;
    todoSubtasks: Array<Record<string, unknown>>;
    anniversaries: Array<Record<string, unknown>>;
    subscriptions: Array<Record<string, unknown>>;
    items: Array<Record<string, unknown>>;
    notificationDeliveries: Array<Record<string, unknown>>;
  };
};

function isValidTimeOfDay(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && (value === 0 || value === 1)) return value === 1;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "true" || trimmed === "1") return true;
    if (trimmed === "false" || trimmed === "0") return false;
  }
  return null;
}

function asInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const int = Math.trunc(value);
  if (int !== value) return null;
  return int;
}

function asDateFromMs(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const ms = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(ms)) return null;
      const date = new Date(ms);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const ms = Date.parse(trimmed);
    if (!Number.isFinite(ms)) return null;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function parseBackupV1(value: unknown): BackupV1 | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== 1) return null;
  if (typeof value.exportedAt !== "string") return null;
  if (!isRecord(value.app) || typeof value.app.timeZone !== "string") return null;
  const dateReminderTimeValue = (value.app as Record<string, unknown>).dateReminderTime;
  if (dateReminderTimeValue !== undefined && typeof dateReminderTimeValue !== "string") return null;
  if (!isRecord(value.data)) return null;

  const data = value.data as Record<string, unknown>;
  const todosValue = data.todos;
  const todoSubtasksValue = data.todoSubtasks;
  const anniversariesValue = data.anniversaries;
  const subscriptionsValue = data.subscriptions;
  const itemsValue = data.items;
  const notificationDeliveriesValue = data.notificationDeliveries;

  if (todosValue !== undefined && !Array.isArray(todosValue)) return null;
  if (todoSubtasksValue !== undefined && !Array.isArray(todoSubtasksValue)) return null;
  if (anniversariesValue !== undefined && !Array.isArray(anniversariesValue)) return null;
  if (subscriptionsValue !== undefined && !Array.isArray(subscriptionsValue)) return null;
  if (itemsValue !== undefined && !Array.isArray(itemsValue)) return null;
  if (notificationDeliveriesValue !== undefined && !Array.isArray(notificationDeliveriesValue)) return null;

  return {
    schemaVersion: 1,
    exportedAt: value.exportedAt,
    app: {
      timeZone: value.app.timeZone,
      dateReminderTime: typeof dateReminderTimeValue === "string" ? dateReminderTimeValue : undefined,
    },
    data: {
      todos: (Array.isArray(todosValue) ? todosValue : []) as Array<Record<string, unknown>>,
      todoSubtasks: (Array.isArray(todoSubtasksValue)
        ? todoSubtasksValue
        : []) as Array<Record<string, unknown>>,
      anniversaries: (Array.isArray(anniversariesValue)
        ? anniversariesValue
        : []) as Array<Record<string, unknown>>,
      subscriptions: (Array.isArray(subscriptionsValue)
        ? subscriptionsValue
        : []) as Array<Record<string, unknown>>,
      items: (Array.isArray(itemsValue) ? itemsValue : []) as Array<Record<string, unknown>>,
      notificationDeliveries: (Array.isArray(notificationDeliveriesValue)
        ? notificationDeliveriesValue
        : []) as Array<Record<string, unknown>>,
    },
  };
}

function parseTodoRow(row: Record<string, unknown>, index: number): typeof todos.$inferInsert {
  const id = asString(row.id);
  const title = asString(row.title);
  if (!id) throw new Error(`todos[${index}].id is missing`);
  if (!title) throw new Error(`todos[${index}].title is missing`);

  const insert: typeof todos.$inferInsert = { id, title };

  if (hasOwn(row, "description")) {
    const value = row.description;
    if (value !== null && typeof value !== "string") {
      throw new Error(`todos[${index}].description must be string|null`);
    }
    insert.description = value as string | null;
  }

  if (hasOwn(row, "taskType")) {
    const value = row.taskType;
    if (typeof value !== "string") throw new Error(`todos[${index}].taskType must be string`);
    insert.taskType = value;
  }

  if (hasOwn(row, "priority")) {
    const value = row.priority;
    if (typeof value !== "string") throw new Error(`todos[${index}].priority must be string`);
    if (!todoPriorityValues.includes(value as (typeof todoPriorityValues)[number])) {
      throw new Error(`todos[${index}].priority is invalid`);
    }
    insert.priority = value as (typeof todoPriorityValues)[number];
  }

  if (hasOwn(row, "tags")) {
    const value = row.tags;
    if (typeof value !== "string") throw new Error(`todos[${index}].tags must be string`);
    insert.tags = value;
  }

  if (hasOwn(row, "reminderOffsetsMinutes")) {
    const value = row.reminderOffsetsMinutes;
    if (typeof value !== "string") {
      throw new Error(`todos[${index}].reminderOffsetsMinutes must be string`);
    }
    insert.reminderOffsetsMinutes = value;
  }

  if (hasOwn(row, "recurrenceRule")) {
    const value = row.recurrenceRule;
    if (value !== null && typeof value !== "string") {
      throw new Error(`todos[${index}].recurrenceRule must be string|null`);
    }
    insert.recurrenceRule = value as string | null;
  }

  if (hasOwn(row, "recurrenceRootId")) {
    const value = row.recurrenceRootId;
    if (value !== null && typeof value !== "string") {
      throw new Error(`todos[${index}].recurrenceRootId must be string|null`);
    }
    insert.recurrenceRootId = value as string | null;
  }

  if (hasOwn(row, "recurrenceNextId")) {
    const value = row.recurrenceNextId;
    if (value !== null && typeof value !== "string") {
      throw new Error(`todos[${index}].recurrenceNextId must be string|null`);
    }
    insert.recurrenceNextId = value as string | null;
  }

  if (hasOwn(row, "isDone")) {
    const value = asBoolean(row.isDone);
    if (value === null) throw new Error(`todos[${index}].isDone must be boolean`);
    insert.isDone = value;
  }

  if (hasOwn(row, "isArchived")) {
    const value = asBoolean(row.isArchived);
    if (value === null) throw new Error(`todos[${index}].isArchived must be boolean`);
    insert.isArchived = value;
  }

  if (hasOwn(row, "dueAt")) {
    const value = row.dueAt;
    if (value === null) {
      insert.dueAt = null;
    } else {
      const date = asDateFromMs(value);
      if (!date) throw new Error(`todos[${index}].dueAt must be ms timestamp|null`);
      insert.dueAt = date;
    }
  }

  if (hasOwn(row, "completedAt")) {
    const value = row.completedAt;
    if (value === null) {
      insert.completedAt = null;
    } else {
      const date = asDateFromMs(value);
      if (!date) throw new Error(`todos[${index}].completedAt must be ms timestamp|null`);
      insert.completedAt = date;
    }
  }

  if (hasOwn(row, "archivedAt")) {
    const value = row.archivedAt;
    if (value === null) {
      insert.archivedAt = null;
    } else {
      const date = asDateFromMs(value);
      if (!date) throw new Error(`todos[${index}].archivedAt must be ms timestamp|null`);
      insert.archivedAt = date;
    }
  }

  if (hasOwn(row, "createdAt")) {
    const date = asDateFromMs(row.createdAt);
    if (!date) throw new Error(`todos[${index}].createdAt must be ms timestamp`);
    insert.createdAt = date;
  }

  if (hasOwn(row, "updatedAt")) {
    const date = asDateFromMs(row.updatedAt);
    if (!date) throw new Error(`todos[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = date;
  }

  return insert;
}

function parseTodoSubtaskRow(
  row: Record<string, unknown>,
  index: number,
): typeof todoSubtasks.$inferInsert {
  const id = asString(row.id);
  const todoId = asString(row.todoId);
  const title = asString(row.title);
  if (!id) throw new Error(`todoSubtasks[${index}].id is missing`);
  if (!todoId) throw new Error(`todoSubtasks[${index}].todoId is missing`);
  if (!title) throw new Error(`todoSubtasks[${index}].title is missing`);

  const insert: typeof todoSubtasks.$inferInsert = { id, todoId, title };

  if (hasOwn(row, "isDone")) {
    const value = asBoolean(row.isDone);
    if (value === null) throw new Error(`todoSubtasks[${index}].isDone must be boolean`);
    insert.isDone = value;
  }

  if (hasOwn(row, "createdAt")) {
    const date = asDateFromMs(row.createdAt);
    if (!date) throw new Error(`todoSubtasks[${index}].createdAt must be ms timestamp`);
    insert.createdAt = date;
  }

  if (hasOwn(row, "updatedAt")) {
    const date = asDateFromMs(row.updatedAt);
    if (!date) throw new Error(`todoSubtasks[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = date;
  }

  return insert;
}

function parseAnniversaryRow(
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
    if (!anniversaryCategoryValues.includes(value as (typeof anniversaryCategoryValues)[number])) {
      throw new Error(`anniversaries[${index}].category is invalid`);
    }
    insert.category = value as (typeof anniversaryCategoryValues)[number];
  }

  if (hasOwn(row, "dateType")) {
    const value = row.dateType;
    if (typeof value !== "string") throw new Error(`anniversaries[${index}].dateType must be string`);
    if (!anniversaryDateTypeValues.includes(value as (typeof anniversaryDateTypeValues)[number])) {
      throw new Error(`anniversaries[${index}].dateType is invalid`);
    }
    insert.dateType = value as (typeof anniversaryDateTypeValues)[number];
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

function parseSubscriptionRow(
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
    if (value !== null && typeof value !== "string") {
      throw new Error(`subscriptions[${index}].description must be string|null`);
    }
    insert.description = value as string | null;
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
    if (!subscriptionCycleUnitValues.includes(value as (typeof subscriptionCycleUnitValues)[number])) {
      throw new Error(`subscriptions[${index}].cycleUnit is invalid`);
    }
    insert.cycleUnit = value as (typeof subscriptionCycleUnitValues)[number];
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

function parseItemRow(row: Record<string, unknown>, index: number): typeof items.$inferInsert {
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
    if (value !== null && typeof value !== "string") {
      throw new Error(`items[${index}].purchasedDate must be string|null`);
    }
    insert.purchasedDate = value as string | null;
  }

  if (hasOwn(row, "category")) {
    const value = row.category;
    if (value !== null && typeof value !== "string") {
      throw new Error(`items[${index}].category must be string|null`);
    }
    insert.category = value as string | null;
  }

  if (hasOwn(row, "status")) {
    const value = row.status;
    if (typeof value !== "string") throw new Error(`items[${index}].status must be string`);
    if (!itemStatusValues.includes(value as (typeof itemStatusValues)[number])) {
      throw new Error(`items[${index}].status is invalid`);
    }
    insert.status = value as (typeof itemStatusValues)[number];
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

function parseNotificationDeliveryRow(
  row: Record<string, unknown>,
  index: number,
): typeof notificationDeliveries.$inferInsert {
  const id = asString(row.id);
  const itemType = asString(row.itemType);
  const itemId = asString(row.itemId);
  const itemTitle = asString(row.itemTitle);
  if (!id) throw new Error(`notificationDeliveries[${index}].id is missing`);
  if (!itemType) throw new Error(`notificationDeliveries[${index}].itemType is missing`);
  if (!itemId) throw new Error(`notificationDeliveries[${index}].itemId is missing`);
  if (!itemTitle) throw new Error(`notificationDeliveries[${index}].itemTitle is missing`);

  const scheduledAt = asDateFromMs(row.scheduledAt);
  if (!scheduledAt) throw new Error(`notificationDeliveries[${index}].scheduledAt is missing`);

  const insert: typeof notificationDeliveries.$inferInsert = {
    id,
    itemType: itemType as (typeof notificationItemTypeValues)[number],
    itemId,
    itemTitle,
    scheduledAt,
  };

  if (!notificationItemTypeValues.includes(insert.itemType)) {
    throw new Error(`notificationDeliveries[${index}].itemType is invalid`);
  }

  if (hasOwn(row, "channel")) {
    const value = row.channel;
    if (typeof value !== "string") throw new Error(`notificationDeliveries[${index}].channel must be string`);
    if (!notificationChannelValues.includes(value as (typeof notificationChannelValues)[number])) {
      throw new Error(`notificationDeliveries[${index}].channel is invalid`);
    }
    insert.channel = value as (typeof notificationChannelValues)[number];
  }

  if (hasOwn(row, "status")) {
    const value = row.status;
    if (typeof value !== "string") throw new Error(`notificationDeliveries[${index}].status must be string`);
    if (!notificationDeliveryStatusValues.includes(value as (typeof notificationDeliveryStatusValues)[number])) {
      throw new Error(`notificationDeliveries[${index}].status is invalid`);
    }
    insert.status = value as (typeof notificationDeliveryStatusValues)[number];
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
    if (value !== null && typeof value !== "string") {
      throw new Error(`notificationDeliveries[${index}].error must be string|null`);
    }
    insert.error = value as string | null;
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

const INSERT_CHUNK_SIZE = 50;

export async function importBackupOverwrite(formData: FormData) {
  const file = formData.get("backupFile");
  if (!(file instanceof File)) redirect("/settings?error=backup-missing-file");

  let parsed: unknown = null;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    redirect("/settings?error=backup-invalid-json");
  }

  const backup = parseBackupV1(parsed);
  if (!backup) redirect("/settings?error=backup-invalid-format");
  if (!isValidTimeZone(backup.app.timeZone)) redirect("/settings?error=backup-invalid-timezone");

  const dateReminderTime =
    typeof backup.app.dateReminderTime === "string"
      ? backup.app.dateReminderTime.trim()
      : null;
  if (dateReminderTime !== null) {
    if (dateReminderTime.length === 0 || !isValidTimeOfDay(dateReminderTime)) {
      redirect("/settings?error=backup-invalid-date-reminder-time");
    }
  }

  let todoRows: Array<typeof todos.$inferInsert> = [];
  let subtaskRows: Array<typeof todoSubtasks.$inferInsert> = [];
  let anniversaryRows: Array<typeof anniversaries.$inferInsert> = [];
  let subscriptionRows: Array<typeof subscriptions.$inferInsert> = [];
  let itemRows: Array<typeof items.$inferInsert> = [];
  let deliveryRows: Array<typeof notificationDeliveries.$inferInsert> = [];

  try {
    todoRows = backup.data.todos.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`todos[${i}] is not an object`);
      return parseTodoRow(raw, i);
    });

    subtaskRows = backup.data.todoSubtasks.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`todoSubtasks[${i}] is not an object`);
      return parseTodoSubtaskRow(raw, i);
    });

    anniversaryRows = backup.data.anniversaries.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`anniversaries[${i}] is not an object`);
      return parseAnniversaryRow(raw, i);
    });

    subscriptionRows = backup.data.subscriptions.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`subscriptions[${i}] is not an object`);
      return parseSubscriptionRow(raw, i);
    });

    itemRows = backup.data.items.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`items[${i}] is not an object`);
      return parseItemRow(raw, i);
    });

    deliveryRows = backup.data.notificationDeliveries.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`notificationDeliveries[${i}] is not an object`);
      return parseNotificationDeliveryRow(raw, i);
    });

    const todoIds = new Set(todoRows.map((r) => r.id));
    for (const subtask of subtaskRows) {
      if (!todoIds.has(subtask.todoId)) {
        throw new Error(`todoSubtasks.todoId not found: ${subtask.todoId}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid backup data";
    redirect(
      `/settings?error=backup-invalid-format&backupMessage=${encodeURIComponent(message.slice(0, 300))}`,
    );
  }

  try {
    db.transaction((tx) => {
      tx.delete(notificationDeliveries).run();
      tx.delete(todoSubtasks).run();
      tx.delete(todos).run();
      tx.delete(anniversaries).run();
      tx.delete(subscriptions).run();
      tx.delete(items).run();

      for (let i = 0; i < todoRows.length; i += INSERT_CHUNK_SIZE) {
        tx.insert(todos).values(todoRows.slice(i, i + INSERT_CHUNK_SIZE)).run();
      }
      for (let i = 0; i < subtaskRows.length; i += INSERT_CHUNK_SIZE) {
        tx.insert(todoSubtasks)
          .values(subtaskRows.slice(i, i + INSERT_CHUNK_SIZE))
          .run();
      }
      for (let i = 0; i < anniversaryRows.length; i += INSERT_CHUNK_SIZE) {
        tx.insert(anniversaries)
          .values(anniversaryRows.slice(i, i + INSERT_CHUNK_SIZE))
          .run();
      }
      for (let i = 0; i < subscriptionRows.length; i += INSERT_CHUNK_SIZE) {
        tx.insert(subscriptions)
          .values(subscriptionRows.slice(i, i + INSERT_CHUNK_SIZE))
          .run();
      }
      for (let i = 0; i < itemRows.length; i += INSERT_CHUNK_SIZE) {
        tx.insert(items).values(itemRows.slice(i, i + INSERT_CHUNK_SIZE)).run();
      }
      for (let i = 0; i < deliveryRows.length; i += INSERT_CHUNK_SIZE) {
        tx.insert(notificationDeliveries)
          .values(deliveryRows.slice(i, i + INSERT_CHUNK_SIZE))
          .run();
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(
      `/settings?error=backup-import-failed&backupMessage=${encodeURIComponent(message.slice(0, 300))}`,
    );
  }

  await setAppTimeZone(backup.app.timeZone);
  if (dateReminderTime) await setAppDateReminderTime(dateReminderTime);

  revalidatePath("/");
  revalidatePath("/anniversaries");
  revalidatePath("/subscriptions");
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/settings");

  redirect(
    `/settings?backupImported=1&backupTodos=${todoRows.length}&backupSubtasks=${subtaskRows.length}&backupAnniversaries=${anniversaryRows.length}&backupSubscriptions=${subscriptionRows.length}&backupItems=${itemRows.length}&backupDeliveries=${deliveryRows.length}`,
  );
}

function getRunChanges(result: unknown): number {
  if (!result || typeof result !== "object") return 0;
  const changes = (result as { changes?: unknown }).changes;
  return typeof changes === "number" && Number.isFinite(changes) ? changes : 0;
}

export async function importBackupMerge(formData: FormData) {
  const file = formData.get("backupFile");
  if (!(file instanceof File)) redirect("/settings?error=backup-missing-file");

  let parsed: unknown = null;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    redirect("/settings?error=backup-invalid-json");
  }

  const backup = parseBackupV1(parsed);
  if (!backup) redirect("/settings?error=backup-invalid-format");
  if (!isValidTimeZone(backup.app.timeZone)) redirect("/settings?error=backup-invalid-timezone");

  let todoRows: Array<typeof todos.$inferInsert> = [];
  let subtaskRows: Array<typeof todoSubtasks.$inferInsert> = [];
  let anniversaryRows: Array<typeof anniversaries.$inferInsert> = [];
  let subscriptionRows: Array<typeof subscriptions.$inferInsert> = [];
  let itemRows: Array<typeof items.$inferInsert> = [];
  let deliveryRows: Array<typeof notificationDeliveries.$inferInsert> = [];

  try {
    todoRows = backup.data.todos.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`todos[${i}] is not an object`);
      return parseTodoRow(raw, i);
    });

    subtaskRows = backup.data.todoSubtasks.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`todoSubtasks[${i}] is not an object`);
      return parseTodoSubtaskRow(raw, i);
    });

    anniversaryRows = backup.data.anniversaries.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`anniversaries[${i}] is not an object`);
      return parseAnniversaryRow(raw, i);
    });

    subscriptionRows = backup.data.subscriptions.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`subscriptions[${i}] is not an object`);
      return parseSubscriptionRow(raw, i);
    });

    itemRows = backup.data.items.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`items[${i}] is not an object`);
      return parseItemRow(raw, i);
    });

    deliveryRows = backup.data.notificationDeliveries.map((raw, i) => {
      if (!isRecord(raw)) throw new Error(`notificationDeliveries[${i}] is not an object`);
      return parseNotificationDeliveryRow(raw, i);
    });

    const todoIds = new Set(todoRows.map((r) => r.id));
    for (const subtask of subtaskRows) {
      if (!todoIds.has(subtask.todoId)) {
        throw new Error(`todoSubtasks.todoId not found: ${subtask.todoId}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid backup data";
    redirect(
      `/settings?error=backup-invalid-format&backupMessage=${encodeURIComponent(message.slice(0, 300))}`,
    );
  }

  let insertedTodos = 0;
  let insertedSubtasks = 0;
  let insertedAnniversaries = 0;
  let insertedSubscriptions = 0;
  let insertedItems = 0;
  let insertedDeliveries = 0;

  try {
    db.transaction((tx) => {
      for (let i = 0; i < todoRows.length; i += INSERT_CHUNK_SIZE) {
        const r = tx
          .insert(todos)
          .values(todoRows.slice(i, i + INSERT_CHUNK_SIZE))
          .onConflictDoNothing()
          .run();
        insertedTodos += getRunChanges(r);
      }

      for (let i = 0; i < subtaskRows.length; i += INSERT_CHUNK_SIZE) {
        const r = tx
          .insert(todoSubtasks)
          .values(subtaskRows.slice(i, i + INSERT_CHUNK_SIZE))
          .onConflictDoNothing()
          .run();
        insertedSubtasks += getRunChanges(r);
      }

      for (let i = 0; i < anniversaryRows.length; i += INSERT_CHUNK_SIZE) {
        const r = tx
          .insert(anniversaries)
          .values(anniversaryRows.slice(i, i + INSERT_CHUNK_SIZE))
          .onConflictDoNothing()
          .run();
        insertedAnniversaries += getRunChanges(r);
      }

      for (let i = 0; i < subscriptionRows.length; i += INSERT_CHUNK_SIZE) {
        const r = tx
          .insert(subscriptions)
          .values(subscriptionRows.slice(i, i + INSERT_CHUNK_SIZE))
          .onConflictDoNothing()
          .run();
        insertedSubscriptions += getRunChanges(r);
      }

      for (let i = 0; i < itemRows.length; i += INSERT_CHUNK_SIZE) {
        const r = tx
          .insert(items)
          .values(itemRows.slice(i, i + INSERT_CHUNK_SIZE))
          .onConflictDoNothing()
          .run();
        insertedItems += getRunChanges(r);
      }

      for (let i = 0; i < deliveryRows.length; i += INSERT_CHUNK_SIZE) {
        const r = tx
          .insert(notificationDeliveries)
          .values(deliveryRows.slice(i, i + INSERT_CHUNK_SIZE))
          .onConflictDoNothing()
          .run();
        insertedDeliveries += getRunChanges(r);
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(
      `/settings?error=backup-import-failed&backupMessage=${encodeURIComponent(message.slice(0, 300))}`,
    );
  }

  revalidatePath("/");
  revalidatePath("/anniversaries");
  revalidatePath("/subscriptions");
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/settings");

  redirect(
    `/settings?backupMerged=1&backupTodos=${insertedTodos}&backupSubtasks=${insertedSubtasks}&backupAnniversaries=${insertedAnniversaries}&backupSubscriptions=${insertedSubscriptions}&backupItems=${insertedItems}&backupDeliveries=${insertedDeliveries}`,
  );
}
