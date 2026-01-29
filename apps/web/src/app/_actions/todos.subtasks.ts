"use server";

import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { todoSubtasks } from "@/server/db/schema";

import { parseBooleanField, parseStringField } from "./form-data";
import { revalidateTodoDetailAndHome } from "./todos.helpers";

export async function createSubtask(formData: FormData) {
  const todoId = parseStringField(formData, "todoId");
  const title = parseStringField(formData, "title");
  if (!todoId || !title) return;

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
  const id = parseStringField(formData, "id");
  const todoId = parseStringField(formData, "todoId");
  const isDone = parseBooleanField(formData, "isDone");
  if (!id || !todoId || isDone === null) return;

  const now = new Date();
  await db
    .update(todoSubtasks)
    .set({ isDone, updatedAt: now })
    .where(eq(todoSubtasks.id, id));

  revalidateTodoDetailAndHome(todoId);
}

export async function deleteSubtask(formData: FormData) {
  const id = parseStringField(formData, "id");
  const todoId = parseStringField(formData, "todoId");
  if (!id || !todoId) return;

  await db.delete(todoSubtasks).where(eq(todoSubtasks.id, id));

  revalidateTodoDetailAndHome(todoId);
}

export async function updateSubtask(formData: FormData) {
  const id = parseStringField(formData, "id");
  const todoId = parseStringField(formData, "todoId");
  const title = parseStringField(formData, "title");
  if (!id || !todoId || !title) return;

  const now = new Date();
  await db
    .update(todoSubtasks)
    .set({ title, updatedAt: now })
    .where(eq(todoSubtasks.id, id));

  revalidateTodoDetailAndHome(todoId);
}
