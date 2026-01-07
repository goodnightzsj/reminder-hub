import { and, asc, desc, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { todos } from "@/server/db/schema";
// Using parseRecurrenceRuleJson implicitly via string parsing if needed or pass raw strings to components

import { AppHeader } from "../_components/AppHeader";
import { TodoCreateForm } from "../_components/todo/TodoCreateForm";
import { TodoItem } from "../_components/todo/TodoItem";
import { EmptyState } from "../_components/EmptyState";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  if (typeof value === "string") return value;
  return null;
}

type TodoFilter = "active" | "done" | "archived" | "all";

function parseTodoFilter(raw: string | null): TodoFilter {
  if (raw === "active") return "active";
  if (raw === "done") return "done";
  if (raw === "archived") return "archived";
  if (raw === "all") return "all";
  return "active";
}

type PriorityFilter = "all" | "low" | "medium" | "high";

function parsePriorityFilter(raw: string | null): PriorityFilter {
  if (raw === "low") return "low";
  if (raw === "medium") return "medium";
  if (raw === "high") return "high";
  return "all";
}

function parseTagFilter(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 50);
}

function parseTaskTypeFilter(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 50);
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseTodoFilter(getParam(params, "filter"));
  const priorityFilter = parsePriorityFilter(getParam(params, "priority"));
  const tagFilter = parseTagFilter(getParam(params, "tag"));
  const taskTypeFilter = parseTaskTypeFilter(getParam(params, "taskType"));
  const settings = await getAppSettings();

  const predicates = [];
  if (filter === "active") {
    predicates.push(eq(todos.isDone, false), eq(todos.isArchived, false));
  } else if (filter === "done") {
    predicates.push(eq(todos.isDone, true), eq(todos.isArchived, false));
  } else if (filter === "archived") {
    predicates.push(eq(todos.isArchived, true));
  }

  if (priorityFilter !== "all") {
    predicates.push(eq(todos.priority, priorityFilter));
  }

  if (taskTypeFilter) {
    predicates.push(eq(todos.taskType, taskTypeFilter));
  }

  const where =
    predicates.length === 0
      ? undefined
      : predicates.length === 1
        ? predicates[0]
        : and(...predicates);

  const taskTypesRows = await db
    .select({ taskType: todos.taskType })
    .from(todos)
    .groupBy(todos.taskType)
    .orderBy(asc(todos.taskType));
  const taskTypes = taskTypesRows
    .map((r) => r.taskType)
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .slice(0, 20);

  const items = await db.query.todos.findMany({
    where,
    orderBy: desc(todos.createdAt),
    with: {
      subtasks: true,
    },
  });

  const tagCounts = new Map<string, number>();
  for (const item of items) {
    for (const t of parseStringArrayJson(item.tags)) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }

  const tagsSorted = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, 24);

  const visibleItems = tagFilter
    ? items.filter((item) => parseStringArrayJson(item.tags).includes(tagFilter))
    : items;



  // Reconstruct href building for Tags section (local helper)
  function buildHomeHref({
    filter: f,
    priority: p,
    tag: t,
    taskType: k,
  }: {
    filter: TodoFilter;
    priority: PriorityFilter;
    tag: string | null;
    taskType: string | null;
  }) {
    const pms = new URLSearchParams();
    if (f !== "active") pms.set("filter", f);
    if (p !== "all") pms.set("priority", p);
    if (t) pms.set("tag", t);
    if (k) pms.set("taskType", k);
    const qs = pms.toString();
    return qs.length > 0 ? `/todo?${qs}` : "/todo";
  }

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="Todo"
          description="MVP：本地 SQLite + CRUD + 截止/提醒预览/标签/子任务（外部通知后置）。"
        />

        <section className="mb-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <TodoCreateForm timeZone={settings.timeZone} />
        </section>

        <section className="rounded-xl border border-default bg-elevated shadow-sm">
          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-medium">列表</h2>
              <nav className="flex flex-wrap gap-2 text-xs">
                {(
                  [
                    { key: "active", label: "进行中" },
                    { key: "done", label: "已完成" },
                    { key: "archived", label: "已归档" },
                    { key: "all", label: "全部" },
                  ] as const
                ).map((t) => (
                  <Link
                    key={t.key}
                    href={buildHomeHref({
                      filter: t.key,
                      priority: priorityFilter,
                      tag: tagFilter,
                      taskType: taskTypeFilter,
                    })}
                    className={[
                      "rounded-lg border px-3 py-2 font-medium active-press",
                      t.key === filter
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-default hover:bg-interactive-hover",
                    ].join(" ")}
                  >
                    {t.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border-t border-divider pt-4">
              <nav className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted">优先级</span>
                {(
                  [
                    { key: "all", label: "全部" },
                    { key: "high", label: "高" },
                    { key: "medium", label: "中" },
                    { key: "low", label: "低" },
                  ] as const
                ).map((p) => (
                  <Link
                    key={p.key}
                    href={buildHomeHref({
                      filter,
                      priority: p.key,
                      tag: tagFilter,
                      taskType: taskTypeFilter,
                    })}
                    className={[
                      "rounded-lg border px-3 py-2 font-medium active-press",
                      p.key === priorityFilter
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-default hover:bg-interactive-hover",
                    ].join(" ")}
                  >
                    {p.label}
                  </Link>
                ))}

                <span className="ml-2 text-muted">分类</span>
                <Link
                  href={buildHomeHref({
                    filter,
                    priority: priorityFilter,
                    tag: tagFilter,
                    taskType: null,
                  })}
                  className={[
                    "rounded-lg border px-3 py-2 font-medium active-press",
                    taskTypeFilter === null
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-default hover:bg-interactive-hover",
                  ].join(" ")}
                >
                  全部
                </Link>
                {taskTypes.map((t) => (
                  <Link
                    key={t}
                    href={buildHomeHref({
                      filter,
                      priority: priorityFilter,
                      tag: tagFilter,
                      taskType: t,
                    })}
                    className={[
                      "rounded-lg border px-3 py-2 font-medium active-press",
                      t === taskTypeFilter
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-default hover:bg-interactive-hover",
                    ].join(" ")}
                  >
                    {t}
                  </Link>
                ))}

                {tagFilter ||
                  priorityFilter !== "all" ||
                  taskTypeFilter !== null ||
                  filter !== "active" ? (
                  <Link
                    href="/todo"
                    className="rounded-lg border border-default px-3 py-2 font-medium text-muted hover:bg-interactive-hover active-press"
                  >
                    清除筛选
                  </Link>
                ) : null}
              </nav>

              {tagsSorted.length > 0 ? (
                <div className="mt-3 border-t border-dashed border-divider pt-3 text-xs">
                  <div className="mb-2 text-muted">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {tagsSorted.map(([t, count]) => (
                      <Link
                        key={t}
                        href={buildHomeHref({
                          filter,
                          priority: priorityFilter,
                          tag: t,
                          taskType: taskTypeFilter,
                        })}
                        className={[
                          "rounded-lg border px-3 py-2 font-medium",
                          t === tagFilter
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-default hover:bg-interactive-hover",
                        ].join(" ")}
                      >
                        {t}
                        <span className="ml-1 text-inverted/70">
                          {count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <ul className="divide-y divide-divider border-t border-divider">
            {visibleItems.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title={items.length === 0 ? "还没有待办" : "没有匹配的待办"}
                  description={
                    items.length === 0
                      ? "先添加一条，开始高效的一天。"
                      : "尝试调整筛选条件。"
                  }
                />
              </div>
            ) : (
              visibleItems.map((item, index) => {
                const staggerClass = index < 5 ? `stagger-${index + 1}` : "";
                return (
                  <TodoItem
                    key={item.id}
                    item={item}
                    settings={settings}
                    staggerClass={staggerClass}
                  />
                );
              })
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
