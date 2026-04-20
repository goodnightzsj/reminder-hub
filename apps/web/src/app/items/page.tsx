import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "../_components/layout/AppHeader";
import { CreateModal } from "../_components/modals/CreateModal";
import { EmptyState } from "../_components/shared/EmptyState";
import { SegmentedControl } from "@/app/_components/SegmentedControl";
import { ItemCreateForm } from "@/app/_components/items/ItemCreateForm";
import { ItemList } from "@/app/_components/items/ItemList";
import { getSearchParamString, type SearchParams } from "@/lib/search-params";
import { buildItemsHref as buildHref, buildCreateModalHref, CATEGORY_QUERY_KEY, FILTER_QUERY_KEY } from "@/lib/url";
import { ROUTES } from "@/lib/routes";

import { ITEM_FILTER, parseItemFilter } from "./_lib/item-filters";
import { getItemsPageData } from "./_lib/items-page-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "物品",
  description: "记录物品状态、使用频次、成本表现与分类信息。",
};

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

          {items.length === 0 && (
            <EmptyState
                title={
                  filter === ITEM_FILTER.TRASH
                    ? "回收站为空"
                    : filter === ITEM_FILTER.RETIRED
                      ? "暂无淘汰记录"
                      : filter === ITEM_FILTER.IDLE
                        ? "没有闲置物品"
                        : "登记第一件物品"
                }
                description={
                  filter === ITEM_FILTER.TRASH
                    ? "你的回收站很干净。"
                    : filter === ITEM_FILTER.RETIRED
                      ? "已淘汰的物品会出现在这里。"
                      : filter === ITEM_FILTER.IDLE
                        ? "切换到\"使用中\"看看正在用的物品。"
                        : "记录购入价格与使用次数，自动算出日均成本，帮你评估每件东西真正值不值。"
                }
                action={
                  filter === ITEM_FILTER.USING ? (
                    <Link
                      href={buildCreateModalHref(ROUTES.items)}
                      className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                    >
                      添加物品
                    </Link>
                  ) : undefined
                }
              />
          )}
        </section>
      </main>
    </div>
  );
}
