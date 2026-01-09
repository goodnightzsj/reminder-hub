import { and, asc, desc, eq, gte, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import Link from "next/link";

import { renewSubscription } from "@/app/_actions/subscriptions";
import { toggleTodo } from "@/app/_actions/todos";
import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
} from "@/server/anniversary";
import { AppHeader } from "../_components/AppHeader";
import { BentoCard } from "../_components/BentoCard";
import { Button } from "../_components/Button";
import { Icons } from "../_components/Icons";
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
    <div className="min-h-dvh bg-base font-sans text-primary animate-fade-in pb-20 sm:pb-10">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="仪表盘"
          description={
            <>
              今日聚焦 + 即将到来（时区 <code className="font-mono">{timeZone}</code>）。
            </>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
          {/* Hero: Today's Focus (2x2) */}
          <div className="sm:col-span-2 sm:row-span-2">
            <BentoCard
              title="今日聚焦"
              className="h-full"
              delay={0.05}
              icon={<Icons.Target className="h-5 w-5" />}
            >
              <div className="flex bg-surface/50 rounded-lg p-3 mb-4 items-center justify-between text-xs text-secondary">
                <span>逾期 {stats.overdueTodos}</span>
                <span className="text-muted">|</span>
                <span>待办 {stats.todayTodos}</span>
                <span className="text-muted">|</span>
                <span>纪念日 {stats.todayAnniversaries}</span>
                <span className="text-muted">|</span>
                <span>订阅 {stats.todaySubscriptions}</span>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Overdue */}
                {overdueTodos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-danger">
                      <Icons.AlertTriangle className="h-3 w-3" />
                      <span>逾期事项 ({overdueTodos.length})</span>
                    </div>
                    <ul className="space-y-2">
                      {overdueTodos.map((t) => (
                        <li key={t.id} className="group flex items-center justify-between rounded-lg bg-surface p-3 transition-colors hover:bg-muted/50">
                          <Link href={`/todo/${t.id}`} className="flex-1 truncate text-sm font-medium hover:underline">
                            {t.title}
                          </Link>
                          <span className="text-xs text-danger font-mono ml-3">{formatDateTime(t.dueAt!, timeZone)}</span>
                          <form action={toggleTodo} className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="isDone" value="1" />
                            <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 hover:bg-success hover:text-white">
                              <Icons.Check className="h-3 w-3" />
                            </Button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Today */}
                {todayTodos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
                      <Icons.Calendar className="h-3 w-3" />
                      <span>今日待办 ({todayTodos.length})</span>
                    </div>
                    <ul className="space-y-2">
                      {todayTodos.map((t) => (
                        <li key={t.id} className="group flex items-center justify-between rounded-lg bg-surface p-3 transition-colors hover:bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <Link href={`/todo/${t.id}`} className="block truncate text-sm font-medium hover:underline">
                              {t.title}
                            </Link>
                            <div className="text-[10px] text-muted mt-0.5">
                              {formatDateTime(t.dueAt!, timeZone)}
                            </div>
                          </div>
                          <form action={toggleTodo} className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input type="hidden" name="id" value={t.id} />
                            <input type="hidden" name="isDone" value="1" />
                            <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-brand-primary hover:text-white">
                              <Icons.Check className="h-3.5 w-3.5" />
                            </Button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Today Anniversaries */}
                {todayAnniversaries.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-pink-500">
                      <Icons.Gift className="h-3 w-3" />
                      <span>今日纪念 ({todayAnniversaries.length})</span>
                    </div>
                    <ul className="space-y-2">
                      {todayAnniversaries.map((a) => (
                        <li key={a.id} className="flex items-center justify-between rounded-lg bg-surface p-3 transition-colors hover:bg-muted/50">
                          <Link href={`/anniversaries/${a.id}`} className="truncate text-sm font-medium hover:underline">
                            {a.title}
                          </Link>
                          <span className="text-xs text-muted ml-3">
                            {a.dateType === "solar" ? "公历" : "农历"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Today Subscriptions */}
                {todaySubscriptions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-500">
                      <Icons.CreditCard className="h-3 w-3" />
                      <span>今日续费 ({todaySubscriptions.length})</span>
                    </div>
                    <ul className="space-y-2">
                      {todaySubscriptions.map((s) => (
                        <li key={s.id} className="flex items-center justify-between rounded-lg bg-surface p-3 transition-colors hover:bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <Link href={`/subscriptions/${s.id}`} className="block truncate text-sm font-medium hover:underline">
                              {s.name}
                            </Link>
                          </div>
                          <form action={renewSubscription} className="ml-3 shrink-0">
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="redirectTo" value={`/subscriptions/${s.id}`} />
                            <Button type="submit" variant="primary" size="sm">
                              续期
                            </Button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Empty State */}
                {overdueTodos.length === 0 && todayTodos.length === 0 && todayAnniversaries.length === 0 && todaySubscriptions.length === 0 && (
                  <div className="flex h-40 flex-col items-center justify-center text-center text-muted">
                    <Icons.Inbox className="h-10 w-10 opacity-20 mb-3" />
                    <p className="text-sm">今天暂无特别事项</p>
                    <p className="text-xs opacity-70">享受美好的一天！</p>
                  </div>
                )}
              </div>
            </BentoCard>
          </div>

          {/* Stats 1: Todo */}
          <BentoCard className="col-span-1" delay={0.1}>
            <div className="flex items-center justify-center gap-6 h-full p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary shrink-0">
                <Icons.CheckSquare className="h-6 w-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-3xl font-bold tabular-nums text-primary leading-none">{stats.activeTodos}</div>
                <div className="text-xs text-secondary font-medium mt-1 truncate">剩余待办</div>
              </div>
            </div>
          </BentoCard>

          {/* Stats 2: Done */}
          <BentoCard className="col-span-1" delay={0.15}>
            <div className="flex items-center justify-center gap-6 h-full p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 shrink-0">
                <Icons.CheckCircle className="h-6 w-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-3xl font-bold tabular-nums text-primary leading-none">{stats.doneTodosToday}</div>
                <div className="text-xs text-secondary font-medium mt-1 truncate">今日完成</div>
              </div>
            </div>
          </BentoCard>

          {/* Stats 3: Upcoming */}
          <BentoCard className="col-span-1" delay={0.2}>
            <div className="flex items-center justify-center gap-6 h-full p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shrink-0">
                <Icons.Calendar className="h-6 w-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-3xl font-bold tabular-nums text-primary leading-none">{stats.upcomingCount}</div>
                <div className="text-xs text-secondary font-medium mt-1 truncate">未来7天事项</div>
              </div>
            </div>
          </BentoCard>

          {/* Stats 4: Subscriptions */}
          <BentoCard className="col-span-1" delay={0.25}>
            <div className="flex items-center justify-center gap-6 h-full p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 shrink-0">
                <Icons.CreditCard className="h-6 w-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-3xl font-bold tabular-nums text-primary leading-none">{stats.activeSubscriptions}</div>
                <div className="text-xs text-secondary font-medium mt-1 truncate">活跃订阅</div>
              </div>
            </div>
          </BentoCard>

          {/* Upcoming: (2x2) */}
          <div className="sm:col-span-2 sm:row-span-2">
            <BentoCard title="即将到来" className="h-full" delay={0.3} icon={<Icons.CalendarClock className="h-5 w-5" />}>
              <div className="flex flex-col h-full">
                {upcoming.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted">
                    <p className="text-sm">未来 7 天暂无安排</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingVisible.map((u) => (
                      <div key={`${u.kind}:${u.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className={`
                                        h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white
                                        ${u.kind === "todo" ? "bg-brand-primary" : u.kind === "anniversary" ? "bg-pink-500" : "bg-purple-500"}
                                     `}>
                          <div className="text-center">
                            <div className="text-[10px] uppercase font-bold opacity-80">{u.at.toLocaleString('en-US', { month: 'short' })}</div>
                            <div className="text-sm font-bold leading-none">{u.at.getDate()}</div>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={u.kind === "todo" ? `/todo/${u.id}` : u.kind === "anniversary" ? `/anniversaries/${u.id}` : `/subscriptions/${u.id}`} className="block truncate text-sm font-medium hover:underline">
                            {u.kind === "todo" ? u.title : u.kind === "anniversary" ? u.title : u.name}
                          </Link>
                          <div className="text-xs text-muted flex items-center gap-2">
                            <span>{u.kind === "todo" ? "任务" : u.kind === "anniversary" ? "纪念日" : "订阅"}</span>
                            <span>•</span>
                            <span>{formatDateTime(u.at, timeZone).split(' ')[1]}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </BentoCard>
          </div>

          {/* Insights: (2x2) */}
          <div className="sm:col-span-2 sm:row-span-2">
            <BentoCard title="财务与洞察" className="h-full" delay={0.35} icon={<Icons.LineChart className="h-5 w-5" />}>
              <div className="grid grid-cols-1 gap-4">
                {/* Subscription Spend */}
                <div className="rounded-xl bg-surface/50 p-4">
                  <div className="text-xs font-semibold text-secondary mb-2">预估月度支出</div>
                  {monthlySpendRows.length > 0 ? (
                    <div className="space-y-2">
                      {monthlySpendRows.map((row) => (
                        <div key={row.currency} className="flex items-baseline justify-between">
                          <span className="text-sm font-mono text-muted">{row.currency}</span>
                          <span className="text-lg font-bold tabular-nums">{formatCurrencyAmount(row.amount, row.currency).replace(row.currency, '')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted">暂无支出数据</div>
                  )}
                </div>

                {/* Item Daily Cost */}
                <div className="rounded-xl bg-surface/50 p-4">
                  <div className="text-xs font-semibold text-secondary mb-2">日均成本最低 (Top 3)</div>
                  {lowestDailyCostItems.length > 0 ? (
                    <ul className="space-y-3">
                      {lowestDailyCostItems.map((it) => (
                        <li key={it.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                            <span className="truncate text-sm text-secondary">{it.name}</span>
                          </div>
                          <span className="text-sm font-mono text-muted tabular-nums">
                            {formatCurrencyAmount(it.dailyCents / 100, it.currency)}/天
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted">暂无物品数据</div>
                  )}
                </div>
              </div>
            </BentoCard>
          </div>

        </div>
      </main>
    </div>
  );
}
