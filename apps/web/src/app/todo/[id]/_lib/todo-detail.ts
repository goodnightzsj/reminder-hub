import "server-only";

import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { todos, todoSubtasks } from "@/server/db/schema";
import { formatDateTimeLocal } from "@/server/datetime";
import { parseRecurrenceRuleJson } from "@/server/recurrence";
import { parseNumberArrayJson, parseStringArrayJson } from "@/lib/json";
import { TAGS } from "@/lib/cache-tags";
import type { TodoUpdateFormTodo } from "@/app/_components/todo/TodoUpdateForm.types";

type TodoDetailNextTodo = {
  id: string;
  dueAt: Date | null;
  isDone: boolean;
};

type TodoDetailSubtask = {
  id: string;
  title: string;
  isDone: boolean;
};

export type TodoDetailPageData = {
  timeZone: string;
  todo: TodoUpdateFormTodo;
  subtasks: TodoDetailSubtask[];
  recurrence: ReturnType<typeof parseRecurrenceRuleJson>;
  reminders: number[];
  tags: string[];
  nextTodo: TodoDetailNextTodo | null;
  dueAtLocalValue: string;
  createdAtLabel: string;
};

async function getTodoDetailPageDataUncached(
  id: string,
): Promise<TodoDetailPageData | null> {
  const { timeZone } = await getAppTimeSettings();

  const todo = await db
    .select({
      id: todos.id,
      title: todos.title,
      description: todos.description,
      taskType: todos.taskType,
      priority: todos.priority,
      tags: todos.tags,
      dueAt: todos.dueAt,
      reminderOffsetsMinutes: todos.reminderOffsetsMinutes,
      recurrenceRule: todos.recurrenceRule,
      recurrenceNextId: todos.recurrenceNextId,
      createdAt: todos.createdAt,
    })
    .from(todos)
    .where(eq(todos.id, id))
    .get();
  if (!todo) return null;

  const subtasks = await db
    .select({
      id: todoSubtasks.id,
      title: todoSubtasks.title,
      isDone: todoSubtasks.isDone,
    })
    .from(todoSubtasks)
    .where(eq(todoSubtasks.todoId, id))
    .orderBy(asc(todoSubtasks.createdAt));

  const recurrence = parseRecurrenceRuleJson(todo.recurrenceRule ?? null);
  const reminders = parseNumberArrayJson(todo.reminderOffsetsMinutes, { min: 0 });
  const tags = parseStringArrayJson(todo.tags);

  let nextTodo: TodoDetailNextTodo | null = null;
  if (todo.recurrenceNextId) {
    nextTodo =
      (await db
        .select({
          id: todos.id,
          dueAt: todos.dueAt,
          isDone: todos.isDone,
        })
        .from(todos)
        .where(eq(todos.id, todo.recurrenceNextId))
        .get()) ?? null;
  }

  const dueAtLocalValue = todo.dueAt ? formatDateTimeLocal(todo.dueAt, timeZone) : "";

  const createdAtLabel = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeZone,
  }).format(todo.createdAt);

  const todoForUi = {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    taskType: todo.taskType,
    priority: todo.priority,
  } satisfies TodoUpdateFormTodo;

  return {
    timeZone,
    todo: todoForUi,
    subtasks,
    recurrence,
    reminders,
    tags,
    nextTodo,
    dueAtLocalValue,
    createdAtLabel,
  };
}

/**
 * 详情页数据缓存：每个 todo 独立 tag，写操作通过 revalidateTag 即时失效。
 * 10 分钟 TTL 作为兜底，避免 cache key 泄漏后的长期错误。
 */
export async function getTodoDetailPageData(id: string): Promise<TodoDetailPageData | null> {
  return unstable_cache(
    async () => getTodoDetailPageDataUncached(id),
    ["todo-detail", id],
    { tags: [TAGS.todo(id)], revalidate: 600 },
  )();
}

