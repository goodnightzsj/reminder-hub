import { DEFAULT_ANNIVERSARY_FILTER, type AnniversaryFilter } from "./anniversary";
import { DEFAULT_ITEM_FILTER, type ItemFilter } from "./items";
import { ROUTES } from "./routes";
import { DEFAULT_SUBSCRIPTION_FILTER, type SubscriptionFilter } from "./subscriptions";
import { DEFAULT_TODO_FILTER, PRIORITY_FILTER_ALL, type PriorityFilter, type TodoFilter } from "./todo";

export const MODAL_QUERY_KEY = "modal" as const;
export const MODAL_CREATE_VALUE = "create" as const;

export const FILTER_QUERY_KEY = "filter" as const;
export const CATEGORY_QUERY_KEY = "category" as const;
export const TODO_PRIORITY_QUERY_KEY = "priority" as const;
export const TODO_TAG_QUERY_KEY = "tag" as const;
export const TODO_TASK_TYPE_QUERY_KEY = "taskType" as const;
export const SEARCH_QUERY_KEY = "q" as const;

export function buildPathnameWithSearchParams(
  pathname: string,
  params: URLSearchParams,
): string {
  const qs = params.toString();
  return qs.length > 0 ? `${pathname}?${qs}` : pathname;
}

export function buildCreateModalHref(pathname: string): string {
  const params = new URLSearchParams();
  params.set(MODAL_QUERY_KEY, MODAL_CREATE_VALUE);
  return buildPathnameWithSearchParams(pathname, params);
}

export function setSearchParamOnPathname(
  pathname: string,
  searchParams: string,
  key: string,
  value: string,
): string {
  const params = new URLSearchParams(searchParams);
  params.set(key, value);
  return buildPathnameWithSearchParams(pathname, params);
}

export function removeSearchParamFromPathname(
  pathname: string,
  searchParams: string,
  key: string,
): string {
  const params = new URLSearchParams(searchParams);
  params.delete(key);
  return buildPathnameWithSearchParams(pathname, params);
}

export function removeSearchParamsFromPathname(
  pathname: string,
  searchParams: string,
  keys: readonly string[],
): string {
  const params = new URLSearchParams(searchParams);
  for (const key of keys) {
    params.delete(key);
  }
  return buildPathnameWithSearchParams(pathname, params);
}

export function buildItemsHref(filter: ItemFilter, category: string | null): string {
  const params = new URLSearchParams();
  if (filter !== DEFAULT_ITEM_FILTER) params.set(FILTER_QUERY_KEY, filter);
  if (category) params.set(CATEGORY_QUERY_KEY, category);
  return buildPathnameWithSearchParams(ROUTES.items, params);
}

export function buildSubscriptionsHref({
  filter,
  category,
}: {
  filter: SubscriptionFilter;
  category: string | null;
}): string {
  const params = new URLSearchParams();
  if (filter !== DEFAULT_SUBSCRIPTION_FILTER) params.set(FILTER_QUERY_KEY, filter);
  if (category) params.set(CATEGORY_QUERY_KEY, category);
  return buildPathnameWithSearchParams(ROUTES.subscriptions, params);
}

export function buildAnniversariesHref({
  filter,
  category,
}: {
  filter: AnniversaryFilter;
  category: string | null;
}): string {
  const params = new URLSearchParams();
  if (filter !== DEFAULT_ANNIVERSARY_FILTER) params.set(FILTER_QUERY_KEY, filter);
  if (category) params.set(CATEGORY_QUERY_KEY, category);
  return buildPathnameWithSearchParams(ROUTES.anniversaries, params);
}

export function buildTodoHref({
  filter,
  priority,
  tag,
  taskType,
}: {
  filter: TodoFilter;
  priority: PriorityFilter;
  tag: string | null;
  taskType: string | null;
}): string {
  const params = new URLSearchParams();
  if (filter !== DEFAULT_TODO_FILTER) params.set(FILTER_QUERY_KEY, filter);
  if (priority !== PRIORITY_FILTER_ALL) params.set(TODO_PRIORITY_QUERY_KEY, priority);
  if (tag) params.set(TODO_TAG_QUERY_KEY, tag);
  if (taskType) params.set(TODO_TASK_TYPE_QUERY_KEY, taskType);
  return buildPathnameWithSearchParams(ROUTES.todo, params);
}

export function buildSearchHref(query: string): string {
  return `${ROUTES.search}?${SEARCH_QUERY_KEY}=${encodeURIComponent(query)}`;
}
