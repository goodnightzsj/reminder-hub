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
import { Icons } from "../../_components/Icons";
import { ExpandableSearch } from "../../_components/ExpandableSearch";
import { Badge, getBadgeVariantFromLabel } from "../../_components/Badge";

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
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/5 rounded-full blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-4xl p-0 sm:p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-divider bg-base/80 p-4 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-4">
            <Link
              href="/todo"
              className="group flex items-center justify-center p-2 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <Icons.ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-primary">编辑 Todo</h1>
                <Badge
                  variant={
                    todo.priority === 'high' ? 'danger' :
                      todo.priority === 'medium' ? 'warning' :
                        'blue'
                  }
                  className="px-1.5 py-0 text-[10px]"
                >
                  {{ low: "低", medium: "中", high: "高" }[todo.priority]}
                </Badge>
                <Badge
                  variant={getBadgeVariantFromLabel(todo.taskType)}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {todo.taskType}
                </Badge>
              </div>
              <span className="text-xs text-muted font-mono">ID: {todo.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="todo-update-form"
              className="h-9 px-4 rounded-lg bg-brand-primary text-xs font-medium text-white shadow-sm hover:bg-brand-primary/90 transition-all active:scale-95"
            >
              保存
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 animate-slide-up stagger-2">
          {/* Main Card */}
          <div className="overflow-hidden rounded-2xl border border-default bg-elevated/80 shadow-xl backdrop-blur-xl">
            <div className="p-6 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  {/* Old title removed */}
                </div>
              </div>

              {/* Previous logic for Next Todo Preview */}
              {nextTodo ? (
                <div className="mb-8 overflow-hidden rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-brand-primary">
                    <Icons.Refresh className="h-4 w-4" />
                    已生成下一次任务
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <Link
                      href={`/todo/${nextTodo.id}`}
                      className="font-medium text-primary hover:text-brand-primary underline decoration-divider hover:decoration-brand-primary transition-colors"
                    >
                      查看详情
                    </Link>
                    {nextTodo.dueAt && (
                      <span className="flex items-center gap-1 text-secondary">
                        <Icons.Calendar className="h-3.5 w-3.5" />
                        截止 {new Intl.DateTimeFormat("zh-CN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: settings.timeZone,
                        }).format(nextTodo.dueAt)}
                      </span>
                    )}
                    {nextTodo.isDone && (
                      <span className="rounded-md bg-success/10 px-2 py-0.5 text-success">已完成</span>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
                <div className="min-w-0">
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

                <div className="border-t border-divider pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <div className="sticky top-20">
                    <h3 className="mb-4 text-sm font-medium text-secondary">子任务</h3>
                    <div className="rounded-xl border border-default bg-surface/50 p-1">
                      <SubtaskList todoId={todo.id} subtasks={subtasks} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
