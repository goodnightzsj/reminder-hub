import { and, asc, desc, eq, gte, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import Link from "next/link";

import { renewSubscription } from "@/app/_actions/subscriptions";
import { toggleTodo } from "@/app/_actions/todos";
import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
} from "@/server/anniversary";
import { AppHeader } from "../_components/AppHeader";
import { StatsCard, ProgressRing } from "../_components/StatsCard";
import {
  addDaysToDateString,
  diffDays,
  formatDateString,
  getDatePartsInTimeZone,
} from "@/server/date";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { anniversaries, items, subscriptions, todos } from "@/server/db/schema";

export const dynamic = "force-dynamic";

function formatDateTime(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
}

function formatDateOnly(dateString: string): string {
  return dateString;
}

function formatCurrencyAmount(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function computeDaysUsed(purchasedDate: string | null, today: string): number | null {
  if (!purchasedDate) return null;
  const diff = diffDays(purchasedDate, today);
  if (diff === null) return null;
  if (diff < 0) return null;
  return diff + 1;
}

type UpcomingItem =
  | {
    kind: "todo";
    at: Date;
    id: string;
    title: string;
  }
  | {
    kind: "anniversary";
    at: Date;
    id: string;
    title: string;
    dateType: "solar" | "lunar";
  }
  | {
    kind: "subscription";
    at: Date;
    id: string;
    name: string;
  };

export default async function DashboardPage() {
  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const dateReminderTime = settings.dateReminderTime;

  const now = new Date();
  const today = formatDateString(getDatePartsInTimeZone(now, timeZone));
  const tomorrow = addDaysToDateString(today, 1);
  const upcomingEnd = addDaysToDateString(today, 7);
  const upcomingEndExclusive = addDaysToDateString(today, 8);

  if (!tomorrow || !upcomingEnd || !upcomingEndExclusive) {
    throw new Error("Failed to compute dashboard date range");
  }

  const startUtc = dateTimeLocalToUtcDate(`${today}T00:00`, timeZone);
  const endUtc = dateTimeLocalToUtcDate(`${tomorrow}T00:00`, timeZone);
  const upcomingEndExclusiveUtc = dateTimeLocalToUtcDate(
    `${upcomingEndExclusive}T00:00`,
    timeZone,
  );

  if (!startUtc || !endUtc || !upcomingEndExclusiveUtc) {
    throw new Error("Failed to compute dashboard UTC range");
  }

  const baseActiveTodoWhere = and(eq(todos.isDone, false), eq(todos.isArchived, false));
  const baseTodoWhere = and(
    eq(todos.isDone, false),
    eq(todos.isArchived, false),
    isNotNull(todos.dueAt),
  );

  const [{ count: activeTodoCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(baseActiveTodoWhere);

  const [{ count: activeTodoNoDueAtCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(and(baseActiveTodoWhere, isNull(todos.dueAt)));

  const [{ count: doneTodoCountToday }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(
      and(
        eq(todos.isDone, true),
        isNotNull(todos.completedAt),
        gte(todos.completedAt, startUtc),
        lt(todos.completedAt, endUtc),
      ),
    );

  const [{ count: overdueTodoCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(and(baseTodoWhere, lt(todos.dueAt, startUtc)));

  const overdueTodos = await db
    .select({ id: todos.id, title: todos.title, dueAt: todos.dueAt })
    .from(todos)
    .where(and(baseTodoWhere, lt(todos.dueAt, startUtc)))
    .orderBy(asc(todos.dueAt))
    .limit(12);

  const [{ count: todayTodoCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(and(baseTodoWhere, gte(todos.dueAt, startUtc), lt(todos.dueAt, endUtc)));

  const todayTodos = await db
    .select({ id: todos.id, title: todos.title, dueAt: todos.dueAt })
    .from(todos)
    .where(and(baseTodoWhere, gte(todos.dueAt, startUtc), lt(todos.dueAt, endUtc)))
    .orderBy(asc(todos.dueAt))
    .limit(12);

  const [{ count: upcomingTodoCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(and(baseTodoWhere, gte(todos.dueAt, endUtc), lt(todos.dueAt, upcomingEndExclusiveUtc)));

  const upcomingTodos = await db
    .select({ id: todos.id, title: todos.title, dueAt: todos.dueAt })
    .from(todos)
    .where(
      and(
        baseTodoWhere,
        gte(todos.dueAt, endUtc),
        lt(todos.dueAt, upcomingEndExclusiveUtc),
      ),
    )
    .orderBy(asc(todos.dueAt))
    .limit(24);

  const activeAnniversaries = await db
    .select()
    .from(anniversaries)
    .where(eq(anniversaries.isArchived, false))
    .orderBy(desc(anniversaries.createdAt));

  const anniversariesWithNext = activeAnniversaries
    .map((a) => {
      const nextDate =
        a.dateType === "solar"
          ? getNextSolarOccurrenceDateString(a.date, today)
          : getNextLunarOccurrenceDateString(a.date, today, {
            isLeapMonth: a.isLeapMonth,
          });

      if (!nextDate) return null;
      const daysLeft = diffDays(today, nextDate);
      if (daysLeft === null) return null;
      const at = dateTimeLocalToUtcDate(`${nextDate}T${dateReminderTime}`, timeZone);
      if (!at) return null;
      return { ...a, nextDate, daysLeft, at };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const todayAnniversaries = anniversariesWithNext.filter((a) => a.daysLeft === 0);
  const upcomingAnniversaries = anniversariesWithNext.filter(
    (a) => a.daysLeft >= 1 && a.daysLeft <= 7,
  );

  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.isArchived, false))
    .orderBy(asc(subscriptions.nextRenewDate));

  const todaySubscriptions = activeSubscriptions.filter(
    (s) => s.nextRenewDate === today,
  );
  const upcomingSubscriptions = activeSubscriptions.filter(
    (s) => s.nextRenewDate >= tomorrow && s.nextRenewDate <= upcomingEnd,
  );

  const activeItemsRows = await db
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
    .where(ne(items.status, "retired"))
    .orderBy(desc(items.createdAt))
    .limit(500);

  const itemsByDailyCost = activeItemsRows
    .map((it) => {
      if (typeof it.priceCents !== "number") return null;
      const currency = (it.currency ?? "CNY").trim() || "CNY";
      const daysUsed = computeDaysUsed(it.purchasedDate, today);
      if (typeof daysUsed !== "number" || daysUsed < 1) return null;
      const dailyCents = Math.round(it.priceCents / daysUsed);
      return { ...it, currency, daysUsed, dailyCents };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort(
      (a, b) =>
        a.dailyCents - b.dailyCents || a.name.localeCompare(b.name, "zh-CN"),
    );

  const itemsByDailyCostByCurrency = new Map<
    string,
    Array<(typeof itemsByDailyCost)[number]>
  >();
  for (const it of itemsByDailyCost) {
    const list = itemsByDailyCostByCurrency.get(it.currency) ?? [];
    list.push(it);
    itemsByDailyCostByCurrency.set(it.currency, list);
  }

  let primaryDailyCostCurrency: string | null = null;
  let primaryDailyCostItems: Array<(typeof itemsByDailyCost)[number]> = [];

  for (const [currency, list] of itemsByDailyCostByCurrency.entries()) {
    list.sort(
      (a, b) =>
        a.dailyCents - b.dailyCents || a.name.localeCompare(b.name, "zh-CN"),
    );

    if (list.length > primaryDailyCostItems.length) {
      primaryDailyCostCurrency = currency;
      primaryDailyCostItems = list;
    }
  }

  const lowestDailyCostItems = primaryDailyCostItems.slice(0, 3);

  const monthlySpendByCurrency = new Map<string, number>();
  for (const s of activeSubscriptions) {
    if (s.priceCents === null) continue;
    const currency = (s.currency ?? "CNY").trim() || "CNY";
    const monthsPerCycle = s.cycleUnit === "year" ? s.cycleInterval * 12 : s.cycleInterval;
    if (!Number.isFinite(monthsPerCycle) || monthsPerCycle < 1) continue;
    const monthly = s.priceCents / 100 / monthsPerCycle;
    if (!Number.isFinite(monthly)) continue;
    monthlySpendByCurrency.set(currency, (monthlySpendByCurrency.get(currency) ?? 0) + monthly);
  }

  const monthlySpendRows = Array.from(monthlySpendByCurrency.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);

  const upcoming: UpcomingItem[] = [];

  for (const t of upcomingTodos) {
    if (!t.dueAt) continue;
    upcoming.push({ kind: "todo", at: t.dueAt, id: t.id, title: t.title });
  }

  for (const a of upcomingAnniversaries) {
    upcoming.push({
      kind: "anniversary",
      at: a.at,
      id: a.id,
      title: a.title,
      dateType: a.dateType,
    });
  }

  for (const s of upcomingSubscriptions) {
    const at = dateTimeLocalToUtcDate(`${s.nextRenewDate}T${dateReminderTime}`, timeZone);
    if (!at) continue;
    upcoming.push({ kind: "subscription", at, id: s.id, name: s.name });
  }

  upcoming.sort((a, b) => a.at.getTime() - b.at.getTime());

  const upcomingTotalCount =
    upcomingTodoCount + upcomingAnniversaries.length + upcomingSubscriptions.length;
  const upcomingVisible = upcoming.slice(0, 30);
  const upcomingIsTruncated = upcomingTotalCount > upcomingVisible.length;

  const stats = {
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

  return (
    <div className="min-h-dvh bg-base font-sans text-primary animate-fade-in">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="仪表盘"
          description={
            <>
              今日聚焦 + 即将到来（时区 <code className="font-mono">{timeZone}</code>）。
            </>
          }
        />

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-slide-up">
          <StatsCard
            title="待办任务"
            value={stats.activeTodos}
            subtitle={`${stats.activeTodosNoDueAt} 个无截止日期`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            }
          />
          <StatsCard
            title="今日完成"
            value={stats.doneTodosToday}
            subtitle="继续加油！"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            }
          />
          <StatsCard
            title="逾期任务"
            value={stats.overdueTodos}
            subtitle={stats.overdueTodos > 0 ? "需要处理" : "太棒了！"}
            className={stats.overdueTodos > 0 ? "border-danger/50" : ""}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            }
          />
          <StatsCard
            title="即将到来"
            value={stats.upcomingCount}
            subtitle="未来 7 天"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7 animate-slide-up stagger-1">
            <section className="rounded-xl border border-default bg-elevated p-4 shadow-sm">
              <h2 className="text-sm font-medium">今日聚焦</h2>
              <p className="mt-1 text-xs text-secondary">
                逾期 {stats.overdueTodos} · 今日 Todo {stats.todayTodos} · 今日纪念日{" "}
                {stats.todayAnniversaries} · 今日订阅 {stats.todaySubscriptions}
              </p>

              <div className="mt-4 grid gap-4">
                {overdueTodos.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-medium text-danger">
                      逾期 Todo（显示前 {overdueTodos.length} / 共 {stats.overdueTodos}）
                    </div>
                    <ul className="divide-y divide-divider rounded-lg border border-divider">
                      {overdueTodos.map((t) => (
                        <li key={t.id} className="flex items-start justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <Link
                              href={`/todo/${t.id}`}
                              className="truncate text-sm font-medium hover:underline"
                            >
                              {t.title}
                            </Link>
                            {t.dueAt ? (
                              <div className="mt-1 text-xs text-muted">
                                截止 {formatDateTime(t.dueAt, timeZone)}
                              </div>
                            ) : null}
                          </div>
                          <form action={toggleTodo} className="shrink-0">
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="isDone" value="1" />
                            <button
                              type="submit"
                              className="h-9 rounded-lg border border-default px-3 text-xs font-medium hover:bg-interactive-hover active-press"
                            >
                              完成
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {todayTodos.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-medium text-secondary">
                      今日 Todo（显示前 {todayTodos.length} / 共 {stats.todayTodos}）
                    </div>
                    <ul className="divide-y divide-divider rounded-lg border border-divider">
                      {todayTodos.map((t) => (
                        <li key={t.id} className="flex items-start justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <Link
                              href={`/todo/${t.id}`}
                              className="truncate text-sm font-medium hover:underline"
                            >
                              {t.title}
                            </Link>
                            {t.dueAt ? (
                              <div className="mt-1 text-xs text-muted">
                                截止 {formatDateTime(t.dueAt, timeZone)}
                              </div>
                            ) : null}
                          </div>
                          <form action={toggleTodo} className="shrink-0">
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="isDone" value="1" />
                            <button
                              type="submit"
                              className="h-9 rounded-lg border border-default px-3 text-xs font-medium hover:bg-interactive-hover active-press"
                            >
                              完成
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {todayAnniversaries.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-medium text-secondary">
                      今日纪念日
                    </div>
                    <ul className="divide-y divide-divider rounded-lg border border-divider">
                      {todayAnniversaries.map((a) => (
                        <li key={a.id} className="p-3">
                          <Link
                            href={`/anniversaries/${a.id}`}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {a.title}
                          </Link>
                          <div className="mt-1 text-xs text-muted">
                            下次 {a.nextDate}（{a.dateType === "solar" ? "公历" : "农历"}）
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {todaySubscriptions.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-medium text-secondary">
                      今日订阅到期
                    </div>
                    <ul className="divide-y divide-divider rounded-lg border border-divider">
                      {todaySubscriptions.map((s) => (
                        <li key={s.id} className="flex items-start justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <Link
                              href={`/subscriptions/${s.id}`}
                              className="truncate text-sm font-medium hover:underline"
                            >
                              {s.name}
                            </Link>
                            <div className="mt-1 text-xs text-muted">
                              到期 {formatDateOnly(s.nextRenewDate)}
                            </div>
                          </div>
                          <form action={renewSubscription} className="shrink-0">
                            <input type="hidden" name="id" value={s.id} />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={`/subscriptions/${s.id}`}
                            />
                            <button
                              type="submit"
                              className="h-9 rounded-lg border border-default px-3 text-xs font-medium hover:bg-interactive-hover active-press"
                            >
                              续期
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {overdueTodos.length === 0 &&
                  todayTodos.length === 0 &&
                  todayAnniversaries.length === 0 &&
                  todaySubscriptions.length === 0 ? (
                  <div className="rounded-lg border border-divider bg-surface p-3 text-sm text-secondary">
                    今天没有特别要处理的事项。
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-xl border border-default bg-elevated p-4 shadow-sm">
              <h2 className="text-sm font-medium">即将到来（7 天）</h2>
              <p className="mt-1 text-xs text-secondary">
                共 {stats.upcomingCount} 条
                {upcomingIsTruncated
                  ? `（展示前 ${upcomingVisible.length} 条）`
                  : ""}
              </p>

              {stats.upcomingCount === 0 ? (
                <div className="mt-3 text-sm text-muted">
                  暂无即将到来的事项。
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-divider rounded-lg border border-divider">
                  {upcomingVisible.map((u) => (
                    <li
                      key={`${u.kind}:${u.id}`}
                      className="flex items-start justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-secondary">
                          <span className="rounded-md border border-divider bg-surface px-2 py-0.5">
                            {u.kind === "todo"
                              ? "Todo"
                              : u.kind === "anniversary"
                                ? "纪念日"
                                : "订阅"}
                          </span>
                          <span className="text-muted">
                            {formatDateTime(u.at, timeZone)}
                          </span>
                        </div>

                        {u.kind === "todo" ? (
                          <Link
                            href={`/todo/${u.id}`}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {u.title}
                          </Link>
                        ) : u.kind === "anniversary" ? (
                          <Link
                            href={`/anniversaries/${u.id}`}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {u.title}
                          </Link>
                        ) : (
                          <Link
                            href={`/subscriptions/${u.id}`}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {u.name}
                          </Link>
                        )}
                      </div>

                      {u.kind === "todo" ? (
                        <form action={toggleTodo} className="shrink-0">
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="isDone" value="1" />
                          <button
                            type="submit"
                            className="h-9 rounded-lg border border-default px-3 text-xs font-medium hover:bg-interactive-hover active-press"
                          >
                            完成
                          </button>
                        </form>
                      ) : u.kind === "subscription" ? (
                        <form action={renewSubscription} className="shrink-0">
                          <input type="hidden" name="id" value={u.id} />
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={`/subscriptions/${u.id}`}
                          />
                          <button
                            type="submit"
                            className="h-9 rounded-lg border border-default px-3 text-xs font-medium hover:bg-interactive-hover active-press"
                          >
                            续期
                          </button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="space-y-6 lg:col-span-5 animate-slide-up stagger-2">
            <section className="rounded-xl border border-default bg-elevated p-4 shadow-sm">
              <h2 className="text-sm font-medium">洞察（简单统计）</h2>
              <div className="mt-3 grid gap-3 text-sm text-secondary">
                <div className="rounded-lg border border-divider bg-surface p-3">
                  <div className="text-xs font-medium text-secondary">
                    Todo
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>未完成 {stats.activeTodos}</span>
                    <span className="text-muted">·</span>
                    <span>无截止 {stats.activeTodosNoDueAt}</span>
                    <span className="text-muted">·</span>
                    <span>今日完成 {stats.doneTodosToday}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-divider bg-surface p-3">
                  <div className="text-xs font-medium text-secondary">
                    订阅
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>进行中 {stats.activeSubscriptions}</span>
                    {monthlySpendRows.length > 0 ? (
                      <>
                        <span className="text-muted">·</span>
                        <span>
                          月度支出（估算）{" "}
                          {monthlySpendRows
                            .map((row) => `${formatCurrencyAmount(row.amount, row.currency)}/月`)
                            .join(" · ")}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-muted">·</span>
                        <span className="text-muted">
                          未填写价格，暂无法估算支出
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-divider bg-surface p-3">
                  <div className="text-xs font-medium text-secondary">
                    纪念日
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>进行中 {stats.activeAnniversaries}</span>
                    <span className="text-muted">·</span>
                    <span>未来 7 天 {upcomingAnniversaries.length}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-divider bg-surface p-3">
                  <div className="text-xs font-medium text-secondary">
                    物品
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>进行中 {stats.activeItems}</span>
                    <span className="text-muted">·</span>
                    <span>
                      日均成本最低 Top3
                      {primaryDailyCostCurrency ? `（${primaryDailyCostCurrency}）` : ""}
                    </span>
                  </div>
                  {lowestDailyCostItems.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs text-secondary">
                      {lowestDailyCostItems.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <Link
                            href={`/items/${it.id}`}
                            className="min-w-0 truncate hover:underline"
                          >
                            {it.name}
                          </Link>
                          <span className="shrink-0">
                            {formatCurrencyAmount(it.dailyCents / 100, it.currency)}/天
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-2 text-xs text-muted">
                      填写购入日期与价格后可计算日均成本
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
