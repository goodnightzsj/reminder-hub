"use server";

import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { dateTimeLocalToUtcDate } from "@/server/datetime";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import {
  computeNextDueAtUtc,
  parseRecurrenceRuleJson,
  recurrenceUnits,
  serializeRecurrenceRule,
  type RecurrenceRule,
  type RecurrenceUnit,
} from "@/server/recurrence";
import {
  type TodoPriority,
  todoPriorityValues,
  todos,
  todoSubtasks,
} from "@/server/db/schema";

function parseStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBooleanField(formData: FormData, key: string): boolean | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

function parseDateTimeLocalField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

function parseNumberListField(formData: FormData, key: string): number[] {
  const values = formData.getAll(key);
  const parsed = new Set<number>();

  for (const value of values) {
    if (typeof value !== "string") continue;
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) continue;
    if (n < 0) continue;
    parsed.add(n);
  }

  return Array.from(parsed).sort((a, b) => a - b);
}

function parseTodoPriorityField(formData: FormData, key: string): TodoPriority {
  const value = parseStringField(formData, key);
  if (value && todoPriorityValues.includes(value as TodoPriority)) {
    return value as TodoPriority;
  }
  return "medium";
}

function parseTagsField(formData: FormData, key: string): string[] {
  const value = parseStringField(formData, key);
  if (!value) return [];

  const tags = value
    .split(/[,\n，]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 20);

  return Array.from(new Set(tags));
}

function parsePositiveIntField(
  formData: FormData,
  key: string,
  fallback: number,
): number {
  const value = parseStringField(formData, key);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 1) return fallback;
  return parsed;
}

function parseRecurrenceUnitField(
  formData: FormData,
  key: string,
): RecurrenceUnit | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  if ((recurrenceUnits as readonly string[]).includes(value)) {
    return value as RecurrenceUnit;
  }
  return null;
}

function parseRecurrenceRuleFields(
  formData: FormData,
  dueAt: Date | null,
): RecurrenceRule | null {
  const unit = parseRecurrenceUnitField(formData, "recurrenceUnit");
  if (!unit) return null;
  if (dueAt === null) return null;

  const interval = parsePositiveIntField(formData, "recurrenceInterval", 1);
  return { unit, interval };
}

