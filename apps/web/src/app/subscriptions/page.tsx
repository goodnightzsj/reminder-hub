import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";

import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { SubscriptionCreateForm } from "@/app/_components/subscriptions/SubscriptionCreateForm";
import {
  deleteSubscription,
  renewSubscription,
  setSubscriptionArchived,
} from "@/app/_actions/subscriptions";
import { AppHeader } from "@/app/_components/AppHeader";
import { EmptyState } from "@/app/_components/EmptyState";
import { ServiceIconBadge } from "@/app/_components/ServiceIconBadge";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import {
  addDaysToDateString,
  diffDays,
  formatDateString,
  getDatePartsInTimeZone,
} from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { subscriptions } from "@/server/db/schema";

export const dynamic = "force-dynamic";

type SubscriptionFilter = "active" | "archived" | "all";

type SubscriptionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};



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

function parseFilter(raw: string | null): SubscriptionFilter {
  if (raw === "active") return "active";
  if (raw === "archived") return "archived";
  if (raw === "all") return "all";
  return "active";
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

export default async function SubscriptionsPage({
  searchParams,
}: SubscriptionsPageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseFilter(getParam(params, "filter"));

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const dateReminderTime = settings.dateReminderTime;
  const now = new Date();
  const today = formatDateString(getDatePartsInTimeZone(now, timeZone));

  const where =
    filter === "active"
      ? eq(subscriptions.isArchived, false)
      : filter === "archived"
        ? eq(subscriptions.isArchived, true)
        : undefined;

  const rows = await (where
    ? db.select().from(subscriptions).where(where)
    : db.select().from(subscriptions)
  ).orderBy(asc(subscriptions.isArchived), asc(subscriptions.nextRenewDate), desc(subscriptions.createdAt));

  return (
    <div className="min-h-screen bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="订阅"
          description="v0.2：到期提醒预览 + 手动续期重置（外部通知后置）。"
        />

        <section className="mb-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <SubscriptionCreateForm
            dateReminderTime={dateReminderTime}
            timeZone={timeZone}
          />
        </section>

        <nav className="mb-3 flex flex-wrap gap-2 text-xs">
          {(
            [
              { key: "active", label: "进行中" },
              { key: "archived", label: "已归档" },
              { key: "all", label: "全部" },
            ] as const
          ).map((t) => (
            <Link
              key={t.key}
              href={t.key === "active" ? "/subscriptions" : `/subscriptions?filter=${t.key}`}
              className={[
                "rounded-lg border px-3 py-2 font-medium active-press",
                t.key === filter
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-default hover:bg-interactive-hover",
              ].join(" ")}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <section className="rounded-xl border border-default bg-elevated shadow-sm">
          {rows.length === 0 ? (
            <EmptyState
              title="还没有订阅"
              description="记录你的周期性订阅，在续期日提前提醒。"
            />
          ) : (
            <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((item, index) => {
                const offsets = parseNumberArrayJson(item.remindOffsetsDays);
                const daysLeft = diffDays(today, item.nextRenewDate);
                const staggerClass = index < 5 ? `stagger-${index + 1}` : "";

                // Calculate cycle label
                const cycleLabel = item.cycleInterval === 1
                  ? (item.cycleUnit === "year" ? "年付" : "月付")
                  : `每 ${item.cycleInterval} ${item.cycleUnit === "year" ? "年" : "月"}`;

                // Calculate progress roughly (assuming cycle starts from prev date)
                // Since we don't store prev date easily, we can just visualize "days left" urgency
                let progressColor = "bg-brand-primary";
                let urgencyClass = "";
                if (daysLeft !== null) {
                  if (daysLeft <= 3) {
                    progressColor = "bg-[#dc2626]"; // danger solid
                    urgencyClass = "text-danger font-medium";
                  } else if (daysLeft <= 7) {
                    progressColor = "bg-[#d97706]"; // warning solid
                    urgencyClass = "text-warning";
                  }
                }

                const preview = offsets
                  .map((days) => {
                    const date = addDaysToDateString(item.nextRenewDate, -days);
                    if (!date) return null;
                    const at = dateTimeLocalToUtcDate(
                      `${date}T${dateReminderTime}`,
                      timeZone,
                    );
                    if (!at) return null;
                    return {
                      days,
                      label: days === 0 ? "到期日" : `提前 ${days} 天`,
                      at,
                    };
                  })
                  .filter((p): p is NonNullable<typeof p> => p !== null)
                  .sort((a, b) => a.at.getTime() - b.at.getTime());

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between rounded-xl border border-default bg-elevated p-4 shadow-sm hover-float animate-slide-up ${staggerClass}`}
                  >
                    <div className="mb-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <ServiceIconBadge serviceName={item.name} size="lg" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                              {cycleLabel}
                            </span>
                            <Link
                              href={`/subscriptions/${item.id}`}
                              className="block truncate text-lg font-bold text-primary hover:underline mt-0.5"
                              title={item.name}
                            >
                              {item.name}
                            </Link>
                          </div>
                        </div>
                        {typeof item.priceCents === "number" && (
                          <div className="text-right">
                            <div className="text-lg font-bold font-mono text-primary">
                              {formatPrice(item.priceCents, item.currency)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="mb-3 flex flex-wrap gap-2">
                        {item.autoRenew ? (
                          <span className="inline-flex items-center rounded-md bg-success px-2 py-0.5 text-[10px] font-medium text-success-foreground border border-success/30">
                            自动续费
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-[10px] font-medium text-secondary border border-divider">
                            手动续期
                          </span>
                        )}
                        {item.isArchived && (
                          <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-[10px] font-medium text-muted border border-divider">
                            已归档
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 rounded-lg bg-surface p-3 border border-default/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">下期扣款</span>
                          <span className={`${urgencyClass}`}>{item.nextRenewDate}</span>
                        </div>

                        {/* Days Left Bar */}
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-divider/30">
                          {/* Simplified progress bar - maybe purely based on "is it close?" since we lack start date */}
                          <div
                            className={`h-full rounded-full ${progressColor}`}
                            style={{ width: daysLeft !== null && daysLeft < 30 ? '100%' : '5%' }} // Placeholder logic as we don't strictly track start-end ratio
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-muted">
                          <span>
                            {daysLeft !== null
                              ? (daysLeft >= 0 ? `还有 ${daysLeft} 天` : `已过期 ${Math.abs(daysLeft)} 天`)
                              : "未知"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-1">
                        {preview.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 opacity-80">
                            {preview.slice(0, 3).map((p) => { // Limit to 3 to save space
                              const isPast = p.at.getTime() < now.getTime();
                              return (
                                <span
                                  key={`${item.id}:${p.days}`}
                                  className={[
                                    "rounded px-1.5 py-0.5 text-[10px]",
                                    isPast
                                      ? "bg-danger text-danger-foreground"
                                      : "bg-surface text-secondary border border-divider",
                                  ].join(" ")}
                                >
                                  {p.label}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {item.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-muted truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-divider pt-3 mt-1">
                      <form action={renewSubscription}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="h-7 rounded border border-brand-primary text-brand-primary px-3 text-[11px] font-medium hover:bg-brand-primary hover:text-white transition-colors active-press"
                        >
                          续期
                        </button>
                      </form>

                      <form action={setSubscriptionArchived}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="isArchived"
                          value={item.isArchived ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className="h-7 rounded border border-default px-2 text-[11px] font-medium hover:bg-interactive-hover text-secondary active-press"
                        >
                          {item.isArchived ? "取消归档" : "归档"}
                        </button>
                      </form>

                      <form action={deleteSubscription}>
                        <input type="hidden" name="id" value={item.id} />
                        <ConfirmSubmitButton
                          confirmMessage="确定删除这个订阅吗？此操作不可撤销。"
                          className="h-7 rounded border border-transparent px-2 text-[11px] font-medium text-danger hover:bg-danger/10 active-press"
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
