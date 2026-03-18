import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SmartCategoryBadge } from "../../_components/shared/SmartCategoryBadge";
import { Button } from "@/app/_components/ui/Button";
import { Input } from "@/app/_components/ui/Input";
import { CustomSelect } from "@/app/_components/CustomSelect";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { IconChevronLeft } from "@/app/_components/Icons";
import { PageBackgroundDecoration } from "../../_components/layout/PageBackgroundDecoration";
import { AnniversaryDateFields } from "@/app/_components/anniversary/AnniversaryDateFields";
import {
  deleteAnniversary,
  setAnniversaryArchived,
  updateAnniversary,
} from "@/app/_actions/anniversaries";
import { anniversaryCategoryOptions, getAnniversaryCategoryLabel } from "@/lib/anniversary";
import { ROUTES } from "@/lib/routes";
import { anniversaryReminderOptionsDays } from "@/lib/reminder-options";

import { getAnniversaryDetailPageData } from "./_lib/anniversary-detail";

export const dynamic = "force-dynamic";

type AnniversaryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: AnniversaryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getAnniversaryDetailPageData(id);

  if (!data) {
    return { title: "纪念日不存在" };
  }

  return {
    title: `纪念日 · ${data.item.title}`,
    description: "查看并编辑纪念日日期、提醒与归档状态。",
  };
}

export default async function AnniversaryDetailPage({
  params,
}: AnniversaryDetailPageProps) {
  const { id } = await params;

  const data = await getAnniversaryDetailPageData(id);
  if (!data) notFound();

  const {
    item,
    offsets,
    nextDate,
    daysLeft,
    lunarMd,
    enteredDateLabel,
    archiveToggle,
    defaultSolarDate,
  } = data;

  return (
    <div className="min-h-dvh bg-base font-sans text-primary">
      {/* 背景装饰 */}
      <PageBackgroundDecoration />

      <main className="relative mx-auto max-w-4xl p-0 sm:p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-divider bg-base/80 p-4 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.anniversaries}
              className="group flex items-center justify-center p-2 rounded-lg text-secondary hover:bg-surface hover:text-primary transition-colors"
            >
              <IconChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-primary">编辑纪念日</h1>
                <SmartCategoryBadge>{getAnniversaryCategoryLabel(item.category)}</SmartCategoryBadge>
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
          {/* 状态概览 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up stagger-1">
            <div className="rounded-xl border border-default bg-surface/50 p-4 flex flex-col justify-between gap-2">
              <span className="text-xs text-muted">录入日期</span>
              <div className="text-lg font-semibold font-mono">
                {enteredDateLabel}
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
                    <input type="hidden" name="isArchived" value={archiveToggle.value} />
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                      {archiveToggle.label}
                    </Button>
                  </form>
                </div>
              </div>
              <form action={deleteAnniversary}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="redirectTo" value={ROUTES.anniversaries} />
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

            <div className="rounded-xl border border-default bg-elevated relative animate-slide-up stagger-3">
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
                    defaultValue={getAnniversaryCategoryLabel(item.category)}
                    allowCustom={true}
                    options={anniversaryCategoryOptions}
                    placeholder="输入自定义类型..."
                    className="h-10 bg-base/50"
                  />
                </div>

                <AnniversaryDateFields
                  defaultDateType={item.dateType}
                  defaultSolarDate={defaultSolarDate}
                  defaultLunarMonth={lunarMd?.month}
                  defaultLunarDay={lunarMd?.day}
                  defaultIsLeapMonth={item.isLeapMonth}
                />
              </div>
            </div>

            <div className="rounded-xl border border-default bg-elevated relative animate-slide-up stagger-4">
              <div className="border-b border-divider bg-surface/50 px-4 py-3 text-xs font-medium text-secondary flex items-center justify-between">
                <span>提醒设置</span>
                <span className="text-[10px] text-muted font-normal">可多选</span>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-3">
                  {anniversaryReminderOptionsDays.map((opt) => (
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
