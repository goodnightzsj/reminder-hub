import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { todos, todoSubtasks } from "@/server/db/schema";
import {
  computeNextDueAtUtc,
  parseRecurrenceRuleJson,
} from "@/server/recurrence";
import { formatDateTimeLocal } from "@/server/datetime";

import { SubtaskList } from "../../_components/todo/SubtaskList";
import { TodoUpdateForm } from "../../_components/todo/TodoUpdateForm";

export const dynamic = "force-dynamic";

type TodoPageProps = {
  params: Promise<{ id: string }>;
};

function parseStringArrayJson(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function parseReminderOffsetsMinutes(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
      .filter((v) => v >= 0)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export default async function TodoPage({ params }: TodoPageProps) {
  const { id } = await params;
  const settings = await getAppSettings();

  const todo = await db.query.todos.findFirst({
    where: eq(todos.id, id),
  });

  if (!todo) {
    notFound();
  }

  const subtasks = await db
    .select({
      id: todoSubtasks.id,
      title: todoSubtasks.title,
      isDone: todoSubtasks.isDone,
    })
    .from(todoSubtasks)
    .where(eq(todoSubtasks.todoId, id))
    .orderBy(asc(todoSubtasks.createdAt)); // Sort by creation time

  const recurrence = parseRecurrenceRuleJson(todo.recurrenceRule ?? null);
  const reminders = parseReminderOffsetsMinutes(todo.reminderOffsetsMinutes);
  const tags = parseStringArrayJson(todo.tags);

  const nextTodo = todo.recurrenceNextId
    ? await db.query.todos.findFirst({
      where: eq(todos.id, todo.recurrenceNextId),
    })
    : null;

  const dueAtLocalValue = todo.dueAt
    ? formatDateTimeLocal(todo.dueAt, settings.timeZone)
    : "";

  const nextDueAtPreview =
    todo.dueAt && recurrence
      ? computeNextDueAtUtc(todo.dueAt, settings.timeZone, recurrence)
      : null;

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-2xl p-6 sm:p-10">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-divider p-2 text-sm font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              返回
            </Link>
            <Link
              href="/dashboard"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              仪表盘
            </Link>
            <Link
              href="/anniversaries"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              纪念日
            </Link>
            <Link
              href="/subscriptions"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              订阅
            </Link>
            <Link
              href="/items"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              物品
            </Link>
            <Link
              href="/search"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              搜索
            </Link>
          </div>
        </header>

        <ClientSavedToast />

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">编辑 Todo</h1>
              <div className="text-xs text-muted">ID: {todo.id.slice(0, 8)}</div>
            </div>

            {nextTodo ? (
              <div className="mt-3 rounded-lg border border-divider bg-surface p-3 text-xs text-secondary">
                <div className="font-medium text-primary">下一次已生成</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/todo/${nextTodo.id}`}
                    className="font-medium text-brand-primary hover:underline"
                  >
                    打开下一次
                  </Link>
                  {nextTodo.dueAt ? (
                    <span>
                      截止{" "}
                      {new Intl.DateTimeFormat("zh-CN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: settings.timeZone,
                      }).format(nextTodo.dueAt)}
                    </span>
                  ) : null}
                  {nextTodo.isArchived ? <span>（已归档）</span> : null}
                  {nextTodo.isDone ? <span>（已完成）</span> : null}
                </div>
              </div>
            ) : null}

            <TodoUpdateForm
              todo={todo}
              tags={tags}
              recurrence={recurrence}
              reminders={reminders}
              dueAtLocalValue={dueAtLocalValue}
              nextDueAtPreview={nextDueAtPreview}
              settings={settings}
            />
          </div>

          <SubtaskList todoId={todo.id} subtasks={subtasks} />
        </div>
      </main>
    </div>
  );
}

// Client component for showing toast if "?saved=1"
// Actually I can use ToastListener global or a simple inline check here?
// The global ToastListener handles `saved=1`.
// But wait, `ToastListener` in layout handles it globally?
// Yes, `apps/web/src/app/_components/ToastListener.tsx` handles `saved`.
// So I don't need `ClientSavedToast` here.
function ClientSavedToast() {
  return null;
}
