import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, getBadgeVariantFromLabel } from "@/app/_components/Badge";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { Select } from "@/app/_components/Select";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { Icons } from "@/app/_components/Icons";
import { ExpandableSearch } from "@/app/_components/ExpandableSearch";
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

const categoryLabels: Record<string, string> = {
  "生日": "生日",
  "纪念日": "纪念日",
  "节日": "节日",
  birthday: "生日",
  anniversary: "纪念日",
  festival: "节日",
  custom: "自定义",
};

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
              href="/anniversaries"
              className="group flex items-center justify-center p-2 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <Icons.ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-primary">编辑纪念日</h1>
                <Badge variant={getBadgeVariantFromLabel(item.category)} className="px-1.5 py-0 text-[10px]">
                  {categoryLabels[item.category] || item.category}
                </Badge>
              </div>
              <span className="text-xs text-muted font-mono">ID: {item.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="anniversary-edit-form"
              className="h-9 px-4 rounded-lg bg-brand-primary text-xs font-medium text-white shadow-sm hover:bg-brand-primary/90 transition-all active:scale-95"
            >
              保存
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8">
          {saved ? (
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success animate-slide-up">
              ✓ 已保存修改
            </div>
          ) : null}

          {/* 状态概览 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up stagger-1">
            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted">录入日期</span>
              <div className="text-lg font-semibold font-mono">
                {item.dateType === "solar"
                  ? item.date
                  : lunarMd
                    ? `农历${item.isLeapMonth ? "闰" : ""}${lunarMd.month}月${lunarMd.day}日`
                    : `农历${item.date}`}
              </div>
            </div>

            {nextDate && (
              <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 flex flex-col justify-between gap-2">
                <span className="text-xs text-brand-primary">下次到来</span>
                <div>
                  <div className="text-lg font-semibold font-mono text-brand-primary">
                    {nextDate}
                  </div>
                  {typeof daysLeft === "number" && (
                    <div className="text-xs text-muted">还有 {daysLeft} 天</div>
                  )}
                </div>
              </div>
            )}

            <div className="lg:col-span-2 rounded-xl border border-default bg-surface/50 p-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted">操作</span>
                <div className="flex flex-wrap gap-2">
                  <form action={setAnniversaryArchived}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="isArchived" value={item.isArchived ? "0" : "1"} />
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                      {item.isArchived ? "取消归档" : "归档"}
                    </Button>
                  </form>
                </div>
              </div>
              <form action={deleteAnniversary}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="redirectTo" value="/anniversaries" />
                <ConfirmSubmitButton
                  confirmMessage="确定删除这个纪念日吗？此操作不可撤销。"
                  className="h-8 rounded-lg border border-transparent px-3 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                  删除
                </ConfirmSubmitButton>
              </form>
            </div>
          </div>

          <form id="anniversary-edit-form" action={updateAnniversary} className="space-y-8 animate-slide-up stagger-2">
            <input type="hidden" name="id" value={item.id} />

            <div className="rounded-xl border border-default bg-elevated overflow-hidden animate-slide-up stagger-3">
              <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary">
                基本信息
              </div>
              <div className="p-4 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-secondary mb-1.5">标题</label>
                  <Input name="title" defaultValue={item.title} required className="h-10 bg-base/50" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">类型</label>
                  <CustomSelect
                    name="category"
                    defaultValue={item.category in categoryLabels ? (categoryLabels[item.category] !== item.category ? categoryLabels[item.category] : item.category) : item.category}
                    allowCustom={true}
                    options={[
                      { value: "生日", label: "生日" },
                      { value: "纪念日", label: "纪念日" },
                      { value: "节日", label: "节日" },
                    ]}
                    placeholder="输入自定义类型..."
                    className="h-10 bg-base/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">日期类型</label>
                  <Select name="dateType" defaultValue={item.dateType} className="h-10 bg-base/50">
                    <option value="solar">公历</option>
                    <option value="lunar">农历</option>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-secondary mb-1.5">日期（公历）</label>
                  <Input type="date" name="solarDate" defaultValue={item.dateType === "solar" ? item.date : ""} className="h-10 bg-base/50" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">农历月</label>
                  <Select name="lunarMonth" defaultValue={lunarMd?.month ?? 1} className="h-10 bg-base/50">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}月</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">农历日</label>
                  <Select name="lunarDay" defaultValue={lunarMd?.day ?? 1} className="h-10 bg-base/50">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}日</option>
                    ))}
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded-lg hover:bg-surface/50 w-max">
                    <input
                      type="checkbox"
                      name="isLeapMonth"
                      value="1"
                      defaultChecked={item.isLeapMonth}
                      className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                    />
                    <span className="text-secondary">是否闰月</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-default bg-elevated overflow-hidden animate-slide-up stagger-4">
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
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