function parseRedirectToField(formData: FormData, key: string): string | null {
  const value = parseStringField(formData, key);
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export async function createTodo(formData: FormData) {
  const title = parseStringField(formData, "title");
  if (!title) return;

  const description = parseStringField(formData, "description");
  const taskType = parseStringField(formData, "taskType") ?? "personal";
  const priority = parseTodoPriorityField(formData, "priority");
  const tags = parseTagsField(formData, "tags");
  const dueAtRaw = parseDateTimeLocalField(formData, "dueAt");
  const reminderOffsetsMinutesRaw = parseNumberListField(
    formData,
    "reminderOffsetsMinutes",
  );
  const settings = await getAppSettings();
  const dueAt =
    dueAtRaw === null
      ? null
      : dateTimeLocalToUtcDate(dueAtRaw, settings.timeZone);
  const reminderOffsetsMinutes =
    dueAt === null ? [] : reminderOffsetsMinutesRaw;

  const id = randomUUID();
  const recurrenceRule = parseRecurrenceRuleFields(formData, dueAt);
  const recurrenceRuleJson = serializeRecurrenceRule(recurrenceRule);

  await db.insert(todos).values({
    id,
    title,
    description,
    taskType,
    priority,
    tags: JSON.stringify(tags),
    dueAt,
    reminderOffsetsMinutes: JSON.stringify(reminderOffsetsMinutes),
    recurrenceRule: recurrenceRuleJson,
    recurrenceRootId: recurrenceRuleJson ? id : null,
    updatedAt: new Date(),
  });

  revalidatePath("/");
}

export async function toggleTodo(formData: FormData) {
  const id = parseStringField(formData, "id");
  const isDone = parseBooleanField(formData, "isDone");
  if (!id || isDone === null) return;

  const settings = await getAppSettings();

  db.transaction((tx) => {
    const now = new Date();

    const todo = tx
      .select({
        id: todos.id,
        title: todos.title,
        description: todos.description,
        taskType: todos.taskType,
        priority: todos.priority,
        tags: todos.tags,
        dueAt: todos.dueAt,
        reminderOffsetsMinutes: todos.reminderOffsetsMinutes,
        recurrenceRule: todos.recurrenceRule,
        recurrenceRootId: todos.recurrenceRootId,
        recurrenceNextId: todos.recurrenceNextId,
      })
      .from(todos)
      .where(eq(todos.id, id))
      .get();

    if (!todo) return;

    tx.update(todos)
      .set({
        isDone,
        completedAt: isDone ? now : null,
        updatedAt: now,
      })
      .where(eq(todos.id, id))
      .run();

    if (!isDone) return;
    if (!todo.dueAt) return;
    if (todo.recurrenceNextId) {
      const existingNext = tx
        .select({ id: todos.id })
        .from(todos)
        .where(eq(todos.id, todo.recurrenceNextId))
        .get();
      if (existingNext) return;
    }

    const rule = parseRecurrenceRuleJson(todo.recurrenceRule ?? null);
    if (!rule) return;

    const nextDueAt = computeNextDueAtUtc(todo.dueAt, settings.timeZone, rule);
    if (!nextDueAt) return;

    const nextId = randomUUID();
    const rootId = todo.recurrenceRootId ?? todo.id;

    tx.insert(todos)
      .values({
        id: nextId,
        title: todo.title,
        description: todo.description,
        taskType: todo.taskType,
        priority: todo.priority,
        tags: todo.tags,
        dueAt: nextDueAt,
        reminderOffsetsMinutes: todo.reminderOffsetsMinutes,
        recurrenceRule: todo.recurrenceRule,
        recurrenceRootId: rootId,
        updatedAt: now,
      })
      .run();

    tx.update(todos)
      .set({
        recurrenceNextId: nextId,
        recurrenceRootId: rootId,
        updatedAt: now,
      })
      .where(eq(todos.id, id))
      .run();
  });

  revalidatePath("/");
  revalidatePath(`/todo/${id}`);
}

export async function deleteTodo(formData: FormData) {
  const id = parseStringField(formData, "id");
  if (!id) return;
  const redirectTo = parseRedirectToField(formData, "redirectTo");

  db.transaction((tx) => {
    const now = new Date();

    tx.update(todos)
      .set({ recurrenceNextId: null, updatedAt: now })
      .where(eq(todos.recurrenceNextId, id))
      .run();

    tx.delete(todos).where(eq(todos.id, id)).run();
  });

  revalidatePath("/");
  revalidatePath(`/todo/${id}`);
  if (redirectTo) redirect(redirectTo);
}

export async function updateTodo(formData: FormData) {
  const id = parseStringField(formData, "id");
  const title = parseStringField(formData, "title");
  if (!id || !title) return;

  const description = parseStringField(formData, "description");
  const taskType = parseStringField(formData, "taskType") ?? "personal";
  const priority = parseTodoPriorityField(formData, "priority");
  const tags = parseTagsField(formData, "tags");
  const dueAtRaw = parseDateTimeLocalField(formData, "dueAt");
  const reminderOffsetsMinutesRaw = parseNumberListField(
    formData,
    "reminderOffsetsMinutes",
  );

  const settings = await getAppSettings();
  const dueAt =
    dueAtRaw === null
      ? null
      : dateTimeLocalToUtcDate(dueAtRaw, settings.timeZone);
  const reminderOffsetsMinutes =
    dueAt === null ? [] : reminderOffsetsMinutesRaw;
  const recurrenceRule = parseRecurrenceRuleFields(formData, dueAt);
  const recurrenceRuleJson = serializeRecurrenceRule(recurrenceRule);

  const existing = await db
    .select({
      recurrenceRootId: todos.recurrenceRootId,
    })
    .from(todos)
    .where(eq(todos.id, id))
    .limit(1);

  const recurrenceRootId = recurrenceRuleJson
    ? existing[0]?.recurrenceRootId ?? id
    : null;

  await db
    .update(todos)
    .set({
      title,
      description,
      taskType,
      priority,
      tags: JSON.stringify(tags),
      dueAt,
      reminderOffsetsMinutes: JSON.stringify(reminderOffsetsMinutes),
      recurrenceRule: recurrenceRuleJson,
      recurrenceRootId,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, id));

  revalidatePath("/");
  revalidatePath(`/todo/${id}`);
  redirect(`/todo/${id}?saved=1`);
}

export async function setTodoArchived(formData: FormData) {
  const id = parseStringField(formData, "id");
  const isArchived = parseBooleanField(formData, "isArchived");
  if (!id || isArchived === null) return;

  await db
    .update(todos)
    .set({
      isArchived,
      archivedAt: isArchived ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, id));

  revalidatePath("/");
  revalidatePath(`/todo/${id}`);
}

export async function createSubtask(formData: FormData) {
  const todoId = parseStringField(formData, "todoId");
  const title = parseStringField(formData, "title");
  if (!todoId || !title) return;

  await db.insert(todoSubtasks).values({
    id: randomUUID(),
    todoId,
    title,
    updatedAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath(`/todo/${todoId}`);
}

export async function toggleSubtask(formData: FormData) {
  const id = parseStringField(formData, "id");
  const todoId = parseStringField(formData, "todoId");
  const isDone = parseBooleanField(formData, "isDone");
  if (!id || !todoId || isDone === null) return;

  await db
    .update(todoSubtasks)
    .set({ isDone, updatedAt: new Date() })
    .where(eq(todoSubtasks.id, id));

  revalidatePath("/");
  revalidatePath(`/todo/${todoId}`);
}

export async function deleteSubtask(formData: FormData) {
  const id = parseStringField(formData, "id");
  const todoId = parseStringField(formData, "todoId");
  if (!id || !todoId) return;

  await db.delete(todoSubtasks).where(eq(todoSubtasks.id, id));

  revalidatePath("/");
  revalidatePath(`/todo/${todoId}`);
}

export async function updateSubtask(formData: FormData) {
  const id = parseStringField(formData, "id");
  const todoId = parseStringField(formData, "todoId");
  const title = parseStringField(formData, "title");
  if (!id || !todoId || !title) return;

  await db
    .update(todoSubtasks)
    .set({ title, updatedAt: new Date() })
    .where(eq(todoSubtasks.id, id));

  revalidatePath("/");
  revalidatePath(`/todo/${todoId}`);
}

/**
 * Reorder todos by updating their updatedAt timestamps to reflect new order.
 * Items earlier in the array will have newer timestamps (appear first in desc sort).
 */
export async function reorderTodos(ids: string[]) {
  const now = Date.now();
  
  // Update each todo's updatedAt based on position in the new order
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(todos)
      .set({ updatedAt: new Date(now - i) }) // Decrement by 1ms per position
      .where(eq(todos.id, ids[i]));
  }
  
  revalidatePath("/todo");
  revalidatePath("/dashboard");
}

/**
 * Move a todo up in the list (swap with adjacent item with newer timestamp)
 */
export async function moveTodoUp(id: string) {
  const current = await db.select().from(todos).where(eq(todos.id, id)).limit(1);
  if (!current[0]) return;
  
  // Find the item just above (with newer createdAt, since list is desc by createdAt)
  const above = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.isArchived, current[0].isArchived),
        eq(todos.isDone, current[0].isDone),
      )
    )
    .orderBy(desc(todos.createdAt))
    .limit(100);
  
  const currentIdx = above.findIndex(t => t.id === id);
  if (currentIdx <= 0) return; // Already at top
  
  const aboveItem = above[currentIdx - 1];
  
  // Swap createdAt timestamps
  await db.update(todos).set({ createdAt: aboveItem.createdAt }).where(eq(todos.id, id));
  await db.update(todos).set({ createdAt: current[0].createdAt }).where(eq(todos.id, aboveItem.id));
  
  revalidatePath("/todo");
  revalidatePath("/dashboard");
}

/**
 * Move a todo down in the list
 */
export async function moveTodoDown(id: string) {
  const current = await db.select().from(todos).where(eq(todos.id, id)).limit(1);
  if (!current[0]) return;
  
  const below = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.isArchived, current[0].isArchived),
        eq(todos.isDone, current[0].isDone),
      )
    )
    .orderBy(desc(todos.createdAt))
    .limit(100);
  
  const currentIdx = below.findIndex(t => t.id === id);
  if (currentIdx < 0 || currentIdx >= below.length - 1) return; // Already at bottom
  
  const belowItem = below[currentIdx + 1];
  
  // Swap createdAt timestamps
  await db.update(todos).set({ createdAt: belowItem.createdAt }).where(eq(todos.id, id));
  await db.update(todos).set({ createdAt: current[0].createdAt }).where(eq(todos.id, belowItem.id));
  
  revalidatePath("/todo");
  revalidatePath("/dashboard");
}

