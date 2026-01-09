
import { and, asc, desc, eq, ne, isNull, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { todos } from "@/server/db/schema";
// Using parseRecurrenceRuleJson implicitly via string parsing if needed or pass raw strings to components

import { AppHeader } from "../_components/AppHeader";
import { TodoCreateForm } from "../_components/todo/TodoCreateForm";
import { TodoList } from "../_components/todo/TodoList";
import { CreateModal } from "../_components/CreateModal";
import { SegmentedControl } from "../_components/SegmentedControl";

export const dynamic = "force-dynamic";

// Used for server component props
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

type TodoFilter = "active" | "done" | "archived" | "trash" | "all";

function parseTodoFilter(raw: string | null): TodoFilter {
  if (raw === "active") return "active";
  if (raw === "done") return "done";
  if (raw === "archived") return "archived";
  if (raw === "trash") return "trash";
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

  // Build status predicates for taskTypes query (same logic as main query)
  const taskTypeStatusPredicates = [];
  if (filter === "trash") {
    taskTypeStatusPredicates.push(isNotNull(todos.deletedAt));
  } else {
    taskTypeStatusPredicates.push(isNull(todos.deletedAt));
    if (filter === "active") {
      taskTypeStatusPredicates.push(eq(todos.isDone, false), eq(todos.isArchived, false));
    } else if (filter === "done") {
      taskTypeStatusPredicates.push(eq(todos.isDone, true), eq(todos.isArchived, false));
    } else if (filter === "archived") {
      taskTypeStatusPredicates.push(eq(todos.isArchived, true));
    }
    // filter === "all" has no additional predicates (just non-deleted)
  }

  // Query taskTypes scoped to current status filter
  const taskTypesRows = await db
    .select({ taskType: todos.taskType })
    .from(todos)
    .where(and(...taskTypeStatusPredicates))
    .groupBy(todos.taskType)
    .orderBy(asc(todos.taskType));
  const taskTypes = taskTypesRows
    .map((r) => r.taskType)
    .filter((t): t is string => typeof t === "string" && t.length > 0)
    .slice(0, 20);

  // If current taskType filter no longer exists in this status, treat as "全部"
  const effectiveTaskTypeFilter =
    taskTypeFilter && taskTypes.includes(taskTypeFilter) ? taskTypeFilter : null;

  // Build predicates using effectiveTaskTypeFilter
  const predicates = [];
  if (filter === "trash") {
    // In trash: show only deleted items
    predicates.push(isNotNull(todos.deletedAt));
  } else {
    // Not in trash: show only non-deleted items
    predicates.push(isNull(todos.deletedAt));

    if (filter === "active") {
      predicates.push(eq(todos.isDone, false), eq(todos.isArchived, false));
    } else if (filter === "done") {
      predicates.push(eq(todos.isDone, true), eq(todos.isArchived, false));
    } else if (filter === "archived") {
      predicates.push(eq(todos.isArchived, true));
    }
  }

  if (priorityFilter !== "all") {
    predicates.push(eq(todos.priority, priorityFilter));
  }

  if (effectiveTaskTypeFilter) {
    predicates.push(eq(todos.taskType, effectiveTaskTypeFilter));
  }

  const where =
    predicates.length === 0
      ? undefined
      : predicates.length === 1
        ? predicates[0]
        : and(...predicates);

  /*
    Sorting Logic (varies by filter):
    - active: isDone ASC → 紧急度 DESC → 优先级 DESC → createdAt DESC
    - done: updatedAt DESC (最近完成的在上面)
    - trash: 优先级 DESC → deletedAt ASC (先删除的在上面)
  */
  let orderByClause;
  if (filter === "trash") {
    // 废纸篓：按优先级排序，相同优先级按删除时间升序
    orderByClause = [
      sql`CASE ${todos.priority} 
        WHEN 'high' THEN 3 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 1 
        ELSE 0 
      END DESC`,
      asc(todos.deletedAt)
    ];
  } else if (filter === "done") {
    // 已完成：按更新时间降序（最近完成的在上面）
    orderByClause = [desc(todos.updatedAt)];
  } else {
    // 进行中/全部：原有逻辑
    orderByClause = [
      asc(todos.isDone),
      sql`CASE 
        WHEN ${todos.isDone} = 0 AND ${todos.dueAt} IS NOT NULL AND ${todos.dueAt} < (unixepoch() + 3600) * 1000 THEN 1 
        ELSE 0 
      END DESC`,
      sql`CASE ${todos.priority} 
        WHEN 'high' THEN 3 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 1 
        ELSE 0 
      END DESC`,
      desc(todos.createdAt)
    ];
  }

  const items = await db.query.todos.findMany({
    where,
    orderBy: orderByClause,
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



        {/* Mobile Create Modal */}
        {filter !== 'trash' && (
          <CreateModal title="新建待办">
            <TodoCreateForm timeZone={settings.timeZone} className="" />
          </CreateModal>
        )}

        <section className="rounded-xl border border-default bg-elevated shadow-sm">
          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-medium">列表</h2>
              <SegmentedControl
                options={[
                  { key: "active", label: "进行中", href: buildHomeHref({ filter: "active", priority: priorityFilter, tag: tagFilter, taskType: taskTypeFilter }) },
                  { key: "done", label: "已完成", href: buildHomeHref({ filter: "done", priority: priorityFilter, tag: tagFilter, taskType: taskTypeFilter }) },
                  { key: "trash", label: "废纸篓", href: buildHomeHref({ filter: "trash", priority: priorityFilter, tag: tagFilter, taskType: taskTypeFilter }) },
                ]}
                currentValue={filter}
                layoutId="todo-filter"
              />
            </div>

            {/* ... (Filter controls - kept same) */}
            <div className="border-t border-divider pt-4">
              {/* Same filter controls for priority/type/tags */}
              {/* NOTE: I am copying the whole updated logic here, but relying on user to see the diff via tool */}
              <nav className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-muted">优先级</span>
                <SegmentedControl
                  options={[
                    { key: "all", label: "全部", href: buildHomeHref({ filter, priority: "all", tag: tagFilter, taskType: taskTypeFilter }) },
                    { key: "high", label: "高", href: buildHomeHref({ filter, priority: "high", tag: tagFilter, taskType: taskTypeFilter }) },
                    { key: "medium", label: "中", href: buildHomeHref({ filter, priority: "medium", tag: tagFilter, taskType: taskTypeFilter }) },
                    { key: "low", label: "低", href: buildHomeHref({ filter, priority: "low", tag: tagFilter, taskType: taskTypeFilter }) },
                  ]}
                  currentValue={priorityFilter}
                  layoutId="priority-filter"
                />

                <span className="text-muted">分类</span>
                <SegmentedControl
                  options={[
                    { key: "all", label: "全部", href: buildHomeHref({ filter, priority: priorityFilter, tag: tagFilter, taskType: null }) },
                    ...taskTypes.map((t) => ({
                      key: t,
                      label: t,
                      href: buildHomeHref({ filter, priority: priorityFilter, tag: tagFilter, taskType: t }),
                    }))
                  ]}
                  currentValue={effectiveTaskTypeFilter ?? "all"}
                  layoutId="category-filter"
                />

                {tagFilter ||
                  priorityFilter !== "all" ||
                  effectiveTaskTypeFilter !== null ||
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

          <TodoList
            items={visibleItems}
            settings={settings}
            emptyTitle={
              filter === 'trash' ? "废纸篓为空" :
                items.length === 0 ? "还没有待办" : "没有匹配的待办"
            }
            emptyDescription={
              filter === 'trash' ? "你的废纸篓很干净。" :
                items.length === 0
                  ? "先添加一条，开始高效的一天。"
                  : "尝试调整筛选条件。"
            }
          />
        </section>
      </main>
    </div >
  );
}

