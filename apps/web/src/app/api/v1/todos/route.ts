import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { serializeTodo } from "@/server/api/serializers";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { TODO_PRIORITY, todoPriorityValues, type TodoPriority } from "@/lib/todo";
import { DEFAULT_TODO_TASK_TYPE } from "@/lib/todo";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/todos?includeDeleted=1&includeArchived=1&isDone=0
 */
export async function GET(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";
  const includeArchived = url.searchParams.get("includeArchived") === "1";
  const doneFilter = url.searchParams.get("isDone");

  const filters = [];
  if (!includeDeleted) filters.push(isNull(todos.deletedAt));
  if (!includeArchived) filters.push(eq(todos.isArchived, false));
  if (doneFilter === "0") filters.push(eq(todos.isDone, false));
  if (doneFilter === "1") filters.push(eq(todos.isDone, true));

  const rows = await db
    .select()
    .from(todos)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(todos.isDone), desc(todos.createdAt));

  return jsonOk({ todos: rows.map(serializeTodo) });
}

/**
 * POST /api/v1/todos
 * Body: { title, description?, priority?, tags?, dueAt?, reminderOffsetsMinutes?, taskType?, id? }
 */
export async function POST(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return apiErrors.badRequest("title required");

  const priority = typeof body.priority === "string" && (todoPriorityValues as readonly string[]).includes(body.priority)
    ? (body.priority as TodoPriority)
    : TODO_PRIORITY.LOW;

  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === "string") : [];
  const reminderOffsetsMinutes = Array.isArray(body.reminderOffsetsMinutes)
    ? body.reminderOffsetsMinutes.filter((n) => typeof n === "number" && Number.isFinite(n))
    : [];

  const dueAt = typeof body.dueAt === "string" ? new Date(body.dueAt) : null;
  if (dueAt && isNaN(dueAt.getTime())) return apiErrors.badRequest("invalid dueAt");

  const id = typeof body.id === "string" && body.id ? body.id : randomUUID();
  const now = new Date();

  await db.insert(todos).values({
    id,
    title,
    description: typeof body.description === "string" ? body.description : null,
    taskType: typeof body.taskType === "string" ? body.taskType : DEFAULT_TODO_TASK_TYPE,
    priority,
    tags: JSON.stringify(tags),
    dueAt: dueAt ?? undefined,
    reminderOffsetsMinutes: JSON.stringify(reminderOffsetsMinutes),
    recurrenceRule: typeof body.recurrenceRule === "string" ? body.recurrenceRule : null,
    updatedAt: now,
  });

  const row = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!row) return apiErrors.serverError("insert succeeded but row not found");

  return jsonOk({ todo: serializeTodo(row) }, { status: 201 });
}
