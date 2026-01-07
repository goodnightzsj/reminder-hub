import { desc, like } from "drizzle-orm";
import Link from "next/link";

import { AppHeader } from "@/app/_components/AppHeader";
import { Badge } from "@/app/_components/Badge";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
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
    <div className="min-h-screen bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="搜索"
          description="跨 Todo / 纪念日 / 订阅 / 物品 的标题关键字搜索。"
        />

        <section className="mb-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <form action="/search" method="GET" className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                name="q"
                defaultValue={q}
                placeholder="输入关键字…"
                className="flex-1"
              />
              <Button
                type="submit"
                variant="primary"
                size="lg" // h-11
                className="sm:self-end"
              >
                搜索
              </Button>
            </div>

            <p className="text-xs text-muted">
              时区：<code className="font-mono">{timeZone}</code>
              {q.length > 0 ? (
                <>
                  <span className="mx-2 text-secondary">·</span>结果 {total}
                </>
              ) : null}
            </p>
          </form>
        </section>

        {q.length === 0 ? (
          <div className="rounded-xl border border-default bg-elevated p-4 text-sm text-secondary shadow-sm">
            输入关键字开始搜索。
          </div>
        ) : total === 0 ? (
          <div className="rounded-xl border border-default bg-elevated p-4 text-sm text-secondary shadow-sm">
            没有找到匹配项。
          </div>
        ) : (
          <div className="grid gap-6">
            {todoRows.length > 0 ? (
              <section>
                <h2 className="text-sm font-medium">Todo（{todoRows.length}）</h2>
                <ul className="mt-3 divide-y divide-divider rounded-lg border border-divider text-sm">
                  {todoRows.map((t, index) => (
                    <li
                      key={t.id}
                      className={`flex items-start justify-between gap-3 p-3 animate-slide-up ${index < 5 ? `stagger-${index + 1}` : ""
                        }`}
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-secondary">
                          {t.isArchived ? <Badge>已归档</Badge> : null}
                          {t.isDone ? (
                            <Badge variant="success">已完成</Badge>
                          ) : null}
                          {t.dueAt ? (
                            <span className="text-muted">
                              截止 {formatDateTime(t.dueAt, timeZone)}
                            </span>
                          ) : null}
                        </div>
                        <Link
                          href={`/todo/${t.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {t.title}
                        </Link>
                      </div>
                      <Link
                        href={`/todo/${t.id}`}
                        className="shrink-0 rounded-lg border border-default px-3 py-2 text-xs font-medium hover:bg-interactive-hover"
                      >
                        查看
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {anniversaryRows.length > 0 ? (
              <section>
                <h2 className="text-sm font-medium">
                  纪念日（{anniversaryRows.length}）
                </h2>
                <ul className="mt-3 divide-y divide-divider rounded-lg border border-divider text-sm">
                  {anniversaryRows.map((a, index) => (
                    <li
                      key={a.id}
                      className={`flex items-start justify-between gap-3 p-3 animate-slide-up ${index < 5 ? `stagger-${index + 1}` : ""
                        }`}
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                          {a.isArchived ? <Badge>已归档</Badge> : null}
                          <Badge>{a.dateType === "solar" ? "公历" : "农历"}</Badge>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {a.date}
                          </span>
                        </div>
                        <Link
                          href={`/anniversaries/${a.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {a.title}
                        </Link>
                      </div>
                      <Link
                        href={`/anniversaries/${a.id}`}
                        className="shrink-0 rounded-lg border border-black/[.08] px-3 py-2 text-xs font-medium hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                      >
                        查看
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {subscriptionRows.length > 0 ? (
              <section>
                <h2 className="text-sm font-medium">
                  订阅（{subscriptionRows.length}）
                </h2>
                <ul className="mt-3 divide-y divide-divider rounded-lg border border-divider text-sm">
                  {subscriptionRows.map((s, index) => (
                    <li
                      key={s.id}
                      className={`flex items-start justify-between gap-3 p-3 animate-slide-up ${index < 5 ? `stagger-${index + 1}` : ""
                        }`}
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                          {s.isArchived ? <Badge>已归档</Badge> : null}
                          <span className="text-zinc-500 dark:text-zinc-400">
                            到期 {s.nextRenewDate}
                          </span>
                        </div>
                        <Link
                          href={`/subscriptions/${s.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {s.name}
                        </Link>
                      </div>
                      <Link
                        href={`/subscriptions/${s.id}`}
                        className="shrink-0 rounded-lg border border-black/[.08] px-3 py-2 text-xs font-medium hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                      >
                        查看
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {itemRows.length > 0 ? (
              <section>
                <h2 className="text-sm font-medium">物品（{itemRows.length}）</h2>
                <ul className="mt-3 divide-y divide-divider rounded-lg border border-divider text-sm">
                  {itemRows.map((it, index) => (
                    <li
                      key={it.id}
                      className={`flex items-start justify-between gap-3 p-3 animate-slide-up ${index < 5 ? `stagger-${index + 1}` : ""
                        }`}
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                          <Badge>{itemStatusLabel[it.status]}</Badge>
                          {it.purchasedDate ? (
                            <span className="text-zinc-500 dark:text-zinc-400">
                              购入 {it.purchasedDate}
                            </span>
                          ) : null}
                        </div>
                        <Link
                          href={`/items/${it.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {it.name}
                        </Link>
                      </div>
                      <Link
                        href={`/items/${it.id}`}
                        className="shrink-0 rounded-lg border border-black/[.08] px-3 py-2 text-xs font-medium hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                      >
                        查看
                      </Link>
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

