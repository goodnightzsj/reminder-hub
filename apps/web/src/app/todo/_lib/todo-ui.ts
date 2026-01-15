import "server-only";

import { formatRecurrenceRuleZh, parseRecurrenceRuleJson } from "@/server/recurrence";
import { parseStringArrayJson } from "@/lib/json";

import type { TodoItemData } from "../../_components/todo/TodoItem.types";
import { TODO_FILTER, type TodoFilter } from "./todo-filters";

export type TodoListRowForUi = {
  id: string;
  title: string;
  description: string | null;
  taskType: string;
  priority: TodoItemData["priority"];
  tags: string;
  dueAt: Date | null;
  recurrenceRule: string | null;
  isDone: boolean;
  deletedAt: Date | null;
  subtasks: { id: string; isDone: boolean }[];
};

export function toTodoItemData(item: TodoListRowForUi): TodoItemData {
  const rule = parseRecurrenceRuleJson(item.recurrenceRule ?? null);
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    taskType: item.taskType,
    priority: item.priority,
    tags: parseStringArrayJson(item.tags),
    dueAt: item.dueAt,
    recurrenceLabel: rule ? formatRecurrenceRuleZh(rule) : null,
    isDone: item.isDone,
    deletedAt: item.deletedAt,
    subtasks: item.subtasks.map((subtask) => ({
      id: subtask.id,
      isDone: subtask.isDone,
    })),
  };
}

export type TagCountRow = readonly [tag: string, count: number];

export function computeTagsSorted(itemsForUi: readonly TodoItemData[]): TagCountRow[] {
  const tagCounts = new Map<string, number>();
  for (const item of itemsForUi) {
    for (const tag of item.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, 24);
}

export function filterTodoItemsByTag(
  itemsForUi: readonly TodoItemData[],
  tagFilter: string | null,
): TodoItemData[] {
  if (!tagFilter) return [...itemsForUi];
  return itemsForUi.filter((item) => item.tags.includes(tagFilter));
}

export function getTodoEmptyState(
  filter: TodoFilter,
  totalItems: number,
): { emptyTitle: string; emptyDescription: string } {
  const emptyTitle =
    filter === TODO_FILTER.TRASH
      ? "废纸篓为空"
      : totalItems === 0
        ? "还没有待办"
        : "没有匹配的待办";

  const emptyDescription =
    filter === TODO_FILTER.TRASH
      ? "你的废纸篓很干净。"
      : totalItems === 0
        ? "先添加一条，开始高效的一天。"
        : "尝试调整筛选条件。";

  return { emptyTitle, emptyDescription };
}
