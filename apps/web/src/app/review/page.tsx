import type { Metadata } from "next";
import { Icon } from "@iconify/react";
import Link from "next/link";

import { AppHeader } from "@/app/_components/layout/AppHeader";
import { getAppTimeSettings } from "@/server/db/settings";
import { formatDateInTimeZone } from "@/server/date";
import { cn } from "@/lib/utils";
import { getReviewAvailableYears } from "./[year]/_lib/review-page-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "年度回顾",
  description: "按年份查看年度概览、完成统计、分类汇总与清单预览。",
};

function GlassPanel(props: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-glass ring-1 ring-black/5 shadow-sm dark:ring-white/10",
        props.className,
      )}
    >
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-[0.04] dark:opacity-[0.06]" />
      <div className="relative z-10">{props.children}</div>
    </div>
  );
}

export default async function ReviewIndexPage() {
  const { timeZone } = await getAppTimeSettings();
  const now = new Date();
  const year = formatDateInTimeZone(now, timeZone).slice(0, 4);
  const years = await getReviewAvailableYears(timeZone, now);

  return (
    <div className="min-h-dvh bg-base font-sans text-primary animate-fade-in pb-20 sm:pb-10">
      <main className="mx-auto max-w-6xl xl:max-w-7xl py-10 px-fluid">
        <AppHeader
          title="年度回顾"
          description={`选择年份查看年度数据汇总 · 时区 ${timeZone}`}
        />

        <section className="grid gap-4">
          <GlassPanel className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-semibold">快速入口</div>
                <div className="text-xs text-muted">默认跳转当前年份；这里可选择其他年份。</div>
              </div>
              <Link
                href={`/review/${year}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-default bg-surface px-4 py-2 text-xs font-medium text-primary hover:bg-interactive-hover transition-colors active-press"
              >
                <Icon icon="ri:calendar-2-line" className="h-4 w-4" />
                打开 {year}
              </Link>
            </div>
          </GlassPanel>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {years
              .slice()
              .sort((a, b) => b - a)
              .map((y) => {
                const isCurrent = String(y) === year;
                return (
                  <Link
                    key={y}
                    href={`/review/${y}`}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl bg-elevated p-5 hover-float hover:border-brand-primary/20 active-press",
                      isCurrent && "border-brand-primary/30 hover:border-brand-primary/40",
                      isCurrent && "sm:col-span-2 lg:col-span-2",
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 via-transparent to-brand-secondary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                    <div className="absolute inset-0 bg-noise pointer-events-none opacity-[0.03] dark:opacity-[0.05]" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={cn("text-lg font-semibold tracking-tight", isCurrent && "text-gradient-brand")}>{y}</div>
                        <div className="mt-1 text-xs text-muted">年度回顾</div>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                          isCurrent
                            ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                            : "border-divider bg-surface text-muted"
                        }`}
                      >
                        <Icon icon="ri:arrow-right-up-line" className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-1 text-[10px] font-medium text-brand-primary">
                        <Icon icon="ri:flashlight-line" className="h-3.5 w-3.5" />
                        当前年份
                      </div>
                    )}
                  </Link>
                );
              })}
          </div>
        </section>
      </main>
    </div>
  );
}
