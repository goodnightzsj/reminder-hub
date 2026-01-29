"use server";

import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";

/**
 * 通过重写 `createdAt` 时间戳来实现排序。
 * 数组越靠前的项目会获得越新的时间戳（在 desc 排序下更靠前）。
 */
export async function reorderTodos(ids: string[]) {
  if (ids.length === 0) return;

  const items = await db
    .select({ id: todos.id, createdAt: todos.createdAt })
    .from(todos)
    .where(inArray(todos.id, ids));

  // Sort timestamps descending (Newest first)
  const timestamps = items
    .map((i) => i.createdAt)
    .sort((a, b) => b.getTime() - a.getTime());

  // Assign newest timestamps to the first IDs in the list (Top of list)
  db.transaction((tx) => {
    const now = new Date();
    const limit = Math.min(ids.length, timestamps.length);
    for (let i = 0; i < limit; i++) {
      tx
        .update(todos)
        .set({ createdAt: timestamps[i], updatedAt: now })
        .where(eq(todos.id, ids[i]))
        .run();
    }
  });

  revalidatePath(ROUTES.todo);
  revalidatePath(ROUTES.home);
}

async function moveTodoByOffset(id: string, offset: -1 | 1) {
  const current = await db
    .select({
      id: todos.id,
      createdAt: todos.createdAt,
      isArchived: todos.isArchived,
      isDone: todos.isDone,
    })
    .from(todos)
    .where(eq(todos.id, id))
    .get();
  if (!current) return;

  const siblings = await db
    .select({ id: todos.id, createdAt: todos.createdAt })
    .from(todos)
    .where(and(eq(todos.isArchived, current.isArchived), eq(todos.isDone, current.isDone)))
    .orderBy(desc(todos.createdAt))
    .limit(100);

  const currentIdx = siblings.findIndex((t) => t.id === id);
  if (currentIdx < 0) return;

  const adjacentIdx = currentIdx + offset;
  if (adjacentIdx < 0 || adjacentIdx >= siblings.length) return;

  const adjacent = siblings[adjacentIdx];

  db.transaction((tx) => {
    tx.update(todos).set({ createdAt: adjacent.createdAt }).where(eq(todos.id, id)).run();
    tx
      .update(todos)
      .set({ createdAt: current.createdAt })
      .where(eq(todos.id, adjacent.id))
      .run();
  });

  revalidatePath(ROUTES.todo);
  revalidatePath(ROUTES.dashboard);
}

/**
 * 上移一个 Todo（与相邻项交换时间戳）
 */
export async function moveTodoUp(id: string) {
  await moveTodoByOffset(id, -1);
}

/**
 * 下移一个 Todo（与相邻项交换时间戳）
 */
export async function moveTodoDown(id: string) {
  await moveTodoByOffset(id, 1);
}
