import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "../_components/layout/AppHeader";
import { CreateModal } from "../_components/modals/CreateModal";
import { EmptyState } from "../_components/shared/EmptyState";
import { SegmentedControl } from "@/app/_components/SegmentedControl";
import { AnniversaryCreateForm } from "@/app/_components/anniversary/AnniversaryCreateForm";
import { AnniversaryList } from "@/app/_components/anniversary/AnniversaryList";
import { canonicalizeAnniversaryCategory, getAnniversaryCategoryLabel } from "@/lib/anniversary";
import { getSearchParamString, type SearchParams } from "@/lib/search-params";
import { buildAnniversariesHref as buildHref, buildCreateModalHref, CATEGORY_QUERY_KEY, FILTER_QUERY_KEY } from "@/lib/url";
import { ROUTES } from "@/lib/routes";
import { requireAuth } from "@/server/auth";

import { ANNIVERSARY_FILTER, parseAnniversaryFilter } from "./_lib/anniversary-filters";
import { getAnniversariesPageData } from "./_lib/anniversaries-page-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "纪念日",
  description: "管理公历与农历纪念日，查看下一次到来时间与提醒设置。",
};

type AnniversariesPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function AnniversariesPage({ searchParams }: AnniversariesPageProps) {
  await requireAuth();
  const params = (await searchParams) ?? {};
  const filter = parseAnniversaryFilter(getSearchParamString(params, FILTER_QUERY_KEY));
  const categoryFilter = getSearchParamString(params, CATEGORY_QUERY_KEY);
  const categoryFilterCanonical = categoryFilter ? canonicalizeAnniversaryCategory(categoryFilter) : null;

  const { timeZone, dateReminderTime, items, distinctCategories } = await getAnniversariesPageData({
    filter,
    categoryFilterCanonical,
  });

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader title="纪念日" />

        <CreateModal title="新建纪念日">
          <AnniversaryCreateForm dateReminderTime={dateReminderTime} timeZone={timeZone} className="" />
        </CreateModal>

        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
              <SegmentedControl
                options={[
                  {
                    key: ANNIVERSARY_FILTER.ACTIVE,
                    label: "进行中",
                    href: buildHref({ filter: ANNIVERSARY_FILTER.ACTIVE, category: categoryFilterCanonical }),
                  },
                  {
                    key: ANNIVERSARY_FILTER.TRASH,
                    label: "回收站",
                    href: buildHref({ filter: ANNIVERSARY_FILTER.TRASH, category: categoryFilterCanonical }),
                  },
                ]}
                currentValue={filter}
                layoutId="anniversary-filter"
              />
            </div>

            {distinctCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-hide">
                <span className="text-muted shrink-0 mr-1">类型</span>
                <Link
                  href={buildHref({ filter, category: null })}
                  className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${
                    !categoryFilterCanonical
                      ? "bg-brand-primary/10 text-brand-primary font-medium"
                      : "bg-surface hover:bg-surface/80 text-secondary"
                  }`}
                >
                  全部
                </Link>
                {distinctCategories.map((name) => (
                  <Link
                    key={name}
                    href={buildHref({ filter, category: name })}
                    className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${
                      categoryFilterCanonical === name
                        ? "bg-brand-primary/10 text-brand-primary font-medium"
                        : "bg-surface hover:bg-surface/80 text-secondary"
                    }`}
                  >
                    {getAnniversaryCategoryLabel(name)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <AnniversaryList filter={filter} items={items} />

          {items.length === 0 && (
            <EmptyState
                title={filter === ANNIVERSARY_FILTER.TRASH ? "回收站为空" : "记录第一个纪念日"}
                description={
                  filter === ANNIVERSARY_FILTER.TRASH
                    ? "你的回收站很干净。"
                    : "生日、结婚、重要节日…公历或农历都可以；每年自动计算下一次、按需提前提醒。"
                }
                action={
                  filter === ANNIVERSARY_FILTER.TRASH ? undefined : (
                    <Link
                      href={buildCreateModalHref(ROUTES.anniversaries)}
                      className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                    >
                      添加纪念日
                    </Link>
                  )
                }
              />
          )}
        </section>
      </main>
    </div>
  );
}
