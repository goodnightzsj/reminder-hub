import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/app/_components/ui/Badge";
import { SmartCategoryBadge } from "../../_components/shared/SmartCategoryBadge";
import { Button } from "@/app/_components/ui/Button";
import { Input } from "@/app/_components/ui/Input";
import { Select } from "@/app/_components/ui/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { IconCalendar, IconChevronLeft, IconHash, IconTrendingDown, IconWallet } from "@/app/_components/Icons";
import { PageBackgroundDecoration } from "../../_components/layout/PageBackgroundDecoration";
import { deleteItem, setItemStatus, updateItem } from "@/app/_actions/items";
import { formatCurrencyCents } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import {
  getItemStatusLabel,
  itemCategoryOptions,
  itemCurrencyOptions,
  itemStatusOptions,
} from "@/lib/items";

import { getItemDetailPageData } from "./_lib/item-detail";
import { getItemStatusBadgeVariant, ITEM_STATUS_ACTIONS } from "./_lib/item-status";

export const dynamic = "force-dynamic";

type ItemDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;

  const data = await getItemDetailPageData(id);
  if (!data) notFound();

  const { item, daysUsed, dailyCents, costPerUseCents, targetReached, itemDetailHref } = data;

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      {/* 背景装饰 */}
      <PageBackgroundDecoration />

      <main className="relative mx-auto max-w-4xl p-0 sm:p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-divider bg-base/80 p-4 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.items}
              className="group flex items-center justify-center p-2 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <IconChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
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
          {/* 状态概览 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-4 rounded-xl border border-default bg-surface/50 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={getItemStatusBadgeVariant(item.status)}
                >
                  {getItemStatusLabel(item.status)}
                </Badge>
                {item.category && (
                  <SmartCategoryBadge>
                    {item.category}
                  </SmartCategoryBadge>
                )}
                {targetReached && <Badge variant="success">已达成目标</Badge>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {ITEM_STATUS_ACTIONS[item.status].map((action) => (
                  <form key={action.nextStatus} action={setItemStatus}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={action.nextStatus} />
                    <input type="hidden" name="redirectTo" value={itemDetailHref} />
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                      {action.label}
                    </Button>
                  </form>
                ))}

                <form action={deleteItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="redirectTo" value={ROUTES.items} />
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
              <span className="text-xs text-muted flex items-center gap-1"><IconCalendar className="h-3 w-3" /> 购入日期</span>
              <div>
                <div className="text-lg font-semibold font-mono">{item.purchasedDate ?? "未填写"}</div>
                {typeof daysUsed === "number" && (
                  <div className="text-xs text-muted">已使用 {daysUsed} 天</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted flex items-center gap-1"><IconWallet className="h-3 w-3" /> 总价</span>
              <div className="text-lg font-semibold font-mono">
                {typeof item.priceCents === "number" ? formatCurrencyCents(item.priceCents, item.currency) : "未设置"}
              </div>
            </div>

            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-brand-primary flex items-center gap-1"><IconTrendingDown className="h-3 w-3" /> 日均成本</span>
              <div className="text-lg font-semibold font-mono text-brand-primary">
                {dailyCents !== null ? formatCurrencyCents(dailyCents, item.currency) : "-"}
              </div>
            </div>

            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted flex items-center gap-1"><IconHash className="h-3 w-3" /> 使用次数</span>
              <div>
                <div className="text-lg font-semibold font-mono">{item.usageCount}</div>
                {costPerUseCents !== null && (
                  <div className="text-xs text-muted">次均 {formatCurrencyCents(costPerUseCents, item.currency)}</div>
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
                    options={itemCategoryOptions}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">状态</label>
                  <Select name="status" defaultValue={item.status} className="h-10 bg-base/50">
                    {itemStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
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
                    options={itemCurrencyOptions}
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
