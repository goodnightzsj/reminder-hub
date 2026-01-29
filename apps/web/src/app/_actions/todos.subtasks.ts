"use server";

import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { todoSubtasks } from "@/server/db/schema";

import {
  subtaskCreateSchema,
  subtaskIdSchema,
  subtaskToggleSchema,
  subtaskUpdateSchema,
} from "@/lib/validation/todo";
import { revalidateTodoDetailAndHome } from "./todos.helpers";

export async function createSubtask(formData: FormData) {
  const result = await subtaskCreateSchema.safeParseAsync(formData);
  if (!result.success) return;
  const { todoId, title } = result.data;

  const now = new Date();
  await db.insert(todoSubtasks).values({
    id: randomUUID(),
    todoId,
    title,
    updatedAt: now,
  });

  revalidateTodoDetailAndHome(todoId);
}

export async function toggleSubtask(formData: FormData) {
  const result = await subtaskToggleSchema.safeParseAsync(formData);
  if (!result.success) return;
  const { id, todoId, isDone } = result.data;
  
  if (!id || !todoId) return; // Should be handled by schema but double check

  const now = new Date();
  await db
    .update(todoSubtasks)
    .set({ isDone, updatedAt: now })
    .where(eq(todoSubtasks.id, id));

  revalidateTodoDetailAndHome(todoId);
}

export async function deleteSubtask(formData: FormData) {
  const result = await subtaskIdSchema.safeParseAsync(formData);
  if (!result.success) return;
  const { id, todoId } = result.data;
  
  if (!id || !todoId) return;

  await db.delete(todoSubtasks).where(eq(todoSubtasks.id, id));

  revalidateTodoDetailAndHome(todoId);
}

export async function updateSubtask(formData: FormData) {
  const result = await subtaskUpdateSchema.safeParseAsync(formData);
  if (!result.success) return;
  const { id, todoId, title } = result.data;

  if (!id || !todoId || !title) return;

  const now = new Date();
  await db
    .update(todoSubtasks)
    .set({ title, updatedAt: now })
    .where(eq(todoSubtasks.id, id));

  revalidateTodoDetailAndHome(todoId);
}
