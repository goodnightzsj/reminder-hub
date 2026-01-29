import Link from "next/link";

import { AppHeader } from "../_components/layout/AppHeader";
import { CreateModal } from "../_components/modals/CreateModal";
import { EmptyState } from "../_components/shared/EmptyState";
import { SegmentedControl } from "@/app/_components/SegmentedControl";
import { ItemCreateForm } from "@/app/_components/items/ItemCreateForm";
import { ItemList } from "@/app/_components/items/ItemList";
import { getSearchParamString, type SearchParams } from "@/lib/search-params";
import { buildItemsHref as buildHref, CATEGORY_QUERY_KEY, FILTER_QUERY_KEY } from "@/lib/url";

import { ITEM_FILTER, parseItemFilter } from "./_lib/item-filters";
import { getItemsPageData } from "./_lib/items-page-data";

export const dynamic = "force-dynamic";

type ItemsPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseItemFilter(getSearchParamString(params, FILTER_QUERY_KEY));
  const categoryFilter = getSearchParamString(params, CATEGORY_QUERY_KEY);

  const { items, distinctCategories } = await getItemsPageData({ filter, categoryFilter });

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader title="物品" />

        <CreateModal title="新建物品">
          <ItemCreateForm className="" />
        </CreateModal>

        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">日均成本 = 总价 / 已使用天数</p>
              </div>
              <SegmentedControl
                options={[
                  {
                    key: ITEM_FILTER.USING,
                    label: "使用中",
                    href: buildHref(ITEM_FILTER.USING, categoryFilter),
                  },
                  { key: ITEM_FILTER.IDLE, label: "闲置", href: buildHref(ITEM_FILTER.IDLE, categoryFilter) },
                  {
                    key: ITEM_FILTER.RETIRED,
                    label: "淘汰",
                    href: buildHref(ITEM_FILTER.RETIRED, categoryFilter),
                  },
                  {
                    key: ITEM_FILTER.TRASH,
                    label: "回收站",
                    href: buildHref(ITEM_FILTER.TRASH, categoryFilter),
                  },
                ]}
                currentValue={filter}
                layoutId="item-filter"
              />
            </div>

            {distinctCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-hide">
                <Link
                  href={buildHref(filter, null)}
                  className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${
                    !categoryFilter
                      ? "bg-brand-primary/10 text-brand-primary font-medium"
                      : "bg-surface hover:bg-surface/80 text-secondary"
                  }`}
                >
                  全部
                </Link>
                {distinctCategories.map((category) => (
                  <Link
                    key={category}
                    href={buildHref(filter, category)}
                    className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${
                      categoryFilter === category
                        ? "bg-brand-primary/10 text-brand-primary font-medium"
                        : "bg-surface hover:bg-surface/80 text-secondary"
                    }`}
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <ItemList items={items} filter={filter} />

          {items.length === 0 &&
            (filter === ITEM_FILTER.TRASH || filter === ITEM_FILTER.RETIRED || filter === ITEM_FILTER.IDLE) && (
              <div className="mt-4">
                <EmptyState
                  title={
                    filter === ITEM_FILTER.TRASH
                      ? "回收站为空"
                      : filter === ITEM_FILTER.RETIRED
                        ? "暂无淘汰记录"
                        : "还没有闲置物品"
                  }
                  description={filter === ITEM_FILTER.TRASH ? "你的回收站很干净。" : "这里空空如也。"}
                />
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
