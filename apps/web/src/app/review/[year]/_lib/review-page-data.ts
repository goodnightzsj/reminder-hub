import "server-only";

import { and, asc, desc, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";

import {
  ANNIVERSARY_DATE_TYPE,
  canonicalizeAnniversaryCategory,
  type AnniversaryDateType,
} from "@/lib/anniversary";
import { DEFAULT_ITEM_CATEGORY } from "@/lib/items";

import { getNextLunarOccurrenceDateString, getNextSolarOccurrenceDateString } from "@/server/anniversary";
import { db } from "@/server/db";
import { getAppTimeSettings } from "@/server/db/settings";
import { anniversaries, items, subscriptions, todos } from "@/server/db/schema";
import { formatDateInTimeZone, parseDateString } from "@/server/date";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import { getWeeklyDigestPeriods } from "@/server/digest-periods";

type MonthlyCountRow = { month: number; created: number; completed: number };

type CountRow = { key: string; count: number };

type TodoDetail = {
  id: string;
  title: string;
  taskType: string;
  priority: string;
  tags: string[];
  dueAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  href: string;
};

function getMonthIndexInTimeZone(date: Date, timeZone: string): number {
  const month = new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone }).format(date);
  const parsed = Number(month);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(12, Math.max(1, parsed));
}

function buildMonthlyCounts(args: {
  timeZone: string;
  createdAt: Date[];
  completedAt: Date[];
}): MonthlyCountRow[] {
  const createdByMonth = new Array<number>(12).fill(0);
  const completedByMonth = new Array<number>(12).fill(0);

  for (const d of args.createdAt) {
    const idx = getMonthIndexInTimeZone(d, args.timeZone) - 1;
    createdByMonth[idx] += 1;
  }
  for (const d of args.completedAt) {
    const idx = getMonthIndexInTimeZone(d, args.timeZone) - 1;
    completedByMonth[idx] += 1;
  }

  return createdByMonth.map((created, i) => ({
    month: i + 1,
    created,
    completed: completedByMonth[i] ?? 0,
  }));
}

export type YearReviewPageData = {
  year: number;
  availableYears: number[];
  timeZone: string;
  generatedAtIso: string;
  yearRange: { startDate: string; endDate: string };
  thisWeek: { startDate: string; endDate: string };
  thisWeekNew: {
    todos: Array<{ title: string; createdAt: Date }>;
    anniversaries: Array<{ title: string; createdAt: Date }>;
    subscriptions: Array<{ name: string; createdAt: Date }>;
    items: Array<{ name: string; createdAt: Date }>;
  };
  stats: {
    todosCreated: number;
    todosCompleted: number;
    todosActive: number;
    anniversariesActive: number;
    subscriptionsActive: number;
    itemsActive: number;
  };
  breakdown: {
    todosByTaskType: Array<{ taskType: string; created: number; completed: number; active: number }>;
    todosByPriority: Array<{ priority: string; created: number; completed: number }>;
    subscriptionsByCategory: CountRow[];
    subscriptionsByCycleUnit: CountRow[];
    subscriptionsByAutoRenew: { autoRenew: number; manualRenew: number };
    anniversariesByCategory: CountRow[];
    anniversariesByDateType: CountRow[];
    itemsByCategory: CountRow[];
    itemsByStatus: CountRow[];
  };
  details: {
    completedTodos: TodoDetail[];
  };
  highlights: {
    completedTodos: Array<{ title: string; completedAt: Date }>;
    createdTodos: Array<{ title: string; createdAt: Date }>;
  };
  monthlyCounts: MonthlyCountRow[];
  anniversariesInYear: Array<{ title: string; category: string; dateType: AnniversaryDateType; occurrenceDate: string }>;
  itemsInYear: Array<{ name: string; category: string; status: string; purchasedDate: string | null; createdAt: Date }>;
  subscriptionsActiveList: Array<{ name: string; category: string; cycleUnit: string; nextRenewDate: string; autoRenew: boolean }>;
};

function safeParseStringList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);
  } catch {
    return [];
  }
}

function toYearInTimeZone(date: Date, timeZone: string): number {
  const yearString = formatDateInTimeZone(date, timeZone).slice(0, 4);
  const year = Number(yearString);
  if (!Number.isFinite(year)) return new Date().getFullYear();
  return year;
}

