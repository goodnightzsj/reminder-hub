import Link from "next/link";

import { AppHeader } from "@/app/_components/AppHeader";
import { CreateModal } from "@/app/_components/CreateModal";
import { EmptyState } from "@/app/_components/EmptyState";
import { SegmentedControl } from "@/app/_components/SegmentedControl";
import { getColorClass } from "@/app/_components/SmartCategoryBadge";
import { SubscriptionCreateForm } from "@/app/_components/subscriptions/SubscriptionCreateForm";
import { SubscriptionList } from "@/app/_components/subscriptions/SubscriptionList";
import { getSearchParamString, type SearchParams } from "@/lib/search-params";
import { buildSubscriptionsHref as buildHref, CATEGORY_QUERY_KEY, FILTER_QUERY_KEY } from "@/lib/url";

import { SUBSCRIPTION_FILTER, parseSubscriptionFilter } from "./_lib/subscription-filters";
import { getSubscriptionsPageData } from "./_lib/subscriptions-page-data";

export const dynamic = "force-dynamic";

type SubscriptionsPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function SubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseSubscriptionFilter(getSearchParamString(params, FILTER_QUERY_KEY));
  const categoryFilter = getSearchParamString(params, CATEGORY_QUERY_KEY);

  const { timeZone, dateReminderTime, items, distinctCategories } = await getSubscriptionsPageData({
    filter,
    categoryFilter,
  });

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader title="订阅" />

        <CreateModal title="新建订阅">
          <SubscriptionCreateForm dateReminderTime={dateReminderTime} timeZone={timeZone} className="" />
        </CreateModal>

        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
              <SegmentedControl
                options={[
                  {
                    key: SUBSCRIPTION_FILTER.ACTIVE,
                    label: "进行中",
                    href: buildHref({ filter: SUBSCRIPTION_FILTER.ACTIVE, category: categoryFilter }),
                  },
                  {
                    key: SUBSCRIPTION_FILTER.TRASH,
                    label: "回收站",
                    href: buildHref({ filter: SUBSCRIPTION_FILTER.TRASH, category: categoryFilter }),
                  },
                ]}
                currentValue={filter}
                layoutId="subscription-filter"
              />
            </div>

            {distinctCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-hide">
                <span className="text-muted shrink-0 mr-1">分类</span>
                <Link
                  href={buildHref({ filter, category: null })}
                  className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${
                    !categoryFilter
                      ? "bg-brand-primary/10 text-brand-primary font-medium"
                      : "bg-surface hover:bg-surface/80 text-secondary"
                  }`}
                >
                  全部
                </Link>
                {distinctCategories.map((category) => {
                  const colorClass = getColorClass(category);
                  const isSelected = categoryFilter === category;
                  return (
                    <Link
                      key={category}
                      href={buildHref({ filter, category })}
                      className={`inline-flex items-center rounded-full px-3 py-1 transition-all border ${
                        isSelected
                          ? colorClass
                          : "bg-surface hover:bg-surface/80 text-secondary border-transparent"
                      }`}
                    >
                      {category}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <SubscriptionList items={items} filter={filter} />

          {items.length === 0 && (
            <div className="border-t border-divider">
              <EmptyState
                title={filter === SUBSCRIPTION_FILTER.TRASH ? "回收站为空" : "还没有订阅"}
                description={
                  filter === SUBSCRIPTION_FILTER.TRASH
                    ? "你的回收站很干净。"
                    : "记录你的周期性订阅，在续期日提前提醒。"
                }
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
