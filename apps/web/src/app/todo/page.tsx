import type { Metadata } from "next";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { todos } from "@/server/db/schema";
import { ROUTES } from "@/lib/routes";
import { getSearchParamString, type SearchParams } from "@/lib/search-params";
import { TODO_PRIORITY } from "@/lib/todo";
import {
  buildTodoHref as buildHomeHref,
  FILTER_QUERY_KEY,
  TODO_PRIORITY_QUERY_KEY,
  TODO_TAG_QUERY_KEY,
  TODO_TASK_TYPE_QUERY_KEY,
} from "@/lib/url";

import { AppHeader } from "../_components/layout/AppHeader";
import { TodoCreateForm } from "../_components/todo/TodoCreateForm";
import { TodoList } from "../_components/todo/TodoList";
import { CreateModal } from "../_components/modals/CreateModal";
import { SegmentedControl } from "../_components/SegmentedControl";
import { MagicCapsuleButton } from "../_components/todo/MagicCapsuleButton";
import type { TodoItemData } from "../_components/todo/TodoItem.types";

import {
  PRIORITY_FILTER_ALL,
  TODO_FILTER,
  parsePriorityFilter,
  parseTagFilter,
  parseTaskTypeFilter,
  parseTodoFilter,
} from "./_lib/todo-filters";
import { buildTodoStatusPredicates } from "./_lib/todo-query";
import { computeTagsSorted, filterTodoItemsByTag, getTodoEmptyState, toTodoItemData } from "./_lib/todo-ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "待办",
  description: "查看、筛选并管理待办事项、子任务、提醒与循环任务。",
};

