import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/app/_components/Badge";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { deleteItem, setItemStatus, updateItem } from "@/app/_actions/items";
import { diffDays, formatDateString, getDatePartsInTimeZone, parseDateString } from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { items } from "@/server/db/schema";

export const dynamic = "force-dynamic";

type ItemDetailPageProps = {
  params: Promise<{ id: string }>;
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

export default async function ItemDetailPage({ params, searchParams }: ItemDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const saved = getParam(query, "saved");

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const today = formatDateString(getDatePartsInTimeZone(new Date(), timeZone));

  const rows = await db.select().from(items).where(eq(items.id, id)).limit(1);
  const item = rows[0];
  if (!item) notFound();

  const daysUsed = computeDaysUsed(item.purchasedDate, today);
  const dailyCents =
    typeof item.priceCents === "number" && typeof daysUsed === "number" && daysUsed > 0
      ? Math.round(item.priceCents / daysUsed)
      : null;

  const costPerUseCents =
    typeof item.priceCents === "number" && item.usageCount > 0
      ? Math.round(item.priceCents / item.usageCount)
      : null;

  const targetReached =
    typeof item.targetDailyCostCents === "number" &&
    typeof dailyCents === "number" &&
    dailyCents <= item.targetDailyCostCents;

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-2xl p-6 sm:p-10">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              物品详情
            </h1>
            <p className="mt-1 text-sm text-secondary">
              日均成本按 <code className="font-mono">{timeZone}</code> 的日期口径实时计算。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/items"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              返回
            </Link>
            <Link
              href="/dashboard"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              仪表盘
            </Link>
            <Link
              href="/"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              Todo
            </Link>
            <Link
              href="/anniversaries"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              纪念日
            </Link>
            <Link
              href="/subscriptions"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              订阅
            </Link>
            <Link
              href="/search"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              搜索
            </Link>
            <Link
              href="/settings"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              设置
            </Link>
          </div>
        </header>

        {saved ? (
          <div className="mb-4 rounded-xl border border-success bg-success p-3 text-sm text-success">
            已保存。
          </div>
        ) : null}

        <section className="mb-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-medium text-secondary">
                <Badge>
                  {statusLabel[item.status]}
                </Badge>
                {item.category ? (
                  <Badge variant="outline">{item.category}</Badge>
                ) : null}
              </div>
              <div className="truncate text-lg font-semibold">{item.name}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {item.status === "using" ? (
                <>
                  <form action={setItemStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value="idle" />
                    <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-9 active-press"
                    >
                      闲置
                    </Button>
                  </form>
                  <form action={setItemStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value="retired" />
                    <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-9 active-press"
                    >
                      淘汰
                    </Button>
                  </form>
                </>
              ) : item.status === "idle" ? (
                <>
                  <form action={setItemStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value="using" />
                    <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-9 active-press"
                    >
                      使用中
                    </Button>
                  </form>
                  <form action={setItemStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value="retired" />
                    <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-9 active-press"
                    >
                      淘汰
                    </Button>
                  </form>
                </>
              ) : (
                <form action={setItemStatus}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="status" value="using" />
                  <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="h-9 active-press"
                  >
                    恢复
                  </Button>
                </form>
              )}

              <form action={deleteItem}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="redirectTo" value="/items" />
                <ConfirmSubmitButton
                  confirmMessage="确定删除这个物品吗？此操作不可撤销。"
                  className="h-9 rounded-lg border border-divider px-3 text-xs font-medium text-danger hover:bg-danger/10 dark:text-danger dark:hover:bg-danger/20 active-press"
                >
                  删除
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-divider bg-surface p-3 text-xs text-secondary">
            <div className="flex flex-wrap items-center gap-2">
              {item.purchasedDate ? (
                <span>
                  购入日：<span className="font-medium text-primary">{item.purchasedDate}</span>
                </span>
              ) : (
                <span>购入日：未填写</span>
              )}
              {typeof daysUsed === "number" ? (
                <span>· 已使用 {daysUsed} 天</span>
              ) : null}
              {typeof item.priceCents === "number" ? (
                <span>
                  · 总价 {formatMoneyCents(item.priceCents, item.currency)}
                </span>
              ) : null}
              {dailyCents !== null ? (
                <span>
                  · 日均 {formatMoneyCents(dailyCents, item.currency)}
                </span>
              ) : null}
              {costPerUseCents !== null ? (
                <span>
                  · 次均 {formatMoneyCents(costPerUseCents, item.currency)}
                </span>
              ) : null}
              {typeof item.targetDailyCostCents === "number" ? (
                <span>
                  · 目标日均 {formatMoneyCents(item.targetDailyCostCents, item.currency)}
                </span>
              ) : null}
              {targetReached ? (
                <Badge variant="success">已达成</Badge>
              ) : null}
            </div>
            <div className="mt-2 text-muted">
              使用次数：<span className="font-medium text-primary">{item.usageCount}</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <h2 className="text-sm font-medium">编辑</h2>

          <form action={updateItem} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="id" value={item.id} />

            <label className="flex flex-col gap-1 text-xs text-secondary">
              名称
              <Input
                name="name"
                defaultValue={item.name}
                required
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-secondary">
                购入日期
                <Input
                  type="date"
                  name="purchasedDate"
                  defaultValue={item.purchasedDate ?? ""}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                类别
                <Input
                  name="category"
                  defaultValue={item.category ?? ""}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                价格
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  name="price"
                  defaultValue={
                    typeof item.priceCents === "number"
                      ? (item.priceCents / 100).toString()
                      : ""
                  }
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                币种
                <Input
                  name="currency"
                  defaultValue={item.currency}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                状态
                <Select
                  name="status"
                  defaultValue={item.status}
                >
                  <option value="using">使用中</option>
                  <option value="idle">闲置</option>
                  <option value="retired">淘汰</option>
                </Select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                使用次数
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  name="usageCount"
                  defaultValue={item.usageCount}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
                目标日均成本（可选）
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  name="targetDailyCost"
                  defaultValue={
                    typeof item.targetDailyCostCents === "number"
                      ? (item.targetDailyCostCents / 100).toString()
                      : ""
                  }
                />
              </label>
            </div>

            <Button
              type="submit"
              variant="secondary"
              className="self-start"
            >
              保存
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
