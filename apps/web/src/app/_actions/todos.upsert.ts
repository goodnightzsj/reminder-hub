"use server";

import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { serializeRecurrenceRule } from "@/server/recurrence";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import { type TodoPriority } from "@/lib/todo";
import { todoUpsertSchema } from "@/lib/validation/todo";
import { revalidateTodoDetailAndHome } from "./todos.helpers";
import { redirectWithTodoAction } from "./todos.helpers";

export async function createTodo(formData: FormData) {
  const result = await todoUpsertSchema.safeParseAsync(formData);
  if (!result.success) {
    // console.error("Validation failed", result.error);
    return;
  }
  const data = result.data;
  
  if (!data.title) return;

  const now = new Date();
  const id = randomUUID();
  const recurrenceRuleJson = serializeRecurrenceRule(data.recurrenceRule);

  await db.insert(todos).values({
    id,
    title: data.title,
    description: data.description,
    taskType: data.taskType,
    priority: data.priority as TodoPriority,
    tags: JSON.stringify(data.tags),
    dueAt: data.dueAt,
    reminderOffsetsMinutes: JSON.stringify(data.reminderOffsetsMinutes),
    recurrenceRule: recurrenceRuleJson,
    recurrenceRootId: recurrenceRuleJson ? id : null,
    updatedAt: now,
  });

  revalidatePath(ROUTES.home);
}

export async function updateTodo(formData: FormData) {
  const result = await todoUpsertSchema.safeParseAsync(formData);
  if (!result.success) return;
  const data = result.data;

  // For update, id is required. Schema makes it optional, but here we enforce it.
  const id = data.id;
  if (!id || !data.title) return;

  const recurrenceRuleJson = serializeRecurrenceRule(data.recurrenceRule);
  const now = new Date();

  const existing = await db
    .select({
      recurrenceRootId: todos.recurrenceRootId,
    })
    .from(todos)
    .where(eq(todos.id, id))
    .get();

  const recurrenceRootId = recurrenceRuleJson
    ? existing?.recurrenceRootId ?? id
    : null;

  await db
    .update(todos)
    .set({
      title: data.title,
      description: data.description,
      taskType: data.taskType,
      priority: data.priority as TodoPriority,
      tags: JSON.stringify(data.tags),
      dueAt: data.dueAt,
      reminderOffsetsMinutes: JSON.stringify(data.reminderOffsetsMinutes),
      recurrenceRule: recurrenceRuleJson,
      recurrenceRootId,
      updatedAt: now,
    })
    .where(eq(todos.id, id));

  revalidateTodoDetailAndHome(id);
  redirectWithTodoAction(ROUTES.todo, "updated");
}

