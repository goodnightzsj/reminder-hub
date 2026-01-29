import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, getBadgeVariantFromLabel } from "@/app/_components/ui/Badge";
import { Button } from "@/app/_components/ui/Button";
import { Input } from "@/app/_components/ui/Input";
import { SmartDateInput } from "@/app/_components/SmartDateInput";
import { Select } from "@/app/_components/ui/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { Textarea } from "@/app/_components/ui/Textarea";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { Icons } from "@/app/_components/Icons";
import { PageBackgroundDecoration } from "../../_components/layout/PageBackgroundDecoration";
import {
  deleteSubscription,
  renewSubscription,
  setSubscriptionArchived,
  updateSubscription,
} from "@/app/_actions/subscriptions";
import { formatCurrencyCents, formatDateTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { subscriptionReminderOptionsDays } from "@/lib/reminder-options";
import {
  subscriptionCategoryOptions,
  subscriptionCycleUnitOptions,
} from "@/lib/subscriptions";
import { getSubscriptionDetailPageData } from "./_lib/subscription-detail";


export const dynamic = "force-dynamic";

type SubscriptionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubscriptionDetailPage({
  params,
}: SubscriptionDetailPageProps) {
  const { id } = await params;

  const data = await getSubscriptionDetailPageData(id);
  if (!data) notFound();

  const {
    item,
    subscriptionDetailHref,
    offsets,
    daysLeft,
    preview,
    cycleLabel,
    archiveToggle,
    timeZone,
  } = data;
  const now = new Date();

  const renewalBadge = item.autoRenew ? (
    <Badge variant="success" className="px-1.5 py-0 text-[10px]">自动续费</Badge>
  ) : (
    <Badge variant={getBadgeVariantFromLabel("手动续期")} className="px-1.5 py-0 text-[10px]">手动续期</Badge>
  );
  const daysLeftInfo =
    typeof daysLeft === "number"
      ? {
        className: daysLeft < 0 ? "text-danger" : "text-secondary",
        text: daysLeft >= 0 ? `还有 ${daysLeft} 天` : `已过期 ${Math.abs(daysLeft)} 天`,
      }
      : null;
  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      {/* 背景装饰 */}
      <PageBackgroundDecoration />

      <main className="relative mx-auto max-w-4xl p-0 sm:p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-divider bg-base/80 p-4 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.subscriptions}
              className="group flex items-center justify-center p-2 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <Icons.ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-primary">编辑订阅</h1>
                {renewalBadge}
              </div>
              <span className="text-xs text-muted font-mono">ID: {item.id.slice(0, 8)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="subscription-edit-form"
              className="h-9 px-4 rounded-lg bg-brand-primary text-xs font-medium text-white shadow-sm hover:bg-brand-primary/90 transition-all active:scale-95"
            >
              保存
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 animate-slide-up stagger-1 space-y-8">
          {/* 状态概览 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted">到期日期</span>
              <div>
                <div className="text-lg font-semibold font-mono">{item.nextRenewDate}</div>
                {daysLeftInfo && (
                  <div className={`text-xs ${daysLeftInfo.className}`}>
                    {daysLeftInfo.text}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted">费用</span>
              <div>
                <div className="text-lg font-semibold font-mono text-brand-primary">
                  {typeof item.priceCents === "number"
                    ? formatCurrencyCents(item.priceCents, item.currency)
                    : "未设置"}
                </div>
                <span className="text-xs text-muted">{cycleLabel}</span>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-xl border border-default bg-surface/50 p-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted">操作</span>
                <div className="flex flex-wrap gap-2">
                  <form action={renewSubscription}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="redirectTo" value={subscriptionDetailHref} />
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">续期</Button>
                  </form>
                  <form action={setSubscriptionArchived}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="isArchived" value={archiveToggle.value} />
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                      {archiveToggle.label}
                    </Button>
                  </form>
                </div>
              </div>
              <form action={deleteSubscription}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="redirectTo" value={ROUTES.subscriptions} />
                <ConfirmSubmitButton
                  confirmMessage="确定删除这个订阅吗？此操作不可撤销。"
                  className="h-8 rounded-lg border border-transparent px-3 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                  删除
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <form id="subscription-edit-form" action={updateSubscription} className="space-y-8">
            <input type="hidden" name="id" value={item.id} />

            <div className="rounded-xl border border-default bg-elevated relative">
              <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary">
                基本信息
              </div>
              <div className="p-4 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2 grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1.5">名称</label>
                    <Input name="name" defaultValue={item.name} required className="h-10 bg-base/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1.5">分类</label>
                    <CustomSelect
                      name="category"
                      defaultValue={item.category}
                      placeholder="输入自定义..."
                      className="h-10 bg-base/50"
                      options={subscriptionCategoryOptions}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">下次到期日</label>
                  <SmartDateInput name="nextRenewDate" defaultValue={item.nextRenewDate} required className="h-10 bg-base/50" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">自动续费</label>
                  <div className="flex h-10 items-center rounded-lg border border-default bg-base/50 px-3">
                    <input type="checkbox" name="autoRenew" value="1" defaultChecked={item.autoRenew} className="h-4 w-4 rounded border-emphasis text-brand-primary" />
                    <span className="ml-3 text-sm text-primary">启用</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">周期单位</label>
                  <Select name="cycleUnit" defaultValue={item.cycleUnit} className="h-10 bg-base/50">
                    {subscriptionCycleUnitOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">周期间隔</label>
                  <Input type="number" name="cycleInterval" defaultValue={item.cycleInterval} min={1} className="h-10 bg-base/50" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">金额</label>
                  <Input type="number" name="price" step="0.01" min="0" defaultValue={typeof item.priceCents === "number" ? (item.priceCents / 100).toString() : ""} className="h-10 bg-base/50" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">币种</label>
                  <Input name="currency" defaultValue={item.currency} className="h-10 bg-base/50" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-secondary mb-1.5">备注</label>
                  <Textarea name="description" rows={3} defaultValue={item.description ?? ""} className="resize-y bg-base/50" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-default bg-elevated relative">
              <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary flex items-center justify-between">
                <span>提醒设置</span>
                <span className="text-[10px] text-muted font-normal">可多选</span>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-3">
                  {subscriptionReminderOptionsDays.map((opt) => (
                    <label key={opt.days} className="flex items-center gap-2 rounded-lg border border-divider bg-surface/50 px-4 py-2 text-sm cursor-pointer hover:bg-interactive-hover transition-colors">
                      <input type="checkbox" name="remindOffsetsDays" value={opt.days} defaultChecked={offsets.includes(opt.days)} className="h-4 w-4 rounded border-emphasis text-brand-primary" />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {preview.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {preview.map((p) => {
                      const isPast = p.at.getTime() < now.getTime();
                      return (
                        <span key={p.days} className={`rounded-md border px-2 py-1 text-[10px] font-medium ${isPast ? "border-danger/30 bg-danger/10 text-danger" : "border-divider bg-surface text-secondary"}`}>
                          {p.label}：{formatDateTime(p.at, timeZone)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
