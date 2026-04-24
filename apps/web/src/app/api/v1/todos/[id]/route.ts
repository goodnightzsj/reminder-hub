import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { serializeTodo } from "@/server/api/serializers";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { todoPriorityValues, type TodoPriority } from "@/lib/todo";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadTodo(id: string) {
  return db.select().from(todos).where(eq(todos.id, id)).get();
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  const { id } = await ctx.params;
  const row = await loadTodo(id);
  if (!row) return apiErrors.notFound();

  return jsonOk({ todo: serializeTodo(row) });
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  const { id } = await ctx.params;
  const existing = await loadTodo(id);
  if (!existing) return apiErrors.notFound();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json");
  }

  const patch: Partial<typeof todos.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) return apiErrors.badRequest("title cannot be empty");
    patch.title = title;
  }
  if (typeof body.description === "string" || body.description === null) {
    patch.description = body.description as string | null;
  }
  if (typeof body.priority === "string" && (todoPriorityValues as readonly string[]).includes(body.priority)) {
    patch.priority = body.priority as TodoPriority;
  }
  if (Array.isArray(body.tags)) {
    patch.tags = JSON.stringify(body.tags.filter((t) => typeof t === "string"));
  }
  if (body.dueAt === null) {
    patch.dueAt = null;
  } else if (typeof body.dueAt === "string") {
    const d = new Date(body.dueAt);
    if (isNaN(d.getTime())) return apiErrors.badRequest("invalid dueAt");
    patch.dueAt = d;
  }
  if (Array.isArray(body.reminderOffsetsMinutes)) {
    patch.reminderOffsetsMinutes = JSON.stringify(
      body.reminderOffsetsMinutes.filter((n) => typeof n === "number" && Number.isFinite(n)),
    );
  }
  if (typeof body.isDone === "boolean") {
    patch.isDone = body.isDone;
    patch.completedAt = body.isDone ? new Date() : null;
  }
  if (typeof body.isArchived === "boolean") {
    patch.isArchived = body.isArchived;
    patch.archivedAt = body.isArchived ? new Date() : null;
  }

  await db.update(todos).set(patch).where(eq(todos.id, id));
  const row = await loadTodo(id);
  if (!row) return apiErrors.serverError("update succeeded but row missing");

  return jsonOk({ todo: serializeTodo(row) });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  const { id } = await ctx.params;
  const existing = await loadTodo(id);
  if (!existing) return apiErrors.notFound();

  const url = new URL(request.url);
  const hard = url.searchParams.get("hard") === "1";

  if (hard) {
    await db.delete(todos).where(eq(todos.id, id));
  } else {
    await db.update(todos).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(todos.id, id));
  }

  return jsonOk({ ok: true });
}
