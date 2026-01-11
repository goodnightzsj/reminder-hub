import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, getBadgeVariantFromLabel } from "@/app/_components/Badge";
import { SmartCategoryBadge } from "@/app/_components/SmartCategoryBadge";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { Icons } from "@/app/_components/Icons";
import { ExpandableSearch } from "@/app/_components/ExpandableSearch";
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
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/5 rounded-full blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-4xl p-0 sm:p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-divider bg-base/80 p-4 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-4">
            <Link
              href="/items"
              className="group flex items-center justify-center p-2 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <Icons.ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-primary">编辑物品</h1>
              <span className="text-xs text-muted font-mono">ID: {item.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="item-edit-form"
              className="h-9 px-4 rounded-lg bg-brand-primary text-xs font-medium text-white shadow-sm hover:bg-brand-primary/90 transition-all active:scale-95"
            >
              保存
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 animate-slide-up stagger-1 space-y-8">
          {saved ? (
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success animate-slide-up">
              ✓ 已保存修改
            </div>
          ) : null}

          {/* 状态概览 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-4 rounded-xl border border-default bg-surface/50 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    item.status === 'using' ? 'success' :
                      item.status === 'retired' ? 'danger' : 'default'
                  }
                >
                  {statusLabel[item.status]}
                </Badge>
                {item.category && (
                  <SmartCategoryBadge>
                    {item.category}
                  </SmartCategoryBadge>
                )}
                {targetReached && <Badge variant="success">已达成目标</Badge>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {item.status === "using" ? (
                  <>
                    <form action={setItemStatus}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="status" value="idle" />
                      <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                      <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                        闲置
                      </Button>
                    </form>
                    <form action={setItemStatus}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="status" value="retired" />
                      <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                      <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
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
                      <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                        使用中
                      </Button>
                    </form>
                    <form action={setItemStatus}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="status" value="retired" />
                      <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                      <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                        淘汰
                      </Button>
                    </form>
                  </>
                ) : (
                  <form action={setItemStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value="using" />
                    <input type="hidden" name="redirectTo" value={`/items/${item.id}`} />
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                      恢复使用
                    </Button>
                  </form>
                )}

                <form action={deleteItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="redirectTo" value="/items" />
                  <ConfirmSubmitButton
                    confirmMessage="确定删除这个物品吗？此操作不可撤销。"
                    className="h-8 rounded-lg border border-transparent px-3 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                  >
                    删除
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>

            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted flex items-center gap-1"><Icons.Calendar className="h-3 w-3" /> 购入日期</span>
              <div>
                <div className="text-lg font-semibold font-mono">{item.purchasedDate ?? "未填写"}</div>
                {typeof daysUsed === "number" && (
                  <div className="text-xs text-muted">已使用 {daysUsed} 天</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted flex items-center gap-1"><Icons.Wallet className="h-3 w-3" /> 总价</span>
              <div className="text-lg font-semibold font-mono">
                {typeof item.priceCents === "number" ? formatMoneyCents(item.priceCents, item.currency) : "未设置"}
              </div>
            </div>

            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-brand-primary flex items-center gap-1"><Icons.TrendingDown className="h-3 w-3" /> 日均成本</span>
              <div className="text-lg font-semibold font-mono text-brand-primary">
                {dailyCents !== null ? formatMoneyCents(dailyCents, item.currency) : "-"}
              </div>
            </div>

            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted flex items-center gap-1"><Icons.Hash className="h-3 w-3" /> 使用次数</span>
              <div>
                <div className="text-lg font-semibold font-mono">{item.usageCount}</div>
                {costPerUseCents !== null && (
                  <div className="text-xs text-muted">次均 {formatMoneyCents(costPerUseCents, item.currency)}</div>
                )}
              </div>
            </div>
          </div>

          <form id="item-edit-form" action={updateItem} className="space-y-8">
            <input type="hidden" name="id" value={item.id} />

            <div className="rounded-xl border border-default bg-elevated relative">
              <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary">
                基本信息
              </div>
              <div className="p-4 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-secondary mb-1.5">名称</label>
                  <Input name="name" defaultValue={item.name} required className="h-10 bg-base/50" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">类别</label>
                  <CustomSelect
                    name="category"
                    defaultValue={item.category ?? ""}
                    allowCustom={true}
                    placeholder="输入自定义类别..."
                    className="h-10 bg-base/50"
                    options={[
                      { value: "数码", label: "数码" },
                      { value: "家居", label: "家居" },
                      { value: "衣物", label: "衣物" },
                      { value: "虚拟", label: "虚拟" },
                      { value: "运动", label: "运动" },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">状态</label>
                  <Select name="status" defaultValue={item.status} className="h-10 bg-base/50">
                    <option value="using">使用中</option>
                    <option value="idle">闲置</option>
                    <option value="retired">淘汰</option>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-secondary mb-1.5">购入日期</label>
                  <SmartDateInput type="date" name="purchasedDate" defaultValue={item.purchasedDate ?? ""} className="h-10 bg-base/50" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-default bg-elevated relative">
              <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary">
                成本与统计
              </div>
              <div className="p-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">价格</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    name="price"
                    defaultValue={typeof item.priceCents === "number" ? (item.priceCents / 100).toString() : ""}
                    className="h-10 bg-base/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">币种</label>
                  <CustomSelect
                    name="currency"
                    defaultValue={item.currency}
                    className="h-10 bg-base/50"
                    options={[
                      { value: "CNY", label: "CNY (人民币)" },
                      { value: "USD", label: "USD (美元)" },
                      { value: "JPY", label: "JPY (日元)" },
                      { value: "EUR", label: "EUR (欧元)" },
                      { value: "GBP", label: "GBP (英镑)" },
                      { value: "HKD", label: "HKD (港币)" },
                    ]}
                    placeholder="输入其他..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">使用次数 (Usage Count)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    name="usageCount"
                    defaultValue={item.usageCount}
                    className="h-10 bg-base/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">目标日均成本</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    name="targetDailyCost"
                    defaultValue={typeof item.targetDailyCostCents === "number" ? (item.targetDailyCostCents / 100).toString() : ""}
                    className="h-10 bg-base/50"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
