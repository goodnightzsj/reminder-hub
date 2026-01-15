import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { serializeRecurrenceRule } from "@/server/recurrence";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { DEFAULT_TODO_TASK_TYPE } from "@/lib/todo";
import { ROUTES } from "@/lib/routes";

import { parseStringField } from "./form-data";
import {
  parseDueAtAndReminderOffsetsMinutes,
  parseRecurrenceRuleFields,
  parseTagsField,
  parseTodoPriorityField,
} from "./todos.helpers";
import { revalidateTodoDetailAndHome } from "./todos.revalidate";
import { redirectWithTodoAction } from "./todos.redirect";

export async function createTodo(formData: FormData) {
  const title = parseStringField(formData, "title");
  if (!title) return;

  const description = parseStringField(formData, "description");
  const taskType = parseStringField(formData, "taskType") || DEFAULT_TODO_TASK_TYPE;
  const priority = parseTodoPriorityField(formData, "priority");
  const tags = parseTagsField(formData, "tags");
  const { dueAt, reminderOffsetsMinutes } =
    await parseDueAtAndReminderOffsetsMinutes(formData);

  const now = new Date();
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
    updatedAt: now,
  });

  revalidatePath(ROUTES.home);
}

export async function updateTodo(formData: FormData) {
  const id = parseStringField(formData, "id");
  const title = parseStringField(formData, "title");
  if (!id || !title) return;

  const description = parseStringField(formData, "description");
  const taskType = parseStringField(formData, "taskType") || DEFAULT_TODO_TASK_TYPE;
  const priority = parseTodoPriorityField(formData, "priority");
  const tags = parseTagsField(formData, "tags");
  const { dueAt, reminderOffsetsMinutes } =
    await parseDueAtAndReminderOffsetsMinutes(formData);
  const recurrenceRule = parseRecurrenceRuleFields(formData, dueAt);
  const recurrenceRuleJson = serializeRecurrenceRule(recurrenceRule);
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
      title,
      description,
      taskType,
      priority,
      tags: JSON.stringify(tags),
      dueAt,
      reminderOffsetsMinutes: JSON.stringify(reminderOffsetsMinutes),
      recurrenceRule: recurrenceRuleJson,
      recurrenceRootId,
      updatedAt: now,
    })
    .where(eq(todos.id, id));

  revalidateTodoDetailAndHome(id);
  redirectWithTodoAction(ROUTES.todo, "updated");
}

