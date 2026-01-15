import "server-only";

import { and, asc, desc, eq, gte, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { anniversaries, items, subscriptions, todos } from "@/server/db/schema";

import {
  buildAnniversariesWithNext,
  buildLowestDailyCostItems,
  buildMonthlySpendRows,
  buildUpcomingItems,
  computeDashboardDateRange,
  getGreeting,
  type LowestDailyCostItem,
  type SpendRow,
} from "./dashboard-utils";

import type { UpcomingItem } from "@/app/_components/dashboard/UpcomingList.types";
import type { AnniversaryDateType } from "@/lib/anniversary";
import { ITEM_STATUS } from "@/lib/items";

export type TodoPreview = { id: string; title: string; dueAt: Date | null };
export type AnniversaryPreview = { id: string; title: string; dateType: AnniversaryDateType };
export type SubscriptionPreview = { id: string; name: string };

export type DashboardStats = {
  activeTodos: number;
  activeTodosNoDueAt: number;
  doneTodosToday: number;
  overdueTodos: number;
  todayTodos: number;
  todayAnniversaries: number;
  todaySubscriptions: number;
  activeAnniversaries: number;
  activeSubscriptions: number;
  activeItems: number;
  upcomingCount: number;
};

export type DashboardPageData = {
  greeting: string;
  timeZone: string;
  stats: DashboardStats;
  overdueTodos: TodoPreview[];
  todayTodos: TodoPreview[];
  todayAnniversaries: AnniversaryPreview[];
  todaySubscriptions: SubscriptionPreview[];
  upcomingVisible: UpcomingItem[];
  monthlySpendRows: SpendRow[];
  lowestDailyCostItems: LowestDailyCostItem[];
};

export async function getDashboardPageData(now: Date = new Date()): Promise<DashboardPageData> {
  const { timeZone, dateReminderTime } = await getAppTimeSettings();

  const greeting = getGreeting(timeZone, now);
  const { today, tomorrow, upcomingEnd, startUtc, endUtc, upcomingEndExclusiveUtc } =
    computeDashboardDateRange(now, timeZone);

  const baseActiveTodoWhere = and(
    eq(todos.isDone, false),
    eq(todos.isArchived, false),
    isNull(todos.deletedAt),
  );
  const baseTodoWhere = and(
    eq(todos.isDone, false),
    eq(todos.isArchived, false),
    isNull(todos.deletedAt),
    isNotNull(todos.dueAt),
  );

  const countStarSql = sql<number>`count(*)`;

  const [
    [{ count: activeTodoCount }],
    [{ count: activeTodoNoDueAtCount }],
    [{ count: doneTodoCountToday }],
    [{ count: overdueTodoCount }],
    overdueTodos,
    [{ count: todayTodoCount }],
    todayTodos,
    [{ count: upcomingTodoCount }],
    upcomingTodos,
    activeAnniversaries,
  ] = await Promise.all([
    db.select({ count: countStarSql }).from(todos).where(baseActiveTodoWhere),
    db
      .select({ count: countStarSql })
      .from(todos)
      .where(and(baseActiveTodoWhere, isNull(todos.dueAt))),
    db
      .select({ count: countStarSql })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, true),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, startUtc),
          lt(todos.completedAt, endUtc),
        ),
      ),
    db
      .select({ count: countStarSql })
      .from(todos)
      .where(and(baseTodoWhere, lt(todos.dueAt, startUtc))),
    db
      .select({ id: todos.id, title: todos.title, dueAt: todos.dueAt })
      .from(todos)
      .where(and(baseTodoWhere, lt(todos.dueAt, startUtc)))
      .orderBy(asc(todos.dueAt))
      .limit(12),
    db
      .select({ count: countStarSql })
      .from(todos)
      .where(and(baseTodoWhere, gte(todos.dueAt, startUtc), lt(todos.dueAt, endUtc))),
    db
      .select({ id: todos.id, title: todos.title, dueAt: todos.dueAt })
      .from(todos)
      .where(and(baseTodoWhere, gte(todos.dueAt, startUtc), lt(todos.dueAt, endUtc)))
      .orderBy(asc(todos.dueAt))
      .limit(12),
    db
      .select({ count: countStarSql })
      .from(todos)
      .where(and(baseTodoWhere, gte(todos.dueAt, endUtc), lt(todos.dueAt, upcomingEndExclusiveUtc))),
    db
      .select({ id: todos.id, title: todos.title, dueAt: todos.dueAt })
      .from(todos)
      .where(and(baseTodoWhere, gte(todos.dueAt, endUtc), lt(todos.dueAt, upcomingEndExclusiveUtc)))
      .orderBy(asc(todos.dueAt))
      .limit(24),
    db
      .select({
        id: anniversaries.id,
        title: anniversaries.title,
        dateType: anniversaries.dateType,
        isLeapMonth: anniversaries.isLeapMonth,
        date: anniversaries.date,
      })
      .from(anniversaries)
      .where(and(eq(anniversaries.isArchived, false), isNull(anniversaries.deletedAt)))
      .orderBy(desc(anniversaries.createdAt)),
  ]);

  const anniversariesWithNext = buildAnniversariesWithNext(activeAnniversaries, {
    today,
    timeZone,
    dateReminderTime,
  });

  const todayAnniversaries = anniversariesWithNext
    .filter((a) => a.daysLeft === 0)
    .map((a) => ({ id: a.id, title: a.title, dateType: a.dateType }));
  const upcomingAnniversaries = anniversariesWithNext.filter(
    (a) => a.daysLeft >= 1 && a.daysLeft <= 7,
  );

  const [activeSubscriptions, activeItemsRows] = await Promise.all([
    db
      .select({
        id: subscriptions.id,
        name: subscriptions.name,
        nextRenewDate: subscriptions.nextRenewDate,
        priceCents: subscriptions.priceCents,
        currency: subscriptions.currency,
        cycleUnit: subscriptions.cycleUnit,
        cycleInterval: subscriptions.cycleInterval,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.isArchived, false), isNull(subscriptions.deletedAt)))
      .orderBy(asc(subscriptions.nextRenewDate)),
    db
      .select({
        id: items.id,
        name: items.name,
        priceCents: items.priceCents,
        currency: items.currency,
        purchasedDate: items.purchasedDate,
        status: items.status,
        createdAt: items.createdAt,
      })
      .from(items)
      .where(and(ne(items.status, ITEM_STATUS.RETIRED), isNull(items.deletedAt)))
      .orderBy(desc(items.createdAt))
      .limit(500),
  ]);

  const todaySubscriptions = activeSubscriptions
    .filter((s) => s.nextRenewDate === today)
    .map((s) => ({ id: s.id, name: s.name }));
  const upcomingSubscriptions = activeSubscriptions.filter(
    (s) => s.nextRenewDate >= tomorrow && s.nextRenewDate <= upcomingEnd,
  );

  const lowestDailyCostItems = buildLowestDailyCostItems(activeItemsRows, today);
  const monthlySpendRows = buildMonthlySpendRows(activeSubscriptions);
  const upcoming = buildUpcomingItems({
    upcomingTodos,
    upcomingAnniversaries,
    upcomingSubscriptions,
    dateReminderTime,
    timeZone,
  });

  const upcomingTotalCount =
    upcomingTodoCount + upcomingAnniversaries.length + upcomingSubscriptions.length;
  const upcomingVisible = upcoming.slice(0, 30);

  const stats: DashboardStats = {
    activeTodos: activeTodoCount,
    activeTodosNoDueAt: activeTodoNoDueAtCount,
    doneTodosToday: doneTodoCountToday,
    overdueTodos: overdueTodoCount,
    todayTodos: todayTodoCount,
    todayAnniversaries: todayAnniversaries.length,
    todaySubscriptions: todaySubscriptions.length,
    activeAnniversaries: activeAnniversaries.length,
    activeSubscriptions: activeSubscriptions.length,
    activeItems: activeItemsRows.length,
    upcomingCount: upcomingTotalCount,
  };

  return {
    greeting,
    timeZone,
    stats,
    overdueTodos,
    todayTodos,
    todayAnniversaries,
    todaySubscriptions,
    upcomingVisible,
    monthlySpendRows,
    lowestDailyCostItems,
  };
}
