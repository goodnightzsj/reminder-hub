import { and, asc, desc, eq, ne, isNotNull, isNull, isNotNull as isNotNull_alias, type SQL } from "drizzle-orm"; // Avoid conflict if any, but they are distinct

import { SegmentedControl } from "@/app/_components/SegmentedControl";

import { ItemCreateForm } from "@/app/_components/items/ItemCreateForm";
import { ItemList } from "@/app/_components/items/ItemList";
import { EmptyState } from "@/app/_components/EmptyState";
import { CreateModal } from "@/app/_components/CreateModal";
import { AppHeader } from "@/app/_components/AppHeader";
import { diffDays, formatDateString, getDatePartsInTimeZone, parseDateString } from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { items } from "@/server/db/schema";

import Link from "next/link";
import { Icons } from "@/app/_components/Icons";

export const dynamic = "force-dynamic";




type ItemsPageProps = {
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

function computeDaysUsed(purchasedDate: string | null, today: string): number | null {
  if (!purchasedDate) return null;
  const diff = diffDays(purchasedDate, today);
  if (diff === null) return null;
  if (diff < 0) return null;
  return diff + 1;
}

type ItemFilter = "active" | "using" | "idle" | "retired" | "all" | "trash";

function parseFilter(raw: string | null): ItemFilter {
  if (raw === "active") return "active";
  if (raw === "using") return "using";
  if (raw === "idle") return "idle";
  if (raw === "retired") return "retired";
  if (raw === "all") return "all";
  if (raw === "trash") return "trash";
  return "using";
}

// ... 

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  // ... imports logic check

  const params = (await searchParams) ?? {};
  const filter = parseFilter(getParam(params, "filter"));
  const categoryFilter = getParam(params, "category");

  const buildHref = (f: ItemFilter, c: string | null) => {
    const p = new URLSearchParams();
    if (f !== "using") p.set("filter", f);
    if (c) p.set("category", c);
    return p.toString().length > 0 ? `/items?${p.toString()}` : "/items";
  };
  const href = buildHref(filter, categoryFilter);

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const today = formatDateString(getDatePartsInTimeZone(new Date(), timeZone));

  // Base filter condition
  const baseWhere =
    filter === "trash"
      ? isNotNull(items.deletedAt)
      : isNull(items.deletedAt);

  let statusCondition: SQL | undefined = undefined;

  if (filter === "active") {
    statusCondition = ne(items.status, "retired");
  } else if (filter === "using") {
    statusCondition = eq(items.status, "using");
  } else if (filter === "idle") {
    statusCondition = eq(items.status, "idle");
  } else if (filter === "retired") {
    statusCondition = eq(items.status, "retired");
  }

  // Combine with baseWhere
  let combinedWhere: SQL | undefined = baseWhere;
  if (statusCondition) {
    combinedWhere = and(baseWhere, statusCondition);
  }

  // Category condition
  const categoryCondition = categoryFilter ? eq(items.category, categoryFilter) : undefined;

  // Final Where
  let finalWhere: SQL | undefined = combinedWhere;
  if (categoryCondition) {
    finalWhere = and(finalWhere, categoryCondition);
  }

  // 废纸篓：按删除时间升序（先删除的在上面）
  const orderByClause = filter === "trash"
    ? [asc(items.deletedAt)]
    : [asc(items.status), desc(items.createdAt)];

  const rows = await db.select().from(items).where(finalWhere).orderBy(...orderByClause);

  // Build base where for categories (exclude category filter itself)
  const categoryBasePredicates = [];
  if (filter === "using") {
    categoryBasePredicates.push(isNull(items.deletedAt), eq(items.status, "using"));
  } else if (filter === "idle") {
    categoryBasePredicates.push(isNull(items.deletedAt), eq(items.status, "idle"));
  } else if (filter === "retired") {
    categoryBasePredicates.push(isNull(items.deletedAt), eq(items.status, "retired"));
  } else if (filter === "trash") {
    categoryBasePredicates.push(isNotNull(items.deletedAt));
  } else {
    // Fallback or "all" (if it existed)
    categoryBasePredicates.push(isNull(items.deletedAt));
  }
  const categoryBaseWhere = and(...categoryBasePredicates);

  const distinctCategories = await db
    .selectDistinct({ name: items.category })
    .from(items)
    .where(and(isNotNull(items.category), ne(items.category, ""), categoryBaseWhere))
    .orderBy(items.category);


  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="物品"
        />



        {/* Mobile Create Modal */}
        <CreateModal title="新建物品">
          <ItemCreateForm className="" />
        </CreateModal>

        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            {/* Primary Filters (Segmented) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">

                <p className="text-xs text-muted-foreground">
                  日均成本 = 总价 / 已使用天数
                </p>
              </div>
              <SegmentedControl
                options={[
                  { key: "using", label: "使用中", href: buildHref("using", categoryFilter) },
                  { key: "idle", label: "闲置", href: buildHref("idle", categoryFilter) },
                  { key: "retired", label: "淘汰", href: buildHref("retired", categoryFilter) },
                  { key: "trash", label: "回收站", href: buildHref("trash", categoryFilter) },
                ]}
                currentValue={filter}
                layoutId="item-filter"
              />
            </div>

            {/* Secondary Filters (Categories) & Tags */}
            {distinctCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 text-xs scrollbar-hide">
                <Link
                  href={buildHref(filter, null)}
                  className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${!categoryFilter
                    ? "bg-brand-primary/10 text-brand-primary font-medium"
                    : "bg-surface hover:bg-surface/80 text-secondary"
                    }`}
                >
                  全部
                </Link>
                {distinctCategories.map((c) => (
                  <Link
                    key={c.name}
                    href={buildHref(filter, c.name)}
                    className={`inline-flex items-center rounded-full px-3 py-1 transition-colors ${categoryFilter === c.name
                      ? "bg-brand-primary/10 text-brand-primary font-medium"
                      : "bg-surface hover:bg-surface/80 text-secondary"
                      }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>


          <ItemList
            items={rows.map((it) => {
              const dateToUse = it.purchasedDate ?? formatDateString(getDatePartsInTimeZone(it.createdAt, timeZone));
              const daysUsed = computeDaysUsed(dateToUse, today);
              const dailyCents =
                typeof it.priceCents === "number" && typeof daysUsed === "number" && daysUsed > 0
                  ? Math.round(it.priceCents / daysUsed)
                  : null;
              return { item: it, daysUsed, dailyCents };
            })}
            filter={filter}
          />

          {rows.length === 0 && (filter === "trash" || filter === "retired" || filter === "idle") && (
            <div className="mt-4">
              <EmptyState
                title={
                  filter === "trash"
                    ? "回收站为空"
                    : filter === "retired" ? "暂无淘汰记录" : "还没有闲置物品"
                }
                description={
                  filter === "trash"
                    ? "你的回收站很干净。"
                    : "这里空空如也。"
                }
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
