import type { Metadata } from "next";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/app/_components/layout/AppHeader";
import { IconBox, IconCheckSquare, IconGift, IconRepeat } from "@/app/_components/Icons";
import { Badge, getBadgeVariantFromLabel } from "@/app/_components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAnniversaryCategoryLabel } from "@/lib/anniversary";
import { getItemStatusLabel } from "@/lib/items";
import { getTodoPriorityLabel } from "@/lib/todo";
import { getYearReviewPageData } from "./_lib/review-page-data";

export const dynamic = "force-dynamic";

type ReviewYearPageProps = {
  params: Promise<{ year: string }>;
};

export async function generateMetadata({ params }: ReviewYearPageProps): Promise<Metadata> {
  const { year } = await params;

  return {
    title: `${year} 年度回顾`,
    description: `查看 ${year} 年的年度概览、完成统计、分类汇总与完成详情。`,
  };
}

function parseYearParam(value: string): number | null {
  if (!/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  if (year < 1970 || year > 2100) return null;
  return year;
}

function Surface(props: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-elevated hover-float hover:border-brand-primary/20",
        props.className,
      )}
    >
      {props.glow && (
        <div className="absolute -inset-px bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-primary/20 opacity-0 blur-2xl transition-opacity duration-1000 group-hover:opacity-100 pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 via-transparent to-brand-secondary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-[0.03] dark:opacity-[0.05]" />
      <div className="relative z-10">{props.children}</div>
    </div>
  );
}

function GlassPanel(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-glass ring-1 ring-black/5 shadow-sm dark:ring-white/10",
        props.className,
      )}
    >
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-[0.04] dark:opacity-[0.06]" />
      <div className="relative z-10">{props.children}</div>
    </div>
  );
}

function BentoCard(props: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
  bodyClassName?: string;
  glow?: boolean;
  children: ReactNode;
}) {
  return (
    <Surface className={cn("p-0", props.className)} glow={props.glow}>
      <div className="flex items-start justify-between gap-4 border-b border-divider/70 px-6 py-4">
        <div className="flex items-start gap-3">
          {props.icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20">
              {typeof props.icon === "string" ? <Icon icon={props.icon} className="h-5 w-5" /> : props.icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight text-primary">{props.title}</h2>
            {props.subtitle && <p className="mt-1 text-xs text-muted">{props.subtitle}</p>}
          </div>
        </div>
        {props.badge}
      </div>
      <div className={cn("p-6", props.bodyClassName)}>{props.children}</div>
    </Surface>
  );
}

type MetricTone = "brand" | "success" | "info" | "warning" | "neutral";

function MetricTile(props: { label: string; value: number | string; hint?: string; icon?: string; tone?: MetricTone }) {
  const tone = props.tone ?? "neutral";
  const iconClassName = (() => {
    if (tone === "brand") return "bg-brand-primary/10 text-brand-primary ring-brand-primary/20";
    if (tone === "success") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (tone === "info") return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (tone === "warning") return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    return "bg-surface text-muted";
  })();

  return (
    <div className="rounded-2xl border border-divider bg-surface/60 p-4 shadow-sm transition-colors hover:bg-surface hover:border-brand-primary/15">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-muted">{props.label}</div>
        {props.icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-black/5 dark:ring-white/10",
              iconClassName,
            )}
          >
            <Icon icon={props.icon} className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-primary tabular-nums leading-none">{props.value}</div>
      {props.hint && <div className="mt-2 text-xs text-muted">{props.hint}</div>}
    </div>
  );
}

function MiniList(props: { title: string; items: string[]; emptyText: string; icon?: ReactNode; max?: number }) {
  const max = props.max ?? 4;
  return (
    <div className="rounded-2xl border border-divider bg-surface/60 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {props.icon && (
            typeof props.icon === "string" ? (
              <Icon icon={props.icon} className="h-4 w-4 text-brand-primary" />
            ) : (
              <span className="text-brand-primary">{props.icon}</span>
            )
          )}
          <div className="truncate text-xs font-semibold text-secondary">{props.title}</div>
        </div>
        <div className="rounded-full bg-surface px-2 py-1 text-[10px] font-medium text-muted tabular-nums">{props.items.length}</div>
      </div>
      <div className="mt-3 space-y-2">
        {props.items.length === 0 ? (
          <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">{props.emptyText}</div>
        ) : (
          props.items.slice(0, max).map((line, idx) => (
            <div key={idx} className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-secondary">
              {line}
            </div>
          ))
        )}
        {props.items.length > max && (
          <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">
            仅展示前 {max} 条（共 {props.items.length} 条）。
          </div>
        )}
      </div>
    </div>
  );
}

