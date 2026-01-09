import { desc, like } from "drizzle-orm";
import Link from "next/link";

import { AppHeader } from "@/app/_components/AppHeader";
import { Badge } from "@/app/_components/Badge";
import { Button } from "@/app/_components/Button";
import { Icons } from "@/app/_components/Icons";
import { Input } from "@/app/_components/Input";
import { ServiceIconBadge } from "@/app/_components/ServiceIconBadge";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { anniversaries, items, subscriptions, todos } from "@/server/db/schema";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  if (typeof value === "string") return value;
  return null;
}

function formatDateTime(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
}

const itemStatusLabel = {
  using: "使用中",
  idle: "闲置",
  retired: "淘汰",
} as const;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = (await searchParams) ?? {};
  const raw = getParam(params, "q") ?? "";
  const q = raw.trim().slice(0, 100);

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;

  const pattern = `%${q}%`;

  const [todoRows, anniversaryRows, subscriptionRows, itemRows] =
    q.length > 0
      ? await Promise.all([
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
          .where(like(todos.title, pattern))
          .orderBy(desc(todos.createdAt))
          .limit(20),
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
          .where(like(anniversaries.title, pattern))
          .orderBy(desc(anniversaries.createdAt))
          .limit(20),
        db
          .select({
            id: subscriptions.id,
            name: subscriptions.name,
            nextRenewDate: subscriptions.nextRenewDate,
            isArchived: subscriptions.isArchived,
            createdAt: subscriptions.createdAt,
          })
          .from(subscriptions)
          .where(like(subscriptions.name, pattern))
          .orderBy(desc(subscriptions.createdAt))
          .limit(20),
        db
          .select({
            id: items.id,
            name: items.name,
            status: items.status,
            purchasedDate: items.purchasedDate,
            createdAt: items.createdAt,
          })
          .from(items)
          .where(like(items.name, pattern))
          .orderBy(desc(items.createdAt))
          .limit(20),
      ])
      : [[], [], [], []];

  const total =
    todoRows.length + anniversaryRows.length + subscriptionRows.length + itemRows.length;

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="搜索"
          description="跨 Todo / 纪念日 / 订阅 / 物品 的标题关键字搜索。"
        />

        <section className="mb-8 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <form action="/search" method="GET" className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Icons.Search className="h-5 w-5" />
                </div>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="搜索标题…"
                  className="pl-10 h-11 text-base flex-1 w-full"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="sm:w-24 h-11"
              >
                搜索
              </Button>
            </div>

            <div className="flex items-center justify-end text-xs text-muted px-1">
              {q.length > 0 && <span>结果 {total}</span>}
            </div>
          </form>
        </section>

        {q.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
            <Icons.Search className="mb-4 h-12 w-12 opacity-20" />
            <p>输入关键字开始搜索</p>
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
            <Icons.Box className="mb-4 h-12 w-12 opacity-20" />
            <p>没有找到匹配项</p>
          </div>
        ) : (
          <div className="grid gap-10">
            {todoRows.length > 0 ? (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Icons.Todo className="h-4 w-4" />
                  Todo
                  <Badge variant="default" className="ml-1">{todoRows.length}</Badge>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {todoRows.map((t, index) => (
                    <li
                      key={t.id}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl bg-elevated p-4 transition-all hover:border-brand-primary/50 hover:shadow-md animate-slide-up ${index < 10 ? `stagger-${index + 1}` : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/todo/${t.id}`} className="block truncate font-medium text-primary hover:text-brand-primary">
                            {t.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                            {t.priority === 'high' && <Badge variant="danger" className="px-1.5 py-0 text-[10px]">高优先级</Badge>}
                            {t.priority === 'medium' && <Badge variant="warning" className="px-1.5 py-0 text-[10px]">中优先级</Badge>}
                            {t.priority === 'low' && <Badge variant="success" className="px-1.5 py-0 text-[10px]">低优先级</Badge>}

                            {t.isDone ? (
                              <span className="text-success flex items-center gap-1"><Icons.Check className="h-3 w-3" /> 已完成</span>
                            ) : t.dueAt ? (
                              <span className="text-secondary">截止 {formatDateTime(t.dueAt, timeZone)}</span>
                            ) : <span className="text-secondary">无截止日期</span>}

                            {t.isArchived && <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] border border-divider">归档</span>}
                          </div>
                        </div>
                        <Link
                          href={`/todo/${t.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
                        >
                          <Icons.ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {anniversaryRows.length > 0 ? (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Icons.Calendar className="h-4 w-4" />
                  纪念日
                  <Badge variant="default" className="ml-1">{anniversaryRows.length}</Badge>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {anniversaryRows.map((a, index) => (
                    <li
                      key={a.id}
                      className={`group relative flex flex-col overflow-hidden rounded-xl bg-elevated p-4 transition-all hover:border-brand-primary/50 hover:shadow-md animate-slide-up ${index < 10 ? `stagger-${index + 1}` : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/anniversaries/${a.id}`} className="block truncate font-medium text-primary hover:text-brand-primary">
                            {a.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                            <Badge variant={a.dateType === "solar" ? "blue" : "purple"} className="px-1.5 py-0 text-[10px]">{a.dateType === "solar" ? "公历" : "农历"}</Badge>
                            <span>{a.date}</span>
                            {a.isArchived && <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] border border-divider">归档</span>}
                          </div>
                        </div>
                        <Link
                          href={`/anniversaries/${a.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
                        >
                          <Icons.ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {subscriptionRows.length > 0 ? (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Icons.CreditCard className="h-4 w-4" />
                  订阅
                  <Badge variant="default" className="ml-1">{subscriptionRows.length}</Badge>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subscriptionRows.map((s, index) => (
                    <li
                      key={s.id}
                      className={`group relative flex flex-col overflow-hidden rounded-xl bg-elevated p-4 transition-all hover:border-brand-primary/50 hover:shadow-md animate-slide-up ${index < 10 ? `stagger-${index + 1}` : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <ServiceIconBadge serviceName={s.name} size="sm" className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <Link href={`/subscriptions/${s.id}`} className="block truncate font-medium text-primary hover:text-brand-primary">
                              {s.name}
                            </Link>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                              <span>到期 {s.nextRenewDate}</span>
                              {s.isArchived && <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] border border-divider">归档</span>}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/subscriptions/${s.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
                        >
                          <Icons.ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {itemRows.length > 0 ? (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Icons.Box className="h-4 w-4" />
                  物品
                  <Badge variant="default" className="ml-1">{itemRows.length}</Badge>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {itemRows.map((it, index) => (
                    <li
                      key={it.id}
                      className={`group relative flex flex-col overflow-hidden rounded-xl bg-elevated p-4 transition-all hover:border-brand-primary/50 hover:shadow-md animate-slide-up ${index < 10 ? `stagger-${index + 1}` : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/items/${it.id}`} className="block truncate font-medium text-primary hover:text-brand-primary">
                            {it.name}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                            <Badge variant={it.status === 'using' ? 'success' : it.status === 'idle' ? 'warning' : 'danger'} className="px-1.5 py-0 text-[10px]">{itemStatusLabel[it.status]}</Badge>
                            {it.purchasedDate && <span className="text-secondary">购入 {it.purchasedDate}</span>}
                          </div>
                        </div>
                        <Link
                          href={`/items/${it.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
                        >
                          <Icons.ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

