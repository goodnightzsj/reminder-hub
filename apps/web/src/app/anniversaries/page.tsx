import Link from "next/link";

import { AppHeader } from "@/app/_components/AppHeader";
import { CreateModal } from "@/app/_components/CreateModal";
import { EmptyState } from "@/app/_components/EmptyState";
import { SegmentedControl } from "@/app/_components/SegmentedControl";
import { AnniversaryCreateForm } from "@/app/_components/anniversary/AnniversaryCreateForm";
import { AnniversaryList } from "@/app/_components/anniversary/AnniversaryList";
import { canonicalizeAnniversaryCategory, getAnniversaryCategoryLabel } from "@/lib/anniversary";
import { getSearchParamString, type SearchParams } from "@/lib/search-params";
import { buildAnniversariesHref as buildHref, CATEGORY_QUERY_KEY, FILTER_QUERY_KEY } from "@/lib/url";

import { ANNIVERSARY_FILTER, parseAnniversaryFilter } from "./_lib/anniversary-filters";
import { getAnniversariesPageData } from "./_lib/anniversaries-page-data";

export const dynamic = "force-dynamic";

type AnniversariesPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function AnniversariesPage({ searchParams }: AnniversariesPageProps) {
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

          {items.length === 0 && filter === ANNIVERSARY_FILTER.TRASH && (
            <div className="border-t border-divider">
              <EmptyState title="回收站为空" description="你的回收站很干净。" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