function cap<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  return arr.slice(0, max);
}

function mergeCountMaps(base: Map<string, number>, next: ReadonlyArray<{ key: string; count: number }>) {
  for (const row of next) {
    base.set(row.key, (base.get(row.key) ?? 0) + row.count);
  }
}

function countRowsToMap(rows: ReadonlyArray<{ key: string; count: number }>): Map<string, number> {
  const map = new Map<string, number>();
  mergeCountMaps(map, rows);
  return map;
}

function sortCountRows(rows: ReadonlyArray<CountRow>): CountRow[] {
  return [...rows].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, "zh-CN"));
}

export async function getReviewAvailableYears(timeZone: string, now: Date): Promise<number[]> {
  const [
    todoMinMax,
    todoCompletedMinMax,
    annMinMax,
    subMinMax,
    itemMinMax,
  ] = await Promise.all([
    db
      .select({
        min: sql<number | null>`min(${todos.createdAt})`,
        max: sql<number | null>`max(${todos.createdAt})`,
      })
      .from(todos)
      .where(isNull(todos.deletedAt))
      .get(),
    db
      .select({
        min: sql<number | null>`min(${todos.completedAt})`,
        max: sql<number | null>`max(${todos.completedAt})`,
      })
      .from(todos)
      .where(and(isNotNull(todos.completedAt), isNull(todos.deletedAt)))
      .get(),
    db
      .select({
        min: sql<number | null>`min(${anniversaries.createdAt})`,
        max: sql<number | null>`max(${anniversaries.createdAt})`,
      })
      .from(anniversaries)
      .where(isNull(anniversaries.deletedAt))
      .get(),
    db
      .select({
        min: sql<number | null>`min(${subscriptions.createdAt})`,
        max: sql<number | null>`max(${subscriptions.createdAt})`,
      })
      .from(subscriptions)
      .where(isNull(subscriptions.deletedAt))
      .get(),
    db
      .select({
        min: sql<number | null>`min(${items.createdAt})`,
        max: sql<number | null>`max(${items.createdAt})`,
      })
      .from(items)
      .where(isNull(items.deletedAt))
      .get(),
  ]);

  const candidates: number[] = [];
  const pushTs = (value: number | null | undefined) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    candidates.push(toYearInTimeZone(new Date(value), timeZone));
  };

  pushTs(todoMinMax?.min);
  pushTs(todoMinMax?.max);
  pushTs(todoCompletedMinMax?.min);
  pushTs(todoCompletedMinMax?.max);
  pushTs(annMinMax?.min);
  pushTs(annMinMax?.max);
  pushTs(subMinMax?.min);
  pushTs(subMinMax?.max);
  pushTs(itemMinMax?.min);
  pushTs(itemMinMax?.max);

  const currentYear = toYearInTimeZone(now, timeZone);
  if (candidates.length === 0) return [currentYear];

  const minYear = Math.min(currentYear, ...candidates);
  const maxYear = Math.max(currentYear, ...candidates);
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y += 1) years.push(y);
  return years;
}