function PillLink(props: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={props.href}
      className={cn(
        "relative inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all active-press",
        props.active
          ? "bg-glass border-white/10 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          : "border-divider bg-surface/70 text-secondary hover:bg-surface hover:text-primary",
      )}
    >
      {props.active && (
        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-primary/10 to-brand-secondary/5 opacity-60 pointer-events-none" />
      )}
      <span className={cn("relative z-10", props.active && "text-gradient-brand font-semibold")}>{props.label}</span>
    </Link>
  );
}

function BarRow(props: { label: string; count: number; max: number }) {
  const pct = props.max <= 0 ? 0 : Math.round((props.count / props.max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0 truncate text-xs text-secondary">{props.label}</div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface/70">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-10 shrink-0 text-right text-[10px] text-muted tabular-nums">{props.count}</div>
    </div>
  );
}

function sortCountRows(rows: Array<{ key: string; count: number }>): Array<{ key: string; count: number }> {
  return rows.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, "zh-CN"));
}

function getSubscriptionCycleUnitLabel(unit: string): string {
  if (unit === "month") return "月付";
  if (unit === "year") return "年付";
  return unit;
}

function getAnniversaryDateTypeLabel(dateType: string): string {
  if (dateType === "solar") return "公历";
  if (dateType === "lunar") return "农历";
  return dateType;
}

function TodoDetailRow(props: { title: string; href: string; meta: ReactNode }) {
  return (
    <Link
      href={props.href}
      className="group relative flex min-w-0 max-w-full items-start justify-between gap-4 rounded-xl border border-divider bg-surface/70 px-3 py-2 transition-all hover:bg-surface hover:border-brand-primary/20 active-press"
    >
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-primary group-hover:underline">{props.title}</div>
        <div className="mt-1 flex min-w-0 max-w-full flex-wrap items-center gap-1.5">{props.meta}</div>
      </div>
      <Icon icon="ri:arrow-right-s-line" className="mt-0.5 h-4 w-4 text-muted shrink-0" />
    </Link>
  );
}

