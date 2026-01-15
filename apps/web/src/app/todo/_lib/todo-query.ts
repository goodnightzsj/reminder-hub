import "server-only";

import type { SQL } from "drizzle-orm";
import { eq, isNotNull, isNull } from "drizzle-orm";

import { todos } from "@/server/db/schema";

import { TODO_FILTER, type TodoFilter } from "./todo-filters";

export function buildTodoStatusPredicates(filter: TodoFilter): SQL[] {
  const predicates: SQL[] = [];
  if (filter === TODO_FILTER.TRASH) {
    predicates.push(isNotNull(todos.deletedAt));
    return predicates;
  }

  predicates.push(isNull(todos.deletedAt));
  if (filter === TODO_FILTER.ACTIVE) {
    predicates.push(eq(todos.isDone, false), eq(todos.isArchived, false));
  } else if (filter === TODO_FILTER.DONE) {
    predicates.push(eq(todos.isDone, true), eq(todos.isArchived, false));
  }

  return predicates;
}
