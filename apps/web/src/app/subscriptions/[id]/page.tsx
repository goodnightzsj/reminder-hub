import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, getBadgeVariantFromLabel } from "@/app/_components/ui/Badge";
import { Button } from "@/app/_components/ui/Button";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { IconChevronLeft } from "@/app/_components/Icons";
import { PageBackgroundDecoration } from "../../_components/layout/PageBackgroundDecoration";
import {
  deleteSubscription,
  renewSubscription,
  setSubscriptionArchived,
  updateSubscription,
} from "@/app/_actions/subscriptions";
import { formatCurrencyCents } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { requireAuth } from "@/server/auth";
import { getSubscriptionDetailPageData } from "./_lib/subscription-detail";
import { SubscriptionEditForm } from "@/app/_components/subscriptions/SubscriptionEditForm";


export const dynamic = "force-dynamic";

type SubscriptionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SubscriptionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getSubscriptionDetailPageData(id);

  if (!data) {
    return { title: "订阅不存在" };
  }

  return {
    title: `订阅 · ${data.item.name}`,
    description: "查看并编辑订阅费用、到期时间、续期方式与提醒设置。",
  };
}

export default async function SubscriptionDetailPage({
  params,
}: SubscriptionDetailPageProps) {
  await requireAuth();
  const { id } = await params;

  const data = await getSubscriptionDetailPageData(id);
  if (!data) notFound();

  const {
    item,
    subscriptionDetailHref,
    daysLeft,
    cycleLabel,
    archiveToggle,
  } = data;

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
              <IconChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
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

          <SubscriptionEditForm
            item={data.item}
            offsets={data.offsets}
            preview={data.preview}
            timeZone={data.timeZone}
            action={updateSubscription}
          />
        </div>
      </main>
    </div>
  );
}
