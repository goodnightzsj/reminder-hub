import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/app/_components/Badge";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import {
  deleteAnniversary,
  setAnniversaryArchived,
  updateAnniversary,
} from "@/app/_actions/anniversaries";
import {
  getNextLunarOccurrenceDateString,
  getNextSolarOccurrenceDateString,
} from "@/server/anniversary";
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

export const dynamic = "force-dynamic";

type AnniversaryDetailPageProps = {
  params: Promise<{ id: string }>;
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

function formatDateTime(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
}

export default async function AnniversaryDetailPage({
  params,
  searchParams,
}: AnniversaryDetailPageProps) {
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
    .from(anniversaries)
    .where(eq(anniversaries.id, id))
    .limit(1);
  const item = rows[0];
  if (!item) notFound();

  const offsets = parseNumberArrayJson(item.remindOffsetsDays);
  const nextDate =
    item.dateType === "solar"
      ? getNextSolarOccurrenceDateString(item.date, today)
      : getNextLunarOccurrenceDateString(item.date, today, {
        isLeapMonth: item.isLeapMonth,
      });
  const daysLeft = nextDate ? diffDays(today, nextDate) : null;
  const lunarMd = item.dateType === "lunar" ? parseMonthDayString(item.date) : null;

  const preview =
    nextDate
      ? offsets
        .map((days) => {
          const date = addDaysToDateString(nextDate, -days);
          if (!date) return null;
          const at = dateTimeLocalToUtcDate(`${date}T${dateReminderTime}`, timeZone);
          if (!at) return null;
          return { days, label: days === 0 ? "当天" : `提前 ${days} 天`, at };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .sort((a, b) => a.at.getTime() - b.at.getTime())
      : [];

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      <main className="mx-auto max-w-2xl p-6 sm:p-10">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              纪念日详情
            </h1>
            <p className="mt-1 text-sm text-secondary">
              提醒预览默认按 <code className="font-mono">{timeZone}</code>{" "}
              的 <code className="font-mono">{dateReminderTime}</code>{" "}
              计算；如在设置中开启通知，到点会按提醒规则发送。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/anniversaries"
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
              href="/subscriptions"
              className="mt-0.5 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
            >
              订阅
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
                {categoryLabels[item.category]}
              </Badge>
              <Badge variant="outline">
                {item.dateType === "solar" ? "公历" : "农历"}
              </Badge>
              {item.isArchived ? (
                <Badge>
                  已归档
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form action={setAnniversaryArchived}>
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

              <form action={deleteAnniversary}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="redirectTo" value="/anniversaries" />
                <ConfirmSubmitButton
                  confirmMessage="确定删除这个纪念日吗？此操作不可撤销。"
                  className="h-9 rounded-lg border border-divider px-3 text-xs font-medium text-danger hover:bg-danger/10 dark:text-danger dark:hover:bg-danger/20 active-press"
                >
                  删除
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-divider bg-surface p-3 text-xs text-secondary">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                录入日期：{" "}
                <span className="font-medium text-primary">
                  {item.dateType === "solar"
                    ? item.date
                    : lunarMd
                      ? `农历${item.isLeapMonth ? "闰" : ""}${lunarMd.month}-${lunarMd.day}`
                      : `农历${item.date}`}
                </span>
              </span>
              {nextDate ? <span>· 下次 {nextDate}</span> : null}
              {typeof daysLeft === "number" ? (
                <span>· 还有 {daysLeft} 天</span>
              ) : null}
            </div>
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

          <form action={updateAnniversary} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="id" value={item.id} />

            <label className="flex flex-col gap-1 text-xs text-muted">
              标题
              <Input
                name="title"
                defaultValue={item.title}
                required
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-secondary">
                类型
                <Select
                  name="category"
                  defaultValue={item.category}
                >
                  <option value="birthday">生日</option>
                  <option value="anniversary">纪念日</option>
                  <option value="festival">节日</option>
                  <option value="custom">自定义</option>
                </Select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-secondary">
                日期类型
                <Select
                  name="dateType"
                  defaultValue={item.dateType}
                >
                  <option value="solar">公历</option>
                  <option value="lunar">农历</option>
                </Select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted sm:col-span-2">
                日期（公历）
                <Input
                  type="date"
                  name="solarDate"
                  defaultValue={item.dateType === "solar" ? item.date : ""}
                />
              </label>

              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs text-secondary">
                  农历月
                  <Select
                    name="lunarMonth"
                    defaultValue={lunarMd?.month ?? 1}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="flex flex-col gap-1 text-xs text-secondary">
                  农历日
                  <Select
                    name="lunarDay"
                    defaultValue={lunarMd?.day ?? 1}
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="flex flex-col gap-1 text-xs text-secondary">
                  闰月
                  <div className="flex h-11 items-center rounded-lg border border-default bg-transparent px-3">
                    <input
                      type="checkbox"
                      name="isLeapMonth"
                      value="1"
                      defaultChecked={item.isLeapMonth}
                      className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                    />
                    <span className="ml-2 text-sm text-primary">
                      是
                    </span>
                  </div>
                </label>
              </div>
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
              className="self-start"
            >
              保存修改
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
