"use server";

import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import {
  computeNextDueAtUtc,
  parseRecurrenceRuleJson,
} from "@/server/recurrence";
import { todos } from "@/server/db/schema";

import {
  todoArchiveSchema,
  todoIdSchema,
  todoToggleSchema,
} from "@/lib/validation/todo";
import { revalidateTodoAfterDelete, revalidateTodoDetailAndHome } from "./todos.helpers";
import { redirectWithTodoAction } from "./todos.helpers";

export async function toggleTodo(formData: FormData) {
  const result = await todoToggleSchema.safeParseAsync(formData);
  if (!result.success) return;
  const { id, isDone } = result.data;
  
  if (!id) return;

  const { timeZone } = await getAppTimeSettings();

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

    const nextDueAt = computeNextDueAtUtc(todo.dueAt, timeZone, rule);
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

  revalidateTodoDetailAndHome(id);
}

export async function deleteTodo(formData: FormData) {
  const result = await todoIdSchema.safeParseAsync(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;
  
  if (!id) return;

  const existing = await db
    .select({ deletedAt: todos.deletedAt })
    .from(todos)
    .where(eq(todos.id, id))
    .get();
  if (!existing) return;

  if (existing.deletedAt) {
    // 硬删除
    db.transaction((tx) => {
      const now = new Date();
      tx.update(todos)
        .set({ recurrenceNextId: null, updatedAt: now })
        .where(eq(todos.recurrenceNextId, id))
        .run();
      tx.delete(todos).where(eq(todos.id, id)).run();
    });
  } else {
    // 软删除
    const now = new Date();
    await db
      .update(todos)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(todos.id, id));
  }

  revalidateTodoAfterDelete(id);
  if (redirectTo) redirectWithTodoAction(redirectTo, "deleted");
}

export async function restoreTodo(formData: FormData) {
  const result = await todoIdSchema.safeParseAsync(formData);
  if (!result.success) return;
  const { id, redirectTo } = result.data;

  if (!id) return;

  const now = new Date();

  await db
    .update(todos)
    .set({ deletedAt: null, updatedAt: now })
    .where(eq(todos.id, id));

  revalidateTodoDetailAndHome(id);

  if (redirectTo) redirectWithTodoAction(redirectTo, "restored");
}

export async function setTodoArchived(formData: FormData) {
  const result = await todoArchiveSchema.safeParseAsync(formData);
  if (!result.success) return;
  const { id, isArchived } = result.data;

  if (!id) return;

  const now = new Date();
  await db
    .update(todos)
    .set({
      isArchived,
      archivedAt: isArchived ? now : null,
      updatedAt: now,
    })
    .where(eq(todos.id, id));

  revalidateTodoDetailAndHome(id);
}

