import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";

import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { AnniversaryCreateForm } from "@/app/_components/anniversary/AnniversaryCreateForm";
import { EmptyState } from "@/app/_components/EmptyState";
import {
  createAnniversary,
  deleteAnniversary,
  setAnniversaryArchived,
} from "@/app/_actions/anniversaries";
import { AppHeader } from "@/app/_components/AppHeader";
import { UrgencyBadge } from "@/app/_components/UrgencyBadge";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { dateTimeLocalToUtcDate } from "@/server/datetime";
import {
  addDaysToDateString,
  diffDays,
  formatDateString,
  getDatePartsInTimeZone,
} from "@/server/date";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { anniversaries } from "@/server/db/schema";
import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
} from "@/server/anniversary";

export const dynamic = "force-dynamic";

type AnniversaryFilter = "active" | "archived" | "all";

type AnniversariesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const reminderOptionsDays = [
  { days: 0, label: "当天" },
  { days: 1, label: "提前 1 天" },
  { days: 3, label: "提前 3 天" },
  { days: 7, label: "提前 7 天" },
  { days: 30, label: "提前 30 天" },
] as const;

const categoryLabels = {
  birthday: "生日",
  anniversary: "纪念日",
  festival: "节日",
  custom: "自定义",
} as const;

function parseMonthDayString(value: string): { month: number; day: number } | null {
  const match = value.trim().match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 30) return null;

  return { month, day };
}

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

function parseFilter(raw: string | null): AnniversaryFilter {
  if (raw === "active") return "active";
  if (raw === "archived") return "archived";
  if (raw === "all") return "all";
  return "active";
}

function formatDateTime(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
}

