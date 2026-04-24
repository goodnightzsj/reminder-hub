import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "../_components/layout/AppHeader";
import { Badge } from "@/app/_components/ui/Badge";
import { Button } from "@/app/_components/ui/Button";
import { IconBox, IconCalendar, IconCheck, IconChevronRight, IconCreditCard, IconSearch, IconTodo } from "@/app/_components/Icons";
import { Input } from "@/app/_components/ui/Input";
import { ServiceIconBadge } from "../_components/shared/ServiceIconBadge";
import { getAppTimeSettings } from "@/server/db/settings";
import { formatDateTime } from "@/lib/format";
import { ANNIVERSARY_DATE_TYPE } from "@/lib/anniversary";
import { ROUTES } from "@/lib/routes";
import { getSearchParamString, type SearchParams } from "@/lib/search-params";
import { getItemStatusLabel } from "@/lib/items";
import { SEARCH_QUERY_KEY } from "@/lib/url";
import { requireAuth } from "@/server/auth";

import { parseSearchQuery, querySearchRows } from "./_lib/search-results";
import { getItemStatusBadgeVariant, todoPriorityBadgeConfig } from "./_lib/search-ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "搜索",
  description: "跨待办、纪念日、订阅与物品进行统一搜索。",
};

type SearchPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await requireAuth();
  const params = (await searchParams) ?? {};
  const q = parseSearchQuery(getSearchParamString(params, SEARCH_QUERY_KEY));

  const { timeZone } = await getAppTimeSettings();

  const [todoRows, anniversaryRows, subscriptionRows, itemRows] =
    await querySearchRows(q);

  const total =
    todoRows.length + anniversaryRows.length + subscriptionRows.length + itemRows.length;

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="搜索"
        />

        <section className="mb-8 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <form action={ROUTES.search} method="GET" className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <IconSearch className="h-5 w-5" />
                </div>
                <Input
                  name={SEARCH_QUERY_KEY}
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
            <IconSearch className="mb-4 h-12 w-12 opacity-20" />
            <p>输入关键字开始搜索</p>
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
            <IconBox className="mb-4 h-12 w-12 opacity-20" />
            <p>没有找到匹配项</p>
          </div>
        ) : (
          <div className="grid gap-10">
            {todoRows.length > 0 ? (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary">
                  <IconTodo className="h-4 w-4" />
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
                          <Link href={`${ROUTES.todo}/${t.id}`} className="block truncate font-medium text-primary hover:text-brand-primary">
                            {t.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                            <Badge
                              variant={todoPriorityBadgeConfig[t.priority].variant}
                              className="px-1.5 py-0 text-[10px]"
                            >
                              {todoPriorityBadgeConfig[t.priority].label}
                            </Badge>

                            {t.isDone ? (
                              <span className="text-success flex items-center gap-1"><IconCheck className="h-3 w-3" /> 已完成</span>
                            ) : t.dueAt ? (
                              <span className="text-secondary">截止 {formatDateTime(t.dueAt, timeZone)}</span>
                            ) : <span className="text-secondary">无截止日期</span>}

                            {t.isArchived && <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] border border-divider">归档</span>}
                          </div>
                        </div>
                        <Link
                          href={`${ROUTES.todo}/${t.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
                        >
                          <IconChevronRight className="h-4 w-4" />
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
                  <IconCalendar className="h-4 w-4" />
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
                          <Link href={`${ROUTES.anniversaries}/${a.id}`} className="block truncate font-medium text-primary hover:text-brand-primary">
                            {a.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                            <Badge variant={a.dateType === ANNIVERSARY_DATE_TYPE.SOLAR ? "blue" : "purple"} className="px-1.5 py-0 text-[10px]">{a.dateType === ANNIVERSARY_DATE_TYPE.SOLAR ? "公历" : "农历"}</Badge>
                            <span>{a.date}</span>
                            {a.isArchived && <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] border border-divider">归档</span>}
                          </div>
                        </div>
                        <Link
                          href={`${ROUTES.anniversaries}/${a.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
                        >
                          <IconChevronRight className="h-4 w-4" />
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
                  <IconCreditCard className="h-4 w-4" />
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
                          <ServiceIconBadge
                            serviceName={s.name}
                            overrideIcon={s.icon || undefined}
                            overrideColor={s.color || undefined}
                            size="sm"
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <Link href={`${ROUTES.subscriptions}/${s.id}`} className="block truncate font-medium text-primary hover:text-brand-primary">
                              {s.name}
                            </Link>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                              <span>到期 {s.nextRenewDate}</span>
                              {s.isArchived && <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] border border-divider">归档</span>}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`${ROUTES.subscriptions}/${s.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
                        >
                          <IconChevronRight className="h-4 w-4" />
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
                  <IconBox className="h-4 w-4" />
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
                          <Link href={`${ROUTES.items}/${it.id}`} className="block truncate font-medium text-primary hover:text-brand-primary">
                            {it.name}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-secondary">
                            <Badge variant={getItemStatusBadgeVariant(it.status)} className="px-1.5 py-0 text-[10px]">
                              {getItemStatusLabel(it.status)}
                            </Badge>
                            {it.purchasedDate && <span className="text-secondary">购入 {it.purchasedDate}</span>}
                          </div>
                        </div>
                        <Link
                          href={`${ROUTES.items}/${it.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-secondary hover:bg-surface-hover hover:text-primary"
                        >
                          <IconChevronRight className="h-4 w-4" />
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
