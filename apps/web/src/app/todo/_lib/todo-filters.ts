import { parseEnumString } from "@/lib/parse-enum";
import {
  DEFAULT_TODO_FILTER,
  PRIORITY_FILTER_ALL,
  priorityFilterValues,
  TODO_FILTER,
  todoFilterValues,
  type PriorityFilter,
  type TodoFilter,
} from "@/lib/todo";

export { DEFAULT_TODO_FILTER, PRIORITY_FILTER_ALL, TODO_FILTER };
export type { PriorityFilter, TodoFilter };

export function parseTodoFilter(raw: string | null): TodoFilter {
  return parseEnumString(raw, todoFilterValues, DEFAULT_TODO_FILTER);
}

export function parsePriorityFilter(raw: string | null): PriorityFilter {
  return parseEnumString(raw, priorityFilterValues, PRIORITY_FILTER_ALL);
}

function parseShortTextFilter(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 50);
}

export function parseTagFilter(raw: string | null): string | null {
  return parseShortTextFilter(raw);
}

export function parseTaskTypeFilter(raw: string | null): string | null {
  return parseShortTextFilter(raw);
}
