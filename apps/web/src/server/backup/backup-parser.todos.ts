import "server-only";

import { isTodoPriority } from "@/lib/todo";
import { todoSubtasks, todos } from "@/server/db/schema";

import { asBoolean, asDateFromMs, asString, hasOwn } from "./backup-parser.utils";

export function parseTodoRow(row: Record<string, unknown>, index: number): typeof todos.$inferInsert {
  const id = asString(row.id);
  const title = asString(row.title);
  if (!id) throw new Error(`todos[${index}].id is missing`);
  if (!title) throw new Error(`todos[${index}].title is missing`);

  const insert: typeof todos.$inferInsert = { id, title };

  if (hasOwn(row, "description")) {
    const value = row.description;
    const parsed = asString(value);
    if (value !== null && parsed === null) {
      throw new Error(`todos[${index}].description must be string|null`);
    }
    insert.description = parsed;
  }

  if (hasOwn(row, "taskType")) {
    const value = row.taskType;
    if (typeof value !== "string") throw new Error(`todos[${index}].taskType must be string`);
    insert.taskType = value;
  }

  if (hasOwn(row, "priority")) {
    const value = row.priority;
    if (typeof value !== "string") throw new Error(`todos[${index}].priority must be string`);
    if (!isTodoPriority(value)) {
      throw new Error(`todos[${index}].priority is invalid`);
    }
    insert.priority = value;
  }

  if (hasOwn(row, "tags")) {
    const value = row.tags;
    if (typeof value !== "string") throw new Error(`todos[${index}].tags must be string`);
    insert.tags = value;
  }

  if (hasOwn(row, "reminderOffsetsMinutes")) {
    const value = row.reminderOffsetsMinutes;
    if (typeof value !== "string") {
      throw new Error(`todos[${index}].reminderOffsetsMinutes must be string`);
    }
    insert.reminderOffsetsMinutes = value;
  }

  if (hasOwn(row, "recurrenceRule")) {
    const value = row.recurrenceRule;
    const parsed = asString(value);
    if (value !== null && parsed === null) {
      throw new Error(`todos[${index}].recurrenceRule must be string|null`);
    }
    insert.recurrenceRule = parsed;
  }

  if (hasOwn(row, "recurrenceRootId")) {
    const value = row.recurrenceRootId;
    const parsed = asString(value);
    if (value !== null && parsed === null) {
      throw new Error(`todos[${index}].recurrenceRootId must be string|null`);
    }
    insert.recurrenceRootId = parsed;
  }

  if (hasOwn(row, "recurrenceNextId")) {
    const value = row.recurrenceNextId;
    const parsed = asString(value);
    if (value !== null && parsed === null) {
      throw new Error(`todos[${index}].recurrenceNextId must be string|null`);
    }
    insert.recurrenceNextId = parsed;
  }

  if (hasOwn(row, "isDone")) {
    const value = asBoolean(row.isDone);
    if (value === null) throw new Error(`todos[${index}].isDone must be boolean`);
    insert.isDone = value;
  }

  if (hasOwn(row, "isArchived")) {
    const value = asBoolean(row.isArchived);
    if (value === null) throw new Error(`todos[${index}].isArchived must be boolean`);
    insert.isArchived = value;
  }

  if (hasOwn(row, "dueAt")) {
    const value = row.dueAt;
    if (value === null) {
      insert.dueAt = null;
    } else {
      const date = asDateFromMs(value);
      if (!date) throw new Error(`todos[${index}].dueAt must be ms timestamp|null`);
      insert.dueAt = date;
    }
  }

  if (hasOwn(row, "completedAt")) {
    const value = row.completedAt;
    if (value === null) {
      insert.completedAt = null;
    } else {
      const date = asDateFromMs(value);
      if (!date) throw new Error(`todos[${index}].completedAt must be ms timestamp|null`);
      insert.completedAt = date;
    }
  }

  if (hasOwn(row, "archivedAt")) {
    const value = row.archivedAt;
    if (value === null) {
      insert.archivedAt = null;
    } else {
      const date = asDateFromMs(value);
      if (!date) throw new Error(`todos[${index}].archivedAt must be ms timestamp|null`);
      insert.archivedAt = date;
    }
  }

  if (hasOwn(row, "deletedAt")) {
    const value = row.deletedAt;
    if (value === null) {
      insert.deletedAt = null;
    } else {
      const date = asDateFromMs(value);
      if (!date) throw new Error(`todos[${index}].deletedAt must be ms timestamp|null`);
      insert.deletedAt = date;
    }
  }

  if (hasOwn(row, "createdAt")) {
    const date = asDateFromMs(row.createdAt);
    if (!date) throw new Error(`todos[${index}].createdAt must be ms timestamp`);
    insert.createdAt = date;
  }

  if (hasOwn(row, "updatedAt")) {
    const date = asDateFromMs(row.updatedAt);
    if (!date) throw new Error(`todos[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = date;
  }

  return insert;
}

export function parseTodoSubtaskRow(
  row: Record<string, unknown>,
  index: number,
): typeof todoSubtasks.$inferInsert {
  const id = asString(row.id);
  const todoId = asString(row.todoId);
  const title = asString(row.title);
  if (!id) throw new Error(`todoSubtasks[${index}].id is missing`);
  if (!todoId) throw new Error(`todoSubtasks[${index}].todoId is missing`);
  if (!title) throw new Error(`todoSubtasks[${index}].title is missing`);

  const insert: typeof todoSubtasks.$inferInsert = { id, todoId, title };

  if (hasOwn(row, "isDone")) {
    const value = asBoolean(row.isDone);
    if (value === null) throw new Error(`todoSubtasks[${index}].isDone must be boolean`);
    insert.isDone = value;
  }

  if (hasOwn(row, "createdAt")) {
    const date = asDateFromMs(row.createdAt);
    if (!date) throw new Error(`todoSubtasks[${index}].createdAt must be ms timestamp`);
    insert.createdAt = date;
  }

  if (hasOwn(row, "updatedAt")) {
    const date = asDateFromMs(row.updatedAt);
    if (!date) throw new Error(`todoSubtasks[${index}].updatedAt must be ms timestamp`);
    insert.updatedAt = date;
  }

  return insert;
}
