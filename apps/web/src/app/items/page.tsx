import { and, asc, desc, eq, ne, isNotNull, isNull, isNotNull as isNotNull_alias, type SQL } from "drizzle-orm"; // Avoid conflict if any, but they are distinct

import { SegmentedControl } from "@/app/_components/SegmentedControl";

import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { ItemCreateForm } from "@/app/_components/items/ItemCreateForm";
import { ItemList } from "@/app/_components/items/ItemList";
import { EmptyState } from "@/app/_components/EmptyState";
import { CreateModal } from "@/app/_components/CreateModal";
import { createItem, deleteItem, setItemStatus } from "@/app/_actions/items";
import { AppHeader } from "@/app/_components/AppHeader";
import { diffDays, formatDateString, getDatePartsInTimeZone, parseDateString } from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { items } from "@/server/db/schema";

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

  let statusCondition: any = undefined;

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
          description={
            <>
              v0.3：物品 CRUD + 日均成本（按时区 <code className="font-mono">{timeZone}</code>{" "}
              计算）。
            </>
          }
        />



        {/* Mobile Create Modal */}
        <CreateModal title="新建物品">
          <ItemCreateForm className="" />
        </CreateModal>

        <section className="rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-medium">列表</h2>
              <p className="mt-1 text-xs text-secondary">
                日均成本 = 总价 / 已使用天数（按 {timeZone} 的日期计算）。
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

          {/* Category Filter SegmentedControl */}
          {distinctCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-divider pt-3 text-xs">
              <span className="text-muted">分类</span>
              <SegmentedControl
                options={[
                  { key: "all", label: "全部", href: buildHref(filter, null) },
                  ...distinctCategories.map((c) => ({
                    key: c.name!,
                    label: c.name!,
                    href: buildHref(filter, c.name),
                  }))
                ]}
                currentValue={categoryFilter ?? "all"}
                layoutId="item-category-filter"
              />
            </div>
          )}


          <ItemList
            items={rows.map((it) => {
              const daysUsed = computeDaysUsed(it.purchasedDate, today);
              const dailyCents =
                typeof it.priceCents === "number" && typeof daysUsed === "number" && daysUsed > 0
                  ? Math.round(it.priceCents / daysUsed)
                  : null;
              return { item: it, daysUsed, dailyCents };
            })}
            filter={filter}
          />

          {rows.length === 0 && (
            <div className="mt-4">
              <EmptyState
                title={
                  filter === "trash"
                    ? "回收站为空"
                    : "还没有物品"
                }
                description={
                  filter === "trash"
                    ? "你的回收站很干净。"
                    : "点击上方添加按钮，记录你的物品成本与价值。"
                }
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
