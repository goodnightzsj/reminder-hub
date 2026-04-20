import "server-only";

import { and, desc, eq, isNull, like, or } from "drizzle-orm";

import { db } from "@/server/db";
import { anniversaries, items, serviceIcons, subscriptions, todos } from "@/server/db/schema";

const QUERY_MAX_LEN = 100;
const SEARCH_LIMIT = 20;

export function parseSearchQuery(raw: string | null): string {
  return (raw ?? "").trim().slice(0, QUERY_MAX_LEN);
}

async function querySearchRowsNonEmpty(q: string) {
  const pattern = `%${q}%`;

  return Promise.all(
    [
      // Todo：扩展到 description + tags(JSON 字符串)；过滤软删除。
      db
        .select({
          id: todos.id,
          title: todos.title,
          dueAt: todos.dueAt,
          isDone: todos.isDone,
          isArchived: todos.isArchived,
          createdAt: todos.createdAt,
          priority: todos.priority,
        })
        .from(todos)
        .where(
          and(
            isNull(todos.deletedAt),
            or(
              like(todos.title, pattern),
              like(todos.description, pattern),
              like(todos.tags, pattern),
            ),
          ),
        )
        .orderBy(desc(todos.createdAt))
        .limit(SEARCH_LIMIT),
      db
        .select({
          id: anniversaries.id,
          title: anniversaries.title,
          date: anniversaries.date,
          dateType: anniversaries.dateType,
          isArchived: anniversaries.isArchived,
          createdAt: anniversaries.createdAt,
        })
        .from(anniversaries)
        .where(
          and(
            isNull(anniversaries.deletedAt),
            like(anniversaries.title, pattern),
          ),
        )
        .orderBy(desc(anniversaries.createdAt))
        .limit(SEARCH_LIMIT),
      // Subscription：扩展到 description；过滤软删除。
      db
        .select({
          id: subscriptions.id,
          name: subscriptions.name,
          nextRenewDate: subscriptions.nextRenewDate,
          isArchived: subscriptions.isArchived,
          createdAt: subscriptions.createdAt,
          icon: serviceIcons.icon,
          color: serviceIcons.color,
        })
        .from(subscriptions)
        .leftJoin(serviceIcons, eq(subscriptions.name, serviceIcons.name))
        .where(
          and(
            isNull(subscriptions.deletedAt),
            or(
              like(subscriptions.name, pattern),
              like(subscriptions.description, pattern),
            ),
          ),
        )
        .orderBy(desc(subscriptions.createdAt))
        .limit(SEARCH_LIMIT),
      db
        .select({
          id: items.id,
          name: items.name,
          status: items.status,
          purchasedDate: items.purchasedDate,
          createdAt: items.createdAt,
        })
        .from(items)
        .where(
          and(
            isNull(items.deletedAt),
            like(items.name, pattern),
          ),
        )
        .orderBy(desc(items.createdAt))
        .limit(SEARCH_LIMIT),
    ] as const,
  );
}

export type SearchRows = Awaited<ReturnType<typeof querySearchRowsNonEmpty>>;

export async function querySearchRows(q: string): Promise<SearchRows> {
  const query = parseSearchQuery(q);
  if (query.length === 0) {
    const empty: SearchRows = [[], [], [], []];
    return empty;
  }

  return querySearchRowsNonEmpty(query);
}