export default async function AnniversariesPage({
  searchParams,
}: AnniversariesPageProps) {
  const params = (await searchParams) ?? {};
  const filter = parseFilter(getParam(params, "filter"));

  const settings = await getAppSettings();
  const timeZone = settings.timeZone;
  const dateReminderTime = settings.dateReminderTime;
  const now = new Date();
  const today = formatDateString(getDatePartsInTimeZone(now, timeZone));

  const where =
    filter === "active"
      ? eq(anniversaries.isArchived, false)
      : filter === "archived"
        ? eq(anniversaries.isArchived, true)
        : undefined;

  const rows = await (where
    ? db.select().from(anniversaries).where(where)
    : db.select().from(anniversaries)
  ).orderBy(asc(anniversaries.isArchived), desc(anniversaries.createdAt));

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <AppHeader
          title="纪念日"
          description="v0.2：倒计时 + 提醒预览（支持公历/农历；外部通知后置）。"
        />

        <section className="mb-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
          <AnniversaryCreateForm
            dateReminderTime={dateReminderTime}
            timeZone={timeZone}
          />
        </section>

        <section className="rounded-xl border border-default bg-elevated shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <h2 className="text-sm font-medium">列表</h2>
            <nav className="flex flex-wrap gap-2 text-xs">
              {(
                [
                  { key: "active", label: "进行中" },
                  { key: "archived", label: "已归档" },
                  { key: "all", label: "全部" },
                ] as const
              ).map((t) => (
                <Link
                  key={t.key}
                  href={t.key === "active" ? "/anniversaries" : `/anniversaries?filter=${t.key}`}
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
          </div>

          {rows.length === 0 ? (
            <div className="border-t border-divider">
              <EmptyState
                title="还没有纪念日"
                description="点击上方添加按钮，不再错过重要日子。"
              />
            </div>
          ) : (
            <div className="border-t border-divider p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((item, index) => {
                const nextDate =
                  item.dateType === "solar"
                    ? getNextSolarOccurrenceDateString(item.date, today)
                    : getNextLunarOccurrenceDateString(item.date, today, {
                      isLeapMonth: item.isLeapMonth,
                    });

                const daysLeft = nextDate ? diffDays(today, nextDate) : null;

                const offsets = parseNumberArrayJson(item.remindOffsetsDays);
                const preview =
                  nextDate
                    ? offsets
                      .map((days) => {
                        const date = addDaysToDateString(nextDate, -days);
                        if (!date) return null;
                        const at = dateTimeLocalToUtcDate(
                          `${date}T${dateReminderTime}`,
                          timeZone,
                        );
                        if (!at) return null;
                        return {
                          days,
                          label: days === 0 ? "当天" : `提前 ${days} 天`,
                          at,
                        };
                      })
                      .filter((p): p is NonNullable<typeof p> => p !== null)
                      .sort((a, b) => a.at.getTime() - b.at.getTime())
                    : [];

                const staggerClass = index < 5 ? `stagger-${index + 1}` : "";

                // Urgency styles
                let urgencyColor = "text-primary";
                let urgencyBg = "bg-surface";
                if (daysLeft !== null) {
                  if (daysLeft === 0) {
                    urgencyColor = "text-danger";
                    urgencyBg = "bg-danger/10";
                  } else if (daysLeft <= 3) {
                    urgencyColor = "text-warning";
                    urgencyBg = "bg-warning/10";
                  } else if (daysLeft <= 7) {
                    urgencyColor = "text-brand-primary";
                    urgencyBg = "bg-brand-primary/5";
                  }
                }

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between rounded-xl border border-default bg-elevated p-4 shadow-sm hover-float animate-slide-up ${staggerClass}`}
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${item.dateType === "lunar"
                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                                }`}
                            >
                              {item.dateType === 'lunar' ? '农历' : '公历'}
                            </span>
                            <span className="text-[10px] text-muted uppercase tracking-wider font-medium">
                              {categoryLabels[item.category]}
                            </span>
                          </div>
                          <Link
                            href={`/anniversaries/${item.id}`}
                            className="block truncate text-lg font-bold text-primary hover:underline"
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                        </div>

                        {daysLeft !== null && (
                          <UrgencyBadge daysLeft={daysLeft} />
                        )}
                      </div>


                      <div className="mt-4 flex flex-col gap-2 rounded-lg bg-surface p-3 border border-default/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">目标日期</span>
                          <span className="font-medium font-mono text-secondary">
                            {item.dateType === "solar"
                              ? item.date
                              : (() => {
                                const md = parseMonthDayString(item.date);
                                if (!md) return `农历${item.date}`;
                                return `农历${item.isLeapMonth ? "闰" : ""}${md.month}-${md.day}`;
                              })()}
                          </span>
                        </div>
                        {nextDate && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted">下一次</span>
                            <span className="font-medium text-brand-primary">{nextDate}</span>
                          </div>
                        )}
                      </div>

                      {preview.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1.5 opacity-80">
                            {preview.slice(0, 3).map((p) => {
                              const isPast = p.at.getTime() < now.getTime();
                              return (
                                <span
                                  key={`${item.id}:${p.days}`}
                                  className={[
                                    "rounded px-1.5 py-0.5 text-[10px]",
                                    isPast
                                      ? "bg-danger/20 text-danger border-danger/20"
                                      : "bg-surface text-secondary border border-divider",
                                  ].join(" ")}
                                >
                                  {p.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-divider pt-3 mt-1">
                      <form action={setAnniversaryArchived}>
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="isArchived"
                          value={item.isArchived ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className="h-7 rounded border border-default px-2 text-xs font-medium hover:bg-interactive-hover text-secondary active-press"
                          aria-label={item.isArchived ? `取消归档 ${item.title}` : `归档 ${item.title}`}
                        >
                          {item.isArchived ? "取消归档" : "归档"}
                        </button>
                      </form>

                      <form action={deleteAnniversary}>
                        <input type="hidden" name="id" value={item.id} />
                        <ConfirmSubmitButton
                          confirmMessage="确定删除这个纪念日吗？此操作不可撤销。"
                          className="h-7 rounded border border-transparent px-2 text-xs font-medium text-danger hover:bg-danger/10 active-press"
                          aria-label={`删除 ${item.title}`}
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