// Used for server component props
type HomePageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseTodoFilter(getSearchParamString(params, FILTER_QUERY_KEY));
  const priorityFilter = parsePriorityFilter(getSearchParamString(params, TODO_PRIORITY_QUERY_KEY));
  const tagFilter = parseTagFilter(getSearchParamString(params, TODO_TAG_QUERY_KEY));
  const taskTypeFilter = parseTaskTypeFilter(getSearchParamString(params, TODO_TASK_TYPE_QUERY_KEY));
  const { timeZone } = await getAppTimeSettings();

  // Build status predicates for taskTypes query (same logic as main query)
  const taskTypeStatusPredicates = buildTodoStatusPredicates(filter);

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
  const predicates = buildTodoStatusPredicates(filter);

  if (priorityFilter !== PRIORITY_FILTER_ALL) {
    predicates.push(eq(todos.priority, priorityFilter));
  }

  if (effectiveTaskTypeFilter) {
    predicates.push(eq(todos.taskType, effectiveTaskTypeFilter));
  }

  const where = and(...predicates);

  /*
    Sorting Logic (varies by filter):
    - active: isDone ASC → 紧急度 DESC → 优先级 DESC → createdAt DESC
    - done: updatedAt DESC (最近完成的在上面)
    - trash: 优先级 DESC → deletedAt ASC (先删除的在上面)
  */
  const todoPriorityRankDescSql = sql`CASE ${todos.priority}
    WHEN 'high' THEN 3
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 1
    ELSE 0
  END DESC`;
  const todoDueSoonDescSql = sql`CASE
    WHEN ${todos.isDone} = 0 AND ${todos.dueAt} IS NOT NULL AND ${todos.dueAt} < (unixepoch() + 3600) * 1000 THEN 1
    ELSE 0
  END DESC`;
  const orderByClause =
    filter === TODO_FILTER.TRASH
      ? [todoPriorityRankDescSql, asc(todos.deletedAt)]
      : filter === TODO_FILTER.DONE
        ? [desc(todos.updatedAt)]
        : [
            asc(todos.isDone),
            todoDueSoonDescSql,
            todoPriorityRankDescSql,
            desc(todos.createdAt),
          ];

  const items = await db.query.todos.findMany({
    where,
    orderBy: orderByClause,
    columns: {
      id: true,
      title: true,
      description: true,
      taskType: true,
      priority: true,
      tags: true,
      dueAt: true,
      recurrenceRule: true,
      isDone: true,
      deletedAt: true,
    },
    with: {
      subtasks: {
        columns: {
          id: true,
          isDone: true,
        },
      },
    },
  });

  const itemsForUi: TodoItemData[] = items.map(toTodoItemData);
  const tagsSorted = computeTagsSorted(itemsForUi);
  const visibleItems = filterTodoItemsByTag(itemsForUi, tagFilter);
  const { emptyTitle, emptyDescription } = getTodoEmptyState(filter, items.length);

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader title="Todo" />

        {/* Mobile Create Modal */}
        {filter !== TODO_FILTER.TRASH && (
          <CreateModal title="新建待办">
            <TodoCreateForm className="" />
          </CreateModal>
        )}

        {/* 与纪念日/订阅/物品页对齐：去掉大 border 容器，避免跨页跳变出现一圈线框；
            保留 bg-elevated + rounded-2xl 的轻柔分段，不画边 */}
        <section className="rounded-2xl bg-elevated overflow-hidden min-h-[600px]">
          {/* Sticky Header with Glassmorphism */}
          <div className="sticky top-0 z-20 border-b border-divider bg-glass backdrop-blur-xl px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              {/* Desktop Create Button (Left) */}
              <div className="hidden md:block">
                <MagicCapsuleButton />
              </div>

              {/* Mobile Title or Spacer (keep layout stable) */}
              <div className="md:hidden" />

              <SegmentedControl
                options={[
                  { key: TODO_FILTER.ACTIVE, label: "进行中", href: buildHomeHref({ filter: TODO_FILTER.ACTIVE, priority: priorityFilter, tag: tagFilter, taskType: taskTypeFilter }) },
                  { key: TODO_FILTER.DONE, label: "已完成", href: buildHomeHref({ filter: TODO_FILTER.DONE, priority: priorityFilter, tag: tagFilter, taskType: taskTypeFilter }) },
                  { key: TODO_FILTER.TRASH, label: "废纸篓", href: buildHomeHref({ filter: TODO_FILTER.TRASH, priority: priorityFilter, tag: tagFilter, taskType: taskTypeFilter }) },
                ]}
                currentValue={filter}
                layoutId="todo-filter"
              />
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-muted font-medium">优先级</span>
              <SegmentedControl
                options={[
                  { key: PRIORITY_FILTER_ALL, label: "全部", href: buildHomeHref({ filter, priority: PRIORITY_FILTER_ALL, tag: tagFilter, taskType: taskTypeFilter }) },
                  { key: TODO_PRIORITY.HIGH, label: "高", href: buildHomeHref({ filter, priority: TODO_PRIORITY.HIGH, tag: tagFilter, taskType: taskTypeFilter }) },
                  { key: TODO_PRIORITY.MEDIUM, label: "中", href: buildHomeHref({ filter, priority: TODO_PRIORITY.MEDIUM, tag: tagFilter, taskType: taskTypeFilter }) },
                  { key: TODO_PRIORITY.LOW, label: "低", href: buildHomeHref({ filter, priority: TODO_PRIORITY.LOW, tag: tagFilter, taskType: taskTypeFilter }) },
                ]}
                currentValue={priorityFilter}
                layoutId="priority-filter"
              />

              <div className="h-4 w-px bg-divider mx-1" />

              <span className="text-muted font-medium">分类</span>
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

              {(tagFilter ||
                priorityFilter !== PRIORITY_FILTER_ALL ||
                effectiveTaskTypeFilter !== null ||
                filter !== TODO_FILTER.ACTIVE) && (
                <Link
                  href={ROUTES.todo}
                  className="ml-auto rounded-lg border border-default px-2.5 py-1.5 font-medium text-muted hover:bg-interactive-hover hover:text-primary active-press transition-colors"
                >
                  清除筛选
                </Link>
              )}
            </div>

            {tagsSorted.length > 0 && (
              <div className="mt-3 flex flex-nowrap overflow-x-auto gap-2 pb-1 scrollbar-hide mask-fade-right">
                {tagsSorted.map(([t, count]) => (
                  <Link
                    key={t}
                    href={buildHomeHref({ filter, priority: priorityFilter, tag: t, taskType: taskTypeFilter })}
                    className={[
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                      t === tagFilter
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-default bg-surface/50 text-secondary hover:bg-interactive-hover",
                    ].join(" ")}
                  >
                    #{t}
                    <span className="ml-1 opacity-60">{count}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <TodoList
            items={visibleItems}
            timeZone={timeZone}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            emptyShowCreateCta={items.length === 0 && filter !== TODO_FILTER.TRASH}
          />
        </section>
      </main>
    </div>
  );
}