export async function getYearReviewPageData(args: { year: number; now?: Date }): Promise<YearReviewPageData> {
  const now = args.now ?? new Date();
  const { timeZone } = await getAppTimeSettings();

  const availableYears = await getReviewAvailableYears(timeZone, now);

  const yearStartDate = `${args.year}-01-01`;
  const nextYearStartDate = `${args.year + 1}-01-01`;
  const yearEndDate = `${args.year}-12-31`;

  const startUtc = dateTimeLocalToUtcDate(`${yearStartDate}T00:00`, timeZone);
  const endExclusiveUtc = dateTimeLocalToUtcDate(`${nextYearStartDate}T00:00`, timeZone);
  if (!startUtc || !endExclusiveUtc) {
    throw new Error("Failed to compute year UTC range");
  }

  const weeklyPeriods = getWeeklyDigestPeriods(now, timeZone);
  const thisWeek = { startDate: weeklyPeriods.thisWeek.startDate, endDate: weeklyPeriods.thisWeek.endDate };

  const thisWeekStartUtc = weeklyPeriods.thisWeek.startUtc;

  const countStarSql = sql<number>`count(*)`;

  const [
    todoCreatedAtRows,
    todoCompletedAtRows,
    [{ activeTodos }],
    activeTodosByTaskTypeRows,
    createdTodosByTaskTypeRows,
    completedTodosByTaskTypeRows,
    createdTodosByPriorityRows,
    completedTodosByPriorityRows,
    [{ activeAnniversaries }],
    anniversariesByCategoryRows,
    anniversariesByDateTypeRows,
    [{ activeSubscriptions }],
    subscriptionsByCategoryRows,
    subscriptionsByCycleUnitRows,
    subscriptionsByAutoRenewRows,
    [{ activeItems }],
    itemsByCategoryRows,
    itemsByStatusRows,
    highlightCompletedTodos,
    highlightCreatedTodos,
    thisWeekNewTodos,
    thisWeekNewAnniversaries,
    thisWeekNewSubscriptions,
    thisWeekNewItems,
    anniversaryRows,
    subscriptionActiveRows,
    itemsInYearRows,
    completedTodoDetailsRows,
  ] = await Promise.all([
    db
      .select({ createdAt: todos.createdAt })
      .from(todos)
      .where(and(gte(todos.createdAt, startUtc), lt(todos.createdAt, endExclusiveUtc), isNull(todos.deletedAt))),
    db
      .select({ completedAt: todos.completedAt })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, true),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, startUtc),
          lt(todos.completedAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      ),
    db
      .select({ activeTodos: countStarSql })
      .from(todos)
      .where(and(eq(todos.isDone, false), eq(todos.isArchived, false), isNull(todos.deletedAt))),
    db
      .select({ key: todos.taskType, count: countStarSql })
      .from(todos)
      .where(and(eq(todos.isDone, false), eq(todos.isArchived, false), isNull(todos.deletedAt)))
      .groupBy(todos.taskType)
      .orderBy(desc(countStarSql), asc(todos.taskType)),
    db
      .select({ key: todos.taskType, count: countStarSql })
      .from(todos)
      .where(and(gte(todos.createdAt, startUtc), lt(todos.createdAt, endExclusiveUtc), isNull(todos.deletedAt)))
      .groupBy(todos.taskType)
      .orderBy(desc(countStarSql), asc(todos.taskType)),
    db
      .select({ key: todos.taskType, count: countStarSql })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, true),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, startUtc),
          lt(todos.completedAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .groupBy(todos.taskType)
      .orderBy(desc(countStarSql), asc(todos.taskType)),
    db
      .select({ key: todos.priority, count: countStarSql })
      .from(todos)
      .where(and(gte(todos.createdAt, startUtc), lt(todos.createdAt, endExclusiveUtc), isNull(todos.deletedAt)))
      .groupBy(todos.priority)
      .orderBy(desc(countStarSql), asc(todos.priority)),
    db
      .select({ key: todos.priority, count: countStarSql })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, true),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, startUtc),
          lt(todos.completedAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .groupBy(todos.priority)
      .orderBy(desc(countStarSql), asc(todos.priority)),
    db
      .select({ activeAnniversaries: countStarSql })
      .from(anniversaries)
      .where(and(eq(anniversaries.isArchived, false), isNull(anniversaries.deletedAt))),
    db
      .select({ key: anniversaries.category, count: countStarSql })
      .from(anniversaries)
      .where(and(eq(anniversaries.isArchived, false), isNull(anniversaries.deletedAt)))
      .groupBy(anniversaries.category)
      .orderBy(desc(countStarSql), asc(anniversaries.category)),
    db
      .select({ key: anniversaries.dateType, count: countStarSql })
      .from(anniversaries)
      .where(and(eq(anniversaries.isArchived, false), isNull(anniversaries.deletedAt)))
      .groupBy(anniversaries.dateType)
      .orderBy(desc(countStarSql), asc(anniversaries.dateType)),
    db
      .select({ activeSubscriptions: countStarSql })
      .from(subscriptions)
      .where(and(eq(subscriptions.isArchived, false), isNull(subscriptions.deletedAt))),
    db
      .select({ key: subscriptions.category, count: countStarSql })
      .from(subscriptions)
      .where(and(eq(subscriptions.isArchived, false), isNull(subscriptions.deletedAt)))
      .groupBy(subscriptions.category)
      .orderBy(desc(countStarSql), asc(subscriptions.category)),
    db
      .select({ key: subscriptions.cycleUnit, count: countStarSql })
      .from(subscriptions)
      .where(and(eq(subscriptions.isArchived, false), isNull(subscriptions.deletedAt)))
      .groupBy(subscriptions.cycleUnit)
      .orderBy(desc(countStarSql), asc(subscriptions.cycleUnit)),
    db
      .select({ key: sql<string>`case when ${subscriptions.autoRenew} = 1 then 'auto' else 'manual' end`, count: countStarSql })
      .from(subscriptions)
      .where(and(eq(subscriptions.isArchived, false), isNull(subscriptions.deletedAt)))
      .groupBy(sql`case when ${subscriptions.autoRenew} = 1 then 'auto' else 'manual' end`)
      .orderBy(desc(countStarSql)),
    db
      .select({ activeItems: countStarSql })
      .from(items)
      .where(and(isNull(items.deletedAt))),
    db
      .select({ key: sql<string>`coalesce(${items.category}, ${DEFAULT_ITEM_CATEGORY})`, count: countStarSql })
      .from(items)
      .where(and(isNull(items.deletedAt)))
      .groupBy(sql`coalesce(${items.category}, ${DEFAULT_ITEM_CATEGORY})`)
      .orderBy(desc(countStarSql), asc(sql`coalesce(${items.category}, ${DEFAULT_ITEM_CATEGORY})`)),
    db
      .select({ key: items.status, count: countStarSql })
      .from(items)
      .where(and(isNull(items.deletedAt)))
      .groupBy(items.status)
      .orderBy(desc(countStarSql), asc(items.status)),
    db
      .select({ title: todos.title, completedAt: todos.completedAt })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, true),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, startUtc),
          lt(todos.completedAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(desc(todos.completedAt))
      .limit(20),
    db
      .select({ title: todos.title, createdAt: todos.createdAt })
      .from(todos)
      .where(and(gte(todos.createdAt, startUtc), lt(todos.createdAt, endExclusiveUtc), isNull(todos.deletedAt)))
      .orderBy(desc(todos.createdAt))
      .limit(20),
    db
      .select({ title: todos.title, createdAt: todos.createdAt })
      .from(todos)
      .where(and(gte(todos.createdAt, thisWeekStartUtc), lt(todos.createdAt, now), isNull(todos.deletedAt)))
      .orderBy(desc(todos.createdAt))
      .limit(15),
    db
      .select({ title: anniversaries.title, createdAt: anniversaries.createdAt })
      .from(anniversaries)
      .where(and(gte(anniversaries.createdAt, thisWeekStartUtc), lt(anniversaries.createdAt, now), isNull(anniversaries.deletedAt)))
      .orderBy(desc(anniversaries.createdAt))
      .limit(15),
    db
      .select({ name: subscriptions.name, createdAt: subscriptions.createdAt })
      .from(subscriptions)
      .where(and(gte(subscriptions.createdAt, thisWeekStartUtc), lt(subscriptions.createdAt, now), isNull(subscriptions.deletedAt)))
      .orderBy(desc(subscriptions.createdAt))
      .limit(15),
    db
      .select({ name: items.name, createdAt: items.createdAt })
      .from(items)
      .where(and(gte(items.createdAt, thisWeekStartUtc), lt(items.createdAt, now), isNull(items.deletedAt)))
      .orderBy(desc(items.createdAt))
      .limit(15),
    db
      .select({
        title: anniversaries.title,
        category: anniversaries.category,
        dateType: anniversaries.dateType,
        isLeapMonth: anniversaries.isLeapMonth,
        date: anniversaries.date,
      })
      .from(anniversaries)
      .where(and(eq(anniversaries.isArchived, false), isNull(anniversaries.deletedAt)))
      .orderBy(asc(anniversaries.title)),
    db
      .select({
        name: subscriptions.name,
        category: subscriptions.category,
        cycleUnit: subscriptions.cycleUnit,
        nextRenewDate: subscriptions.nextRenewDate,
        autoRenew: subscriptions.autoRenew,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.isArchived, false), isNull(subscriptions.deletedAt)))
      .orderBy(asc(subscriptions.nextRenewDate))
      .limit(2000),
    db
      .select({
        name: items.name,
        category: items.category,
        status: items.status,
        purchasedDate: items.purchasedDate,
        createdAt: items.createdAt,
      })
      .from(items)
      .where(and(isNull(items.deletedAt)))
      .orderBy(desc(items.createdAt))
      .limit(2000),
    db
      .select({
        id: todos.id,
        title: todos.title,
        taskType: todos.taskType,
        priority: todos.priority,
        tags: todos.tags,
        dueAt: todos.dueAt,
        createdAt: todos.createdAt,
        completedAt: todos.completedAt,
      })
      .from(todos)
      .where(
        and(
          eq(todos.isDone, true),
          isNotNull(todos.completedAt),
          gte(todos.completedAt, startUtc),
          lt(todos.completedAt, endExclusiveUtc),
          isNull(todos.deletedAt),
        ),
      )
      .orderBy(desc(todos.completedAt))
      .limit(2000),
  ]);

  const createdAtList = todoCreatedAtRows
    .map((r) => r.createdAt)
    .filter((d): d is Date => d instanceof Date);
  const completedAtList = todoCompletedAtRows
    .map((r) => r.completedAt)
    .filter((d): d is Date => d instanceof Date);

  const monthlyCounts = buildMonthlyCounts({ timeZone, createdAt: createdAtList, completedAt: completedAtList });

  const activeTodosByTaskType = countRowsToMap(activeTodosByTaskTypeRows);
  const createdTodosByTaskType = countRowsToMap(createdTodosByTaskTypeRows);
  const completedTodosByTaskType = countRowsToMap(completedTodosByTaskTypeRows);

  const taskTypes = Array.from(
    new Set([
      ...activeTodosByTaskType.keys(),
      ...createdTodosByTaskType.keys(),
      ...completedTodosByTaskType.keys(),
    ]),
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));

  const todosByTaskType = taskTypes
    .map((taskType) => ({
      taskType,
      created: createdTodosByTaskType.get(taskType) ?? 0,
      completed: completedTodosByTaskType.get(taskType) ?? 0,
      active: activeTodosByTaskType.get(taskType) ?? 0,
    }))
    .sort((a, b) => b.completed - a.completed || b.created - a.created || a.taskType.localeCompare(b.taskType, "zh-CN"));

  const createdTodosByPriority = countRowsToMap(createdTodosByPriorityRows);
  const completedTodosByPriority = countRowsToMap(completedTodosByPriorityRows);
  const priorities = Array.from(
    new Set([...createdTodosByPriority.keys(), ...completedTodosByPriority.keys()]),
  ).sort((a, b) => a.localeCompare(b));

  const todosByPriority = priorities
    .map((priority) => ({
      priority,
      created: createdTodosByPriority.get(priority) ?? 0,
      completed: completedTodosByPriority.get(priority) ?? 0,
    }))
    .sort((a, b) => b.completed - a.completed || b.created - a.created || a.priority.localeCompare(b.priority));

  const anniversariesInYear = anniversaryRows
    .map((a) => {
      const start = `${args.year}-01-01`;
      const nextDate =
        a.dateType === ANNIVERSARY_DATE_TYPE.SOLAR
          ? getNextSolarOccurrenceDateString(a.date, start)
          : getNextLunarOccurrenceDateString(a.date, start, {
              isLeapMonth: a.isLeapMonth,
            });
      if (!nextDate) return null;
      if (nextDate < yearStartDate || nextDate > yearEndDate) return null;
      return { title: a.title, category: a.category, dateType: a.dateType, occurrenceDate: nextDate };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate) || a.title.localeCompare(b.title, "zh-CN"));

  const itemsInYear = itemsInYearRows
    .filter((it) => {
      if (it.purchasedDate) {
        if (!parseDateString(it.purchasedDate)) return false;
        return it.purchasedDate >= yearStartDate && it.purchasedDate <= yearEndDate;
      }
      const createdAt = it.createdAt;
      if (!(createdAt instanceof Date)) return false;
      const localDate = formatDateInTimeZone(createdAt, timeZone);
      return localDate >= yearStartDate && localDate <= yearEndDate;
    })
    .slice(0, 200);

  const subscriptionAuto = subscriptionsByAutoRenewRows.find((r) => r.key === "auto")?.count ?? 0;
  const subscriptionManual = subscriptionsByAutoRenewRows.find((r) => r.key === "manual")?.count ?? 0;

  const normalizedAnniversaryCategoryRows: CountRow[] = (() => {
    const map = new Map<string, number>();
    for (const row of anniversariesByCategoryRows) {
      const key = canonicalizeAnniversaryCategory(row.key);
      map.set(key, (map.get(key) ?? 0) + row.count);
    }
    return sortCountRows(Array.from(map.entries()).map(([key, count]) => ({ key, count })));
  })();

  const completedTodos: TodoDetail[] = completedTodoDetailsRows
    .filter((t) => t.completedAt instanceof Date && t.createdAt instanceof Date)
    .map((t) => ({
      id: t.id,
      title: t.title,
      taskType: t.taskType,
      priority: t.priority,
      tags: safeParseStringList(t.tags),
      dueAt: t.dueAt ?? null,
      createdAt: t.createdAt,
      completedAt: t.completedAt ?? null,
      href: `/todo/${t.id}`,
    }));

  return {
    year: args.year,
    availableYears,
    timeZone,
    generatedAtIso: now.toISOString(),
    yearRange: { startDate: yearStartDate, endDate: yearEndDate },
    thisWeek,
    thisWeekNew: {
      todos: thisWeekNewTodos.map((t) => ({ title: t.title, createdAt: t.createdAt })),
      anniversaries: thisWeekNewAnniversaries.map((t) => ({ title: t.title, createdAt: t.createdAt })),
      subscriptions: thisWeekNewSubscriptions.map((t) => ({ name: t.name, createdAt: t.createdAt })),
      items: thisWeekNewItems.map((t) => ({ name: t.name, createdAt: t.createdAt })),
    },
    stats: {
      todosCreated: createdAtList.length,
      todosCompleted: completedAtList.length,
      todosActive: Number(activeTodos ?? 0),
      anniversariesActive: Number(activeAnniversaries ?? 0),
      subscriptionsActive: Number(activeSubscriptions ?? 0),
      itemsActive: Number(activeItems ?? 0),
    },
    breakdown: {
      todosByTaskType,
      todosByPriority,
      subscriptionsByCategory: sortCountRows(subscriptionsByCategoryRows),
      subscriptionsByCycleUnit: sortCountRows(subscriptionsByCycleUnitRows),
      subscriptionsByAutoRenew: { autoRenew: subscriptionAuto, manualRenew: subscriptionManual },
      anniversariesByCategory: normalizedAnniversaryCategoryRows,
      anniversariesByDateType: sortCountRows(anniversariesByDateTypeRows),
      itemsByCategory: sortCountRows(itemsByCategoryRows),
      itemsByStatus: sortCountRows(itemsByStatusRows),
    },
    details: {
      completedTodos: cap(completedTodos, 2000),
    },
    highlights: {
      completedTodos: highlightCompletedTodos
        .map((t) => (t.completedAt ? { title: t.title, completedAt: t.completedAt } : null))
        .filter((v): v is NonNullable<typeof v> => v !== null),
      createdTodos: highlightCreatedTodos
        .map((t) => (t.createdAt ? { title: t.title, createdAt: t.createdAt } : null))
        .filter((v): v is NonNullable<typeof v> => v !== null),
    },
    monthlyCounts,
    anniversariesInYear,
    itemsInYear: itemsInYear.map((it) => ({
      name: it.name,
      category: it.category ?? DEFAULT_ITEM_CATEGORY,
      status: it.status,
      purchasedDate: it.purchasedDate,
      createdAt: it.createdAt,
    })),
    subscriptionsActiveList: subscriptionActiveRows.map((s) => ({
      name: s.name,
      category: s.category,
      cycleUnit: s.cycleUnit,
      nextRenewDate: s.nextRenewDate,
      autoRenew: !!s.autoRenew,
    })),
  };
}
