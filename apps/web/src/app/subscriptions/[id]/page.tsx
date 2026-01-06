import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/app/_components/Badge";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { Textarea } from "@/app/_components/Textarea";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
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
import { subscriptions } from "@/server/db/schema";

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
    .where(eq(subscriptions.id, id))
    .limit(1);
  const item = rows[0];
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
    <div className="min-h-screen bg-base font-sans text-primary">
      <main className="mx-auto max-w-2xl p-6 sm:p-10">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              订阅详情
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              提醒预览默认按 <code className="font-mono">{timeZone}</code>{" "}
              的 <code className="font-mono">{dateReminderTime}</code>{" "}
              计算；如在设置中开启通知，到点会按提醒规则发送。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/subscriptions"
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
              href="/anniversaries"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              纪念日
            </Link>
            <Link
              href="/items"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              物品
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {item.cycleUnit === "year" ? "年付" : "月付"} · {item.cycleInterval}
              </Badge>
              {item.autoRenew ? (
                <Badge variant="outline">
                  自动续费
                </Badge>
              ) : (
                <Badge variant="outline">
                  非自动
                </Badge>
              )}
              {item.isArchived ? (
                <Badge>
                  已归档
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form action={renewSubscription}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="redirectTo"
                  value={`/subscriptions/${item.id}`}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-9 active-press"
                >
                  续期
                </Button>
              </form>

              <form action={setSubscriptionArchived}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="isArchived"
                  value={item.isArchived ? "0" : "1"}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-9 active-press"
                >
                  {item.isArchived ? "取消归档" : "归档"}
                </Button>
              </form>

              <form action={deleteSubscription}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="redirectTo" value="/subscriptions" />
                <ConfirmSubmitButton
                  confirmMessage="确定删除这个订阅吗？此操作不可撤销。"
                  className="h-9 rounded-lg border border-divider px-3 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 active-press"
                >
                  删除
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-divider bg-surface p-3 text-xs text-secondary">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                到期日：<span className="font-medium text-primary">{item.nextRenewDate}</span>
              </span>
              {typeof daysLeft === "number" ? (
                <span>
                  ·{" "}
                  {daysLeft >= 0
                    ? `还有 ${daysLeft} 天`
                    : `已过期 ${Math.abs(daysLeft)} 天`}
                </span>
              ) : null}
              {typeof item.priceCents === "number" ? (
                <span>· {formatPrice(item.priceCents, item.currency)}</span>
              ) : null}
            </div>
            {renewedToDate ? (
              <div className="mt-2 text-muted">
                续期后将更新为：<span className="font-medium text-primary">{renewedToDate}</span>
              </div>
            ) : null}
          </div>

          {preview.length > 0 ? (
            <div className="mt-3 rounded-lg border border-divider bg-surface p-3 text-xs text-secondary">
              <div className="font-medium text-primary">提醒预览</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.map((p) => {
                  const isPast = p.at.getTime() < now.getTime();
                  return (
                    <span
                      key={p.days}
                      className={[
                        "rounded-md border px-2 py-1",
                        isPast
                          ? "border-danger bg-danger text-danger"
                          : "border-divider bg-elevated text-secondary",
                      ].join(" ")}
                    >
                      {p.label}：{formatDateTime(p.at, timeZone)}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          <form action={updateSubscription} className="mt-4 flex flex-col gap-3">
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
                下次到期日
                <Input
                  type="date"
                  name="nextRenewDate"
                  defaultValue={item.nextRenewDate}
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                自动续费（标记）
                <div className="flex h-11 items-center rounded-lg border border-default bg-transparent px-3">
                  <input
                    type="checkbox"
                    name="autoRenew"
                    value="1"
                    defaultChecked={item.autoRenew}
                    className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                  />
                  <span className="ml-2 text-sm text-primary">
                    是
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                周期单位
                <Select
                  name="cycleUnit"
                  defaultValue={item.cycleUnit}
                >
                  <option value="month">月</option>
                  <option value="year">年</option>
                </Select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                周期间隔
                <Input
                  type="number"
                  name="cycleInterval"
                  defaultValue={item.cycleInterval}
                  min={1}
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                金额
                <Input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
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

              <label className="flex flex-col gap-1 text-xs text-secondary sm:col-span-2">
                备注
                <Textarea
                  name="description"
                  rows={4}
                  defaultValue={item.description ?? ""}
                  className="resize-y"
                />
              </label>
            </div>

            <fieldset className="mt-1">
              <legend className="text-xs text-secondary">
                提醒（可多选）
              </legend>
              <div className="mt-2 flex flex-wrap gap-3 rounded-lg border border-divider bg-surface p-3 text-sm">
                {reminderOptionsDays.map((opt) => (
                  <label
                    key={opt.days}
                    className="inline-flex items-center gap-2 text-xs text-primary"
                  >
                    <input
                      type="checkbox"
                      name="remindOffsetsDays"
                      value={opt.days}
                      defaultChecked={offsets.includes(opt.days)}
                      className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Button
              type="submit"
              variant="secondary"
              className="self-start active-press"
            >
              保存修改
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
