import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDateTime } from "@/lib/format";
import { getTodoPriorityLabel, type TodoPriority } from "@/lib/todo";
import { ROUTES } from "@/lib/routes";

import { SubtaskList } from "../../_components/todo/SubtaskList";
import { TodoUpdateForm } from "../../_components/todo/TodoUpdateForm";
import { Icons } from "../../_components/Icons";
import { Badge, getBadgeVariantFromLabel } from "../../_components/Badge";
import { PageBackgroundDecoration } from "../../_components/PageBackgroundDecoration";

import { getTodoDetailPageData } from "./_lib/todo-detail";

export const dynamic = "force-dynamic";

const todoPriorityBadgeVariantByPriority: Record<TodoPriority, "danger" | "warning" | "blue"> = {
  low: "blue",
  medium: "warning",
  high: "danger",
};

type TodoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TodoPage({ params }: TodoPageProps) {
  const { id } = await params;
  const data = await getTodoDetailPageData(id);
  if (!data) notFound();

  const {
    timeZone,
    todo,
    subtasks,
    recurrence,
    reminders,
    tags,
    nextTodo,
    dueAtLocalValue,
    createdAtLabel,
  } = data;

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      {/* Background decoration */}
      <PageBackgroundDecoration />

      <main className="relative mx-auto max-w-4xl p-0 sm:p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-divider bg-base/80 p-4 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.todo}
              className="group flex items-center justify-center p-2 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <Icons.ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-primary">编辑 Todo</h1>
                <Badge
                  variant={todoPriorityBadgeVariantByPriority[todo.priority]}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {getTodoPriorityLabel(todo.priority)}
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
                        截止 {formatDateTime(nextTodo.dueAt, timeZone)}
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
                    createdAtLabel={createdAtLabel}
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