export default async function YearReviewPage({ params }: ReviewYearPageProps) {
  const { year: yearRaw } = await params;
  const year = parseYearParam(yearRaw);
  if (!year) notFound();

  const data = await getYearReviewPageData({ year });

  const maxMonthly = Math.max(
    1,
    ...data.monthlyCounts.map((r) => Math.max(r.created, r.completed)),
  );

  const thisWeekNewTodoLines = data.thisWeekNew.todos.map((t) => `${t.title} · ${formatDateTime(t.createdAt, data.timeZone)}`);
  const thisWeekNewAnnLines = data.thisWeekNew.anniversaries.map((t) => `${t.title} · ${formatDateTime(t.createdAt, data.timeZone)}`);
  const thisWeekNewSubLines = data.thisWeekNew.subscriptions.map((t) => `${t.name} · ${formatDateTime(t.createdAt, data.timeZone)}`);
  const thisWeekNewItemLines = data.thisWeekNew.items.map((t) => `${t.name} · ${formatDateTime(t.createdAt, data.timeZone)}`);

  const highlightCompletedLines = data.highlights.completedTodos.map((t) => `${t.title} · ${formatDateTime(t.completedAt, data.timeZone)}`);
  const highlightCreatedLines = data.highlights.createdTodos.map((t) => `${t.title} · ${formatDateTime(t.createdAt, data.timeZone)}`);

  const anniversaryLines = data.anniversariesInYear.map((a) => `${a.occurrenceDate} · ${getAnniversaryCategoryLabel(a.category)} · ${a.title}`);
  const subscriptionLines = data.subscriptionsActiveList.map(
    (s) => `${s.nextRenewDate} · ${s.category} · ${s.name}${s.autoRenew ? "（自动续费）" : ""}`,
  );
  const itemLines = data.itemsInYear.map((it) => {
    const date = it.purchasedDate ?? "（无购买日期）";
    return `${date} · ${it.category} · ${getItemStatusLabel(it.status)} · ${it.name}`;
  });
  const thisWeekTotalNew = thisWeekNewTodoLines.length + thisWeekNewAnnLines.length + thisWeekNewSubLines.length + thisWeekNewItemLines.length;

  const yearsSorted = data.availableYears.slice().sort((a, b) => b - a);
  const currentIndex = yearsSorted.indexOf(year);
  const prevYear = currentIndex >= 0 && currentIndex + 1 < yearsSorted.length ? yearsSorted[currentIndex + 1] : null;
  const nextYear = currentIndex > 0 ? yearsSorted[currentIndex - 1] : null;

  const topCompletedMonth = data.monthlyCounts.reduce(
    (acc, r) => (r.completed > acc.completed ? { month: r.month, completed: r.completed } : acc),
    { month: 1, completed: 0 },
  );
  const topCreatedMonth = data.monthlyCounts.reduce(
    (acc, r) => (r.created > acc.created ? { month: r.month, created: r.created } : acc),
    { month: 1, created: 0 },
  );

  const maxSubCategory = Math.max(1, ...data.breakdown.subscriptionsByCategory.map((r) => r.count));
  const maxSubCycle = Math.max(1, ...data.breakdown.subscriptionsByCycleUnit.map((r) => r.count));
  const anniversariesInYearByCategoryRows = (() => {
    const map = new Map<string, number>();
    for (const a of data.anniversariesInYear) {
      map.set(a.category, (map.get(a.category) ?? 0) + 1);
    }
    return sortCountRows(Array.from(map.entries()).map(([key, count]) => ({ key, count })));
  })();
  const anniversariesInYearByDateTypeRows = (() => {
    const map = new Map<string, number>();
    for (const a of data.anniversariesInYear) {
      map.set(a.dateType, (map.get(a.dateType) ?? 0) + 1);
    }
    return sortCountRows(Array.from(map.entries()).map(([key, count]) => ({ key, count })));
  })();
  const itemsInYearByCategoryRows = (() => {
    const map = new Map<string, number>();
    for (const it of data.itemsInYear) {
      map.set(it.category, (map.get(it.category) ?? 0) + 1);
    }
    return sortCountRows(Array.from(map.entries()).map(([key, count]) => ({ key, count })));
  })();
  const itemsInYearByStatusRows = (() => {
    const map = new Map<string, number>();
    for (const it of data.itemsInYear) {
      map.set(it.status, (map.get(it.status) ?? 0) + 1);
    }
    return sortCountRows(Array.from(map.entries()).map(([key, count]) => ({ key, count })));
  })();

  const maxAnnInYearCategory = Math.max(1, ...anniversariesInYearByCategoryRows.map((r) => r.count));
  const maxAnnInYearDateType = Math.max(1, ...anniversariesInYearByDateTypeRows.map((r) => r.count));
  const maxItemsInYearCategory = Math.max(1, ...itemsInYearByCategoryRows.map((r) => r.count));
  const maxItemsInYearStatus = Math.max(1, ...itemsInYearByStatusRows.map((r) => r.count));

  const completedByTaskType = new Map<string, typeof data.details.completedTodos>();
  for (const t of data.details.completedTodos) {
    const list = completedByTaskType.get(t.taskType) ?? [];
    list.push(t);
    completedByTaskType.set(t.taskType, list);
  }
  for (const [, list] of completedByTaskType) {
    list.sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
  }

  return (
    <div className="min-h-dvh bg-base font-sans text-primary animate-fade-in pb-20 sm:pb-10">
      <main className="mx-auto max-w-6xl xl:max-w-7xl py-10 px-fluid">
        <AppHeader
          title={`年度回顾 · ${year}`}
          description={
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1">
                <Icon icon="ri:calendar-event-line" className="h-3.5 w-3.5" />
                {data.yearRange.startDate} ~ {data.yearRange.endDate}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1">
                <Icon icon="ri:time-line" className="h-3.5 w-3.5" />
                时区 {data.timeZone}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1">
                <Icon icon="ri:cpu-line" className="h-3.5 w-3.5" />
                生成 {data.generatedAtIso}
              </span>
            </div>
          }
        />

        <GlassPanel className="mb-8 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 -mx-1 px-1">
              {yearsSorted.map((y) => (
                <PillLink key={y} href={`/review/${y}`} label={String(y)} active={y === year} />
              ))}
              <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background/80 to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background/80 to-transparent" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/review"
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-divider bg-surface/70 px-3 py-2 text-[11px] font-medium text-secondary transition-colors hover:bg-surface hover:text-primary active-press"
              >
                <Icon icon="ri:layout-grid-line" className="h-4 w-4" />
                选择年份
              </Link>
              {prevYear ? (
                <Link
                  href={`/review/${prevYear}`}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-divider bg-surface/70 px-3 py-2 text-[11px] font-medium text-secondary transition-colors hover:bg-surface hover:text-primary active-press"
                >
                  <Icon icon="ri:arrow-left-s-line" className="h-4 w-4" />
                  上一年
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-divider bg-surface/50 px-3 py-2 text-[11px] font-medium text-muted opacity-50">
                  <Icon icon="ri:arrow-left-s-line" className="h-4 w-4" />
                  上一年
                </span>
              )}
              {nextYear ? (
                <Link
                  href={`/review/${nextYear}`}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-divider bg-surface/70 px-3 py-2 text-[11px] font-medium text-secondary transition-colors hover:bg-surface hover:text-primary active-press"
                >
                  下一年
                  <Icon icon="ri:arrow-right-s-line" className="h-4 w-4" />
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center gap-1 rounded-xl border border-divider bg-surface/50 px-3 py-2 text-[11px] font-medium text-muted opacity-50">
                  下一年
                  <Icon icon="ri:arrow-right-s-line" className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
        </GlassPanel>

        <BentoCard
          title="年度概览"
          subtitle="仅展示信息，不包含自动操作"
          icon="ri:bar-chart-2-line"
          glow
          badge={<Badge variant="secondary">KPI</Badge>}
        >
          <p className="mb-4 text-sm leading-relaxed text-secondary">
            今年你完成了 <span className="font-semibold text-primary tabular-nums">{data.stats.todosCompleted}</span> 条 Todo，
            新增了 <span className="font-semibold text-primary tabular-nums">{data.stats.todosCreated}</span> 条；
            本周新增 <span className="font-semibold text-primary tabular-nums">{thisWeekTotalNew}</span> 条。
          </p>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            <MetricTile label="今年新增 Todo" value={data.stats.todosCreated} icon="ri:add-circle-line" tone="brand" />
            <MetricTile
              label="今年完成 Todo"
              value={data.stats.todosCompleted}
              icon="ri:checkbox-circle-line"
              tone="success"
              hint={`最高完成月份：${topCompletedMonth.month} 月（${topCompletedMonth.completed}）`}
            />
            <MetricTile label="当前未完成 Todo" value={data.stats.todosActive} icon="ri:time-line" tone="info" hint="全量当前状态" />
            <MetricTile
              label="活跃订阅"
              value={data.stats.subscriptionsActive}
              icon="ri:repeat-2-line"
              tone="warning"
              hint={`自动续费 ${data.breakdown.subscriptionsByAutoRenew.autoRenew} / 手动 ${data.breakdown.subscriptionsByAutoRenew.manualRenew}`}
            />
            <MetricTile label="活跃纪念日" value={data.stats.anniversariesActive} icon="ri:gift-line" tone="brand" />
            <MetricTile label="物品记录" value={data.stats.itemsActive} icon="ri:archive-line" />
            <MetricTile
              label="最高新增月份"
              value={`${topCreatedMonth.month} 月`}
              icon="ri:rocket-line"
              hint={`新增 ${topCreatedMonth.created} 条`}
            />
            <MetricTile
              label="本周新增"
              value={thisWeekTotalNew}
              icon="ri:sparkling-line"
              hint={`${data.thisWeek.startDate} ~ ${data.thisWeek.endDate}`}
            />
          </div>
        </BentoCard>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="grid gap-5 lg:gap-6">
            <BentoCard
              title="本周新增"
              subtitle={`${data.thisWeek.startDate} ~ ${data.thisWeek.endDate}`}
              icon="ri:calendar-todo-line"
              badge={<Badge variant="secondary">{thisWeekTotalNew} 条</Badge>}
            >
              <div className="grid gap-3">
                <MiniList title="Todo" items={thisWeekNewTodoLines} emptyText="本周暂无新增 Todo" icon={<IconCheckSquare className="h-4 w-4" />} max={3} />
                <MiniList title="纪念日" items={thisWeekNewAnnLines} emptyText="本周暂无新增纪念日" icon="ri:gift-line" max={3} />
                <MiniList title="订阅" items={thisWeekNewSubLines} emptyText="本周暂无新增订阅" icon="ri:repeat-2-line" max={3} />
                <MiniList title="物品" items={thisWeekNewItemLines} emptyText="本周暂无新增物品" icon="ri:archive-line" max={3} />
              </div>
            </BentoCard>

            <BentoCard
              title="年度节奏"
              subtitle="按月统计（新增 / 完成 Todo）"
              icon="ri:line-chart-line"
              badge={<Badge variant="secondary">12 月</Badge>}
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="inline-flex items-center gap-2 rounded-full bg-surface px-2 py-1">
                  <span className="h-2 w-2 rounded-full bg-brand-secondary" />
                  新增
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-surface px-2 py-1">
                  <span className="h-2 w-2 rounded-full bg-brand-primary" />
                  完成
                </span>
              </div>
              <div className="grid gap-3">
                {data.monthlyCounts.map((row) => {
                  const createdPct = Math.round((row.created / maxMonthly) * 100);
                  const completedPct = Math.round((row.completed / maxMonthly) * 100);
                  return (
                    <div key={row.month} className="flex items-center gap-3">
                      <div className="w-10 shrink-0 text-xs text-muted tabular-nums">{row.month}月</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-12 shrink-0 text-[10px] text-muted">新增</div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface/70">
                            <div className="h-2.5 rounded-full bg-brand-secondary" style={{ width: `${createdPct}%` }} />
                          </div>
                          <div className="w-10 shrink-0 text-right text-[10px] text-muted tabular-nums">{row.created}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-12 shrink-0 text-[10px] text-muted">完成</div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface/70">
                            <div className="h-2.5 rounded-full bg-brand-primary" style={{ width: `${completedPct}%` }} />
                          </div>
                          <div className="w-10 shrink-0 text-right text-[10px] text-muted tabular-nums">{row.completed}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </BentoCard>

            <BentoCard
              title="订阅分布"
              subtitle="类别 / 周期 / 续费方式（活跃订阅）"
              icon="ri:repeat-2-line"
              badge={
                <Badge variant="secondary">
                  自动 {data.breakdown.subscriptionsByAutoRenew.autoRenew} / 手动 {data.breakdown.subscriptionsByAutoRenew.manualRenew}
                </Badge>
              }
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-secondary">按类别</div>
                    <div className="text-[10px] text-muted tabular-nums">{data.breakdown.subscriptionsByCategory.length}</div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {data.breakdown.subscriptionsByCategory.length === 0 ? (
                      <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">暂无活跃订阅</div>
                    ) : (
                      data.breakdown.subscriptionsByCategory.map((r) => (
                        <BarRow key={r.key} label={r.key} count={r.count} max={maxSubCategory} />
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-secondary">按周期</div>
                    <div className="text-[10px] text-muted tabular-nums">{data.breakdown.subscriptionsByCycleUnit.length}</div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {data.breakdown.subscriptionsByCycleUnit.length === 0 ? (
                      <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">暂无数据</div>
                    ) : (
                      data.breakdown.subscriptionsByCycleUnit.map((r) => (
                        <BarRow key={r.key} label={getSubscriptionCycleUnitLabel(r.key)} count={r.count} max={maxSubCycle} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard
              title="纪念日分布"
              subtitle="本年发生：类别 / 日期类型"
              icon="ri:gift-line"
              badge={<Badge variant="secondary">{data.anniversariesInYear.length} 条</Badge>}
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-secondary">按类别</div>
                  <div className="mt-3 grid gap-2">
                    {anniversariesInYearByCategoryRows.length === 0 ? (
                      <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">本年暂无纪念日</div>
                    ) : (
                      anniversariesInYearByCategoryRows.map((r) => (
                        <BarRow key={r.key} label={getAnniversaryCategoryLabel(r.key)} count={r.count} max={maxAnnInYearCategory} />
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-secondary">按日期类型</div>
                  <div className="mt-3 grid gap-2">
                    {anniversariesInYearByDateTypeRows.length === 0 ? (
                      <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">暂无数据</div>
                    ) : (
                      anniversariesInYearByDateTypeRows.map((r) => (
                        <BarRow key={r.key} label={getAnniversaryDateTypeLabel(r.key)} count={r.count} max={maxAnnInYearDateType} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard
              title="物品分布"
              subtitle="本年记录：类别 / 状态"
              icon="ri:archive-line"
              badge={<Badge variant="secondary">{data.itemsInYear.length} 条</Badge>}
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-secondary">按类别</div>
                  <div className="mt-3 grid gap-2">
                    {itemsInYearByCategoryRows.length === 0 ? (
                      <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">本年暂无物品记录</div>
                    ) : (
                      itemsInYearByCategoryRows.map((r) => (
                        <BarRow key={r.key} label={r.key} count={r.count} max={maxItemsInYearCategory} />
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-secondary">按状态</div>
                  <div className="mt-3 grid gap-2">
                    {itemsInYearByStatusRows.length === 0 ? (
                      <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">暂无数据</div>
                    ) : (
                      itemsInYearByStatusRows.map((r) => (
                        <BarRow key={r.key} label={getItemStatusLabel(r.key)} count={r.count} max={maxItemsInYearStatus} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </BentoCard>
          </div>

          <div className="grid gap-5 lg:gap-6">
            <BentoCard
              title="年度亮点"
              subtitle="最近完成 / 最近新增"
              icon="ri:star-line"
              badge={<Badge variant="secondary">Top</Badge>}
            >
              <div className="grid gap-3">
                <MiniList title="最近完成的 Todo" items={highlightCompletedLines} emptyText="今年暂无完成记录" icon="ri:checkbox-circle-line" max={5} />
                <MiniList title="最近新增的 Todo" items={highlightCreatedLines} emptyText="今年暂无新增记录" icon="ri:add-circle-line" max={5} />
              </div>
            </BentoCard>

            <BentoCard
              title="Todo 分类"
              subtitle="按类别统计（新增 / 完成 / 未完成）"
              icon="ri:apps-2-line"
              badge={<Badge variant="secondary">{data.breakdown.todosByTaskType.length} 类</Badge>}
            >
              <div className="grid gap-2">
                {data.breakdown.todosByTaskType.length === 0 ? (
                  <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">暂无数据</div>
                ) : (
                  data.breakdown.todosByTaskType.map((r) => (
                    <div key={r.taskType} className="flex items-center justify-between gap-3 rounded-xl border border-divider bg-surface/60 px-3 py-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <Badge variant={getBadgeVariantFromLabel(r.taskType)} className="min-w-0 max-w-full break-words">
                          {r.taskType}
                        </Badge>
                        <div className="truncate text-xs text-muted">当前未完成 {r.active}</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 text-[10px] text-muted tabular-nums">
                        <span>新增 {r.created}</span>
                        <span className="h-3 w-px bg-divider" />
                        <span>完成 {r.completed}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </BentoCard>

            <BentoCard
              title="Todo 优先级"
              subtitle="按优先级统计（新增 / 完成）"
              icon="ri:flag-line"
              badge={<Badge variant="secondary">{data.breakdown.todosByPriority.length} 级</Badge>}
            >
              <div className="grid gap-2">
                {data.breakdown.todosByPriority.length === 0 ? (
                  <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">暂无数据</div>
                ) : (
                  data.breakdown.todosByPriority.map((r) => (
                    <div key={r.priority} className="flex items-center justify-between gap-3 rounded-xl border border-divider bg-surface/60 px-3 py-2">
                      <Badge variant={r.priority === "high" ? "danger" : r.priority === "medium" ? "warning" : "success"}>
                        {getTodoPriorityLabel(r.priority)}
                      </Badge>
                      <div className="shrink-0 flex items-center gap-2 text-[10px] text-muted tabular-nums">
                        <span>新增 {r.created}</span>
                        <span className="h-3 w-px bg-divider" />
                        <span>完成 {r.completed}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </BentoCard>

            <BentoCard
              title="清单预览"
              subtitle="纪念日 / 订阅 / 物品（仅展示信息）"
              icon={<IconCheckSquare className="h-5 w-5" />}
              badge={<Badge variant="secondary">{anniversaryLines.length + subscriptionLines.length + itemLines.length} 条</Badge>}
            >
              <div className="grid gap-3">
                <MiniList title="本年纪念日" items={anniversaryLines} emptyText="今年暂无纪念日" icon={<IconGift className="h-4 w-4" />} max={3} />
                <MiniList title="活跃订阅" items={subscriptionLines} emptyText="暂无活跃订阅" icon={<IconRepeat className="h-4 w-4" />} max={3} />
                <MiniList title="本年物品" items={itemLines} emptyText="今年暂无物品记录" icon={<IconBox className="h-4 w-4" />} max={3} />
              </div>
            </BentoCard>

            <BentoCard
              title="完成详情"
              subtitle="按 Todo 类别分组（点击展开）"
              icon="ri:checkbox-multiple-line"
              badge={<Badge variant="secondary">{data.stats.todosCompleted} 条</Badge>}
            >
              <div className="grid min-w-0 max-w-full gap-3 overflow-x-hidden">
                {Array.from(completedByTaskType.entries()).length === 0 ? (
                  <div className="rounded-2xl border border-divider bg-surface/60 p-5 text-sm text-muted">今年暂无 Todo 完成记录</div>
                ) : (
                  Array.from(completedByTaskType.entries())
                    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "zh-CN"))
                    .map(([taskType, list]) => (
                      <details
                        key={taskType}
                        className="w-full min-w-0 max-w-full overflow-x-hidden rounded-2xl border border-divider bg-surface/60 p-4 transition-all hover:bg-surface hover:border-brand-primary/20 open:bg-surface open:border-brand-primary/20 [&[open]_[data-chevron]]:rotate-180 [&[open]_[data-content]]:animate-slide-up"
                      >
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <Badge variant={getBadgeVariantFromLabel(taskType)} className="min-w-0 max-w-full break-words">
                                {taskType}
                              </Badge>
                              <div className="text-xs text-muted tabular-nums">完成 {list.length}</div>
                            </div>
                            <Icon
                              icon="ri:arrow-down-s-line"
                              data-chevron
                              className="h-5 w-5 text-muted transition-transform duration-300"
                            />
                          </div>
                        </summary>

                        <div className="mt-4 grid min-w-0 max-w-full gap-2 overflow-x-hidden [overflow-anchor:none]" data-content>
                          {list.slice(0, 100).map((t) => {
                            const priorityVariant =
                              t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "success";
                            const completedText = t.completedAt ? formatDateTime(t.completedAt, data.timeZone) : "—";
                            const dueText = t.dueAt ? formatDateTime(t.dueAt, data.timeZone) : null;
                            return (
                              <TodoDetailRow
                                key={t.id}
                                title={t.title}
                                href={t.href}
                                meta={
                                  <>
                                    <Badge variant={priorityVariant} className="min-w-0 max-w-full break-words">
                                      {getTodoPriorityLabel(t.priority)}
                                    </Badge>
                                    {dueText && (
                                      <Badge variant="outline" className="min-w-0 max-w-full break-words">
                                        截止 {dueText}
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="min-w-0 max-w-full break-words">
                                      完成 {completedText}
                                    </Badge>
                                    {t.tags.slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant={getBadgeVariantFromLabel(tag)} className="min-w-0 max-w-full break-words">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </>
                                }
                              />
                            );
                          })}

                          {list.length > 100 && (
                            <div className="rounded-xl border border-divider bg-surface/60 px-3 py-2 text-xs text-muted">
                              仅展示前 100 条（该类别共 {list.length} 条）。
                            </div>
                          )}
                        </div>
                      </details>
                    ))
                )}
              </div>
            </BentoCard>
          </div>
        </div>
      </main>
    </div>
  );
}
