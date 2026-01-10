import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, getBadgeVariantFromLabel } from "@/app/_components/Badge";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { Textarea } from "@/app/_components/Textarea";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { Icons } from "@/app/_components/Icons";
import { ExpandableSearch } from "@/app/_components/ExpandableSearch";
import {
  deleteSubscription,
  renewSubscription,
  setSubscriptionArchived,
  updateSubscription,
} from "@/app/_actions/subscriptions";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import {
  addDaysToDateString,
  addMonthsClampedToDateString,
  diffDays,
  formatDateString,
  getDatePartsInTimeZone,
} from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";

import { subscriptions, serviceIcons } from "@/server/db/schema";


export const dynamic = "force-dynamic";

type SubscriptionDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const reminderOptionsDays = [
  { days: 0, label: "到期日" },
  { days: 1, label: "提前 1 天" },
  { days: 3, label: "提前 3 天" },
  { days: 7, label: "提前 7 天" },
  { days: 30, label: "提前 30 天" },
] as const;

function parseNumberArrayJson(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
      .filter((v) => v >= 0)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  if (typeof value === "string") return value;
  return null;
}

function formatDateTime(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
}

function formatPrice(priceCents: number, currency: string): string {
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

export default async function SubscriptionDetailPage({
  params,
  searchParams,
}: SubscriptionDetailPageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const saved = getParam(query, "saved");

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const dateReminderTime = settings.dateReminderTime;
  const now = new Date();
  const today = formatDateString(getDatePartsInTimeZone(now, timeZone));





  const rows = await db
    .select()
    .from(subscriptions)
    .leftJoin(serviceIcons, eq(subscriptions.name, serviceIcons.name))
    .where(eq(subscriptions.id, id))
    .limit(1);

  const result = rows[0];
  if (!result) notFound();

  const item = {
    ...result.subscriptions,
    icon: result.service_icons?.icon ?? result.subscriptions.icon,
    color: result.service_icons?.color ?? result.subscriptions.color,
  };

  if (!item) notFound();

  const offsets = parseNumberArrayJson(item.remindOffsetsDays);
  const daysLeft = diffDays(today, item.nextRenewDate);
  const preview = offsets
    .map((days) => {
      const date = addDaysToDateString(item.nextRenewDate, -days);
      if (!date) return null;
      const at = dateTimeLocalToUtcDate(`${date}T${dateReminderTime}`, timeZone);
      if (!at) return null;
      return { days, label: days === 0 ? "到期日" : `提前 ${days} 天`, at };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const monthsToAdd =
    item.cycleUnit === "year" ? item.cycleInterval * 12 : item.cycleInterval;
  const renewedToDate = addMonthsClampedToDateString(item.nextRenewDate, monthsToAdd);

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
              href="/subscriptions"
              className="group flex items-center justify-center p-2 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <Icons.ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-primary">编辑订阅</h1>
                {item.autoRenew ? (
                  <Badge variant="success" className="px-1.5 py-0 text-[10px]">自动续费</Badge>
                ) : (
                  <Badge variant={getBadgeVariantFromLabel("手动续期")} className="px-1.5 py-0 text-[10px]">手动续期</Badge>
                )}
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
          {saved ? (
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success animate-slide-up">
              ✓ 已保存修改
            </div>
          ) : null}

          {/* 状态概览 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted">到期日期</span>
              <div>
                <div className="text-lg font-semibold font-mono">{item.nextRenewDate}</div>
                {typeof daysLeft === "number" && (
                  <div className={`text-xs ${daysLeft < 0 ? 'text-danger' : 'text-secondary'}`}>
                    {daysLeft >= 0 ? `还有 ${daysLeft} 天` : `已过期 ${Math.abs(daysLeft)} 天`}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted">费用</span>
              <div>
                <div className="text-lg font-semibold font-mono text-brand-primary">
                  {typeof item.priceCents === "number"
                    ? formatPrice(item.priceCents, item.currency)
                    : "未设置"}
                </div>
                <span className="text-xs text-muted">{item.cycleUnit === "year" ? "年付" : "月付"}</span>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-xl border border-default bg-surface/50 p-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted">操作</span>
                <div className="flex flex-wrap gap-2">
                  <form action={renewSubscription}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="redirectTo" value={`/subscriptions/${item.id}`} />
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">续期</Button>
                  </form>
                  <form action={setSubscriptionArchived}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="isArchived" value={item.isArchived ? "0" : "1"} />
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                      {item.isArchived ? "取消归档" : "归档"}
                    </Button>
                  </form>
                </div>
              </div>
              <form action={deleteSubscription}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="redirectTo" value="/subscriptions" />
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

            <div className="rounded-xl border border-default bg-elevated overflow-hidden">
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
                      options={[
                        { value: "娱乐", label: "娱乐" },
                        { value: "工具", label: "工具" },
                        { value: "学习", label: "学习" },
                        { value: "办公", label: "办公" },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">下次到期日</label>
                  <Input type="date" name="nextRenewDate" defaultValue={item.nextRenewDate} required className="h-10 bg-base/50" />
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
                    <option value="month">月</option>
                    <option value="year">年</option>
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

            <div className="rounded-xl border border-default bg-elevated overflow-hidden">
              <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary flex items-center justify-between">
                <span>提醒设置</span>
                <span className="text-[10px] text-muted font-normal">可多选</span>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-3">
                  {reminderOptionsDays.map((opt) => (
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
