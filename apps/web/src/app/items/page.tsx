import { and, asc, desc, eq, ne, isNotNull } from "drizzle-orm";
import Link from "next/link";

import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { ItemCreateForm } from "@/app/_components/items/ItemCreateForm";
import { EmptyState } from "@/app/_components/EmptyState";
import { createItem, deleteItem, setItemStatus } from "@/app/_actions/items";
import { AppHeader } from "@/app/_components/AppHeader";
import { diffDays, formatDateString, getDatePartsInTimeZone, parseDateString } from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { items } from "@/server/db/schema";

export const dynamic = "force-dynamic";

type ItemFilter = "active" | "using" | "idle" | "retired" | "all";

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

function parseFilter(raw: string | null): ItemFilter {
  if (raw === "active") return "active";
  if (raw === "using") return "using";
  if (raw === "idle") return "idle";
  if (raw === "retired") return "retired";
  if (raw === "all") return "all";
  return "active";
}



function formatMoneyCents(priceCents: number, currency: string): string {
  const value = priceCents / 100;
  try {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function computeDaysUsed(purchasedDate: string | null, today: string): number | null {
  if (!purchasedDate) return null;
  if (!parseDateString(purchasedDate)) return null;
  const diff = diffDays(purchasedDate, today);
  if (diff === null) return null;
  if (diff < 0) return null;
  return diff + 1;
}

const statusLabel = {
  using: "使用中",
  idle: "闲置",
  retired: "淘汰",
} as const;

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  /* imports need updatin but replace_file_content handles the block... wait, I need to update imports first or I can do it all in one go if I rewrite the top file? No, I'll update imports separately. */
  /* Actually, I will update the logic block first. */

  const params = (await searchParams) ?? {};
  const filter = parseFilter(getParam(params, "filter"));
  const categoryFilter = getParam(params, "category");

  /* Helper to preserve other params */
  const buildHref = (f: ItemFilter, c: string | null) => {
    const p = new URLSearchParams();
    if (f !== "active") p.set("filter", f);
    if (c) p.set("category", c);
    return p.toString().length > 0 ? `/items?${p.toString()}` : "/items";
  };
  const href = buildHref(filter, categoryFilter);
  // We need to pass this buildHref logic to the view, or pre-calculate links.

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const today = formatDateString(getDatePartsInTimeZone(new Date(), timeZone));

  // Base filter condition
  const statusCondition =
    filter === "active"
      ? ne(items.status, "retired")
      : filter === "using"
        ? eq(items.status, "using")
        : filter === "idle"
          ? eq(items.status, "idle")
          : filter === "retired"
            ? eq(items.status, "retired")
            : undefined;

  // Category condition
  const categoryCondition = categoryFilter ? eq(items.category, categoryFilter) : undefined;

  // Combine conditions
  const where = statusCondition && categoryCondition
    ? and(statusCondition, categoryCondition)
    : statusCondition || categoryCondition;

  const rows = await db.select().from(items).where(where || undefined).orderBy(asc(items.status), desc(items.createdAt));

  // Fetch unique categories for active items (or all items?) - let's fetch from all non-retired to be useful
  const distinctCategories = await db
    .selectDistinct({ name: items.category })
    .from(items)
    .where(and(isNotNull(items.category), ne(items.category, "")))
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

        <section className="mb-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <ItemCreateForm />
        </section>

        <section className="rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-medium">列表</h2>
              <p className="mt-1 text-xs text-secondary">
                日均成本 = 总价 / 已使用天数（按 {timeZone} 的日期计算）。
              </p>
            </div>

            <nav className="flex flex-wrap gap-2 text-xs">
              {(
                [
                  { key: "active", label: "进行中" },
                  { key: "using", label: "使用中" },
                  { key: "idle", label: "闲置" },
                  { key: "retired", label: "淘汰" },
                  { key: "all", label: "全部" },
                ] as const
              ).map((t) => (
                <Link
                  key={t.key}
                  href={buildHref(t.key, categoryFilter)}
                  className={[
                    "rounded-lg border px-3 py-2 active-press",
                    filter === t.key
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-default hover:bg-interactive-hover",
                  ].join(" ")}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Category Filter Tags */}
          {distinctCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-3">
              <Link
                href={buildHref(filter, null)}
                className={[
                  "rounded-full px-3 py-1 text-[11px] font-medium transition-colors active-press",
                  !categoryFilter
                    ? "bg-brand-primary text-inverted"
                    : "bg-surface text-secondary hover:bg-interactive-hover",
                ].join(" ")}
              >
                全部
              </Link>
              {distinctCategories.map((c) => (
                <Link
                  key={c.name}
                  href={buildHref(filter, c.name)}
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-medium transition-colors active-press",
                    categoryFilter === c.name
                      ? "bg-brand-primary text-inverted"
                      : "bg-surface text-secondary hover:bg-interactive-hover",
                  ].join(" ")}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}


          {rows.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="还没有物品"
                description="点击上方添加按钮，记录你的物品成本与价值。"
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {rows.map((it, index) => {
                const daysUsed = computeDaysUsed(it.purchasedDate, today);
                const dailyCents =
                  typeof it.priceCents === "number" && typeof daysUsed === "number" && daysUsed > 0
                    ? Math.round(it.priceCents / daysUsed)
                    : null;
                const staggerClass = index < 5 ? `stagger-${index + 1}` : "";

                return (
                  <div
                    key={it.id}
                    className={`flex flex-col justify-between rounded-xl border border-default bg-elevated p-3 shadow-sm hover-float animate-slide-up ${staggerClass}`}
                  >
                    <div className="mb-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-secondary">
                        <span className="rounded-md border border-divider bg-surface px-2 py-0.5">
                          {statusLabel[it.status]}
                        </span>
                        {it.category ? (
                          <span className="text-secondary">
                            {it.category}
                          </span>
                        ) : null}
                      </div>

                      <Link
                        href={`/items/${it.id}`}
                        className="block truncate text-base font-semibold text-primary hover:underline"
                        title={it.name}
                      >
                        {it.name}
                      </Link>

                      <div className="mt-2 space-y-1 text-xs text-muted">
                        {it.purchasedDate ? <div>购入 {it.purchasedDate}</div> : null}
                        {typeof it.priceCents === "number" ? (
                          <div>
                            总价 {formatMoneyCents(it.priceCents, it.currency)}
                          </div>
                        ) : null}
                        {dailyCents !== null ? (
                          <div>
                            日均 {formatMoneyCents(dailyCents, it.currency)}
                            {typeof daysUsed === "number" ? `（${daysUsed} 天）` : ""}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-divider pt-3">
                      {it.status === "using" ? (
                        <>
                          <form action={setItemStatus}>
                            <input type="hidden" name="id" value={it.id} />
                            <input type="hidden" name="status" value="idle" />
                            <input type="hidden" name="redirectTo" value={href} />
                            <button
                              type="submit"
                              className="h-8 rounded-md border border-default px-2 text-[11px] font-medium hover:bg-interactive-hover active-press"
                            >
                              闲置
                            </button>
                          </form>
                          <form action={setItemStatus}>
                            <input type="hidden" name="id" value={it.id} />
                            <input type="hidden" name="status" value="retired" />
                            <input type="hidden" name="redirectTo" value={href} />
                            <button
                              type="submit"
                              className="h-8 rounded-md border border-default px-2 text-[11px] font-medium hover:bg-interactive-hover active-press"
                            >
                              淘汰
                            </button>
                          </form>
                        </>
                      ) : it.status === "idle" ? (
                        <>
                          <form action={setItemStatus}>
                            <input type="hidden" name="id" value={it.id} />
                            <input type="hidden" name="status" value="using" />
                            <input type="hidden" name="redirectTo" value={href} />
                            <button
                              type="submit"
                              className="h-8 rounded-md border border-default px-2 text-[11px] font-medium hover:bg-interactive-hover active-press"
                            >
                              使用中
                            </button>
                          </form>
                          <form action={setItemStatus}>
                            <input type="hidden" name="id" value={it.id} />
                            <input type="hidden" name="status" value="retired" />
                            <input type="hidden" name="redirectTo" value={href} />
                            <button
                              type="submit"
                              className="h-8 rounded-md border border-default px-2 text-[11px] font-medium hover:bg-interactive-hover active-press"
                            >
                              淘汰
                            </button>
                          </form>
                        </>
                      ) : (
                        <form action={setItemStatus}>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="status" value="using" />
                          <input type="hidden" name="redirectTo" value={href} />
                          <button
                            type="submit"
                            className="h-8 rounded-md border border-default px-2 text-[11px] font-medium hover:bg-interactive-hover active-press"
                          >
                            恢复
                          </button>
                        </form>
                      )}

                      <Link
                        href={`/items/${it.id}`}
                        className="flex h-8 items-center rounded-md border border-default px-2 text-[11px] font-medium hover:bg-interactive-hover active-press"
                      >
                        查看
                      </Link>

                      <form action={deleteItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="redirectTo" value={href} />
                        <ConfirmSubmitButton
                          confirmMessage="确定删除这个物品吗？此操作不可撤销。"
                          className="h-8 rounded-md border border-danger/30 px-2 text-[11px] font-medium text-danger hover:bg-danger hover:text-danger-foreground active-press"
                        >
                          删除
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
