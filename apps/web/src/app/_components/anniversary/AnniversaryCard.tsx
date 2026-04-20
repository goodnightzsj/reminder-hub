"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { deleteAnniversary, restoreAnniversary } from "@/app/_actions/anniversaries";
import { IconArchiveRestore, IconCalendar, IconEdit, IconTrash } from "../Icons";
import { SmartCategoryBadge } from "../shared/SmartCategoryBadge";
import { Tooltip } from "../ui/Tooltip";
import { ANNIVERSARY_DATE_TYPE, getAnniversaryCategoryLabel, type AnniversaryDateType } from "@/lib/anniversary";

export type AnniversaryCardItemData = {
    id: string;
    title: string;
    category: string;
    dateType: AnniversaryDateType;
    isLeapMonth: boolean;
    isArchived: boolean;
    deletedAt?: Date | null;
};

type AnniversaryCardProps = {
    item: AnniversaryCardItemData;
    daysLeft: number | null;
    nextDate: string | null;
};

const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

export function AnniversaryCard({ item, daysLeft, nextDate }: AnniversaryCardProps) {
    const isToday = daysLeft === 0;
    const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft > 0;
    const isNear = daysLeft !== null && daysLeft <= 7 && daysLeft > 3;

    // 用主题 token 替代硬编码红/橙，换主题时紧迫度色自动跟随。
    let cardBorderClass = "border-default";
    let daysEndColorClass = "text-primary";
    let bgClass = "bg-elevated";

    if (isToday) {
        cardBorderClass = "border-[hsl(var(--destructive)/0.5)]";
        bgClass = "bg-gradient-to-br from-[hsl(var(--destructive)/0.1)] to-[hsl(var(--bg-elevated))]";
        daysEndColorClass = "text-[hsl(var(--destructive))]";
    } else if (isUrgent) {
        cardBorderClass = "border-[hsl(var(--warning)/0.4)]";
        daysEndColorClass = "text-[hsl(var(--warning))]";
    } else if (isNear) {
        cardBorderClass = "border-brand-primary/40";
        daysEndColorClass = "text-brand-primary";
    }

    return (
        <motion.div
            layout
            variants={itemVariants}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border ${cardBorderClass} ${bgClass} p-5 shadow-sm transition-all hover:shadow-md hover-float`}
        >
            {/* Header: Date Type + Category */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    {item.deletedAt && (
                        <SmartCategoryBadge overrideColor="red" variant="solid">
                            已删除
                        </SmartCategoryBadge>
                    )}

                    {!item.deletedAt && item.isArchived && (
                        <SmartCategoryBadge overrideColor="slate" variant="solid">
                            已归档
                        </SmartCategoryBadge>
                    )}

                    {!item.deletedAt && !item.isArchived && (
                        <SmartCategoryBadge overrideColor="sky" variant="solid">
                            进行中
                        </SmartCategoryBadge>
                    )}

                    <SmartCategoryBadge overrideColor={item.dateType === ANNIVERSARY_DATE_TYPE.LUNAR ? "purple" : "blue"} variant="solid">
                        {item.dateType === ANNIVERSARY_DATE_TYPE.LUNAR ? "农历" : "公历"}
                    </SmartCategoryBadge>
                    <SmartCategoryBadge>
                        {getAnniversaryCategoryLabel(item.category)}
                    </SmartCategoryBadge>
                </div>
            </div>

            {/* Main Content: Days Left */}
            <div className="flex flex-col items-center justify-center py-6">
                {daysLeft !== null ? (
                    <div className="text-center">
                        {isToday ? (
                            <div className="flex flex-col items-center animate-bounce-gentle">
                                <span className="font-display text-4xl font-bold text-[hsl(var(--destructive))] tracking-tight">TODAY</span>
                                <span className="text-sm font-medium text-[hsl(var(--destructive)/0.85)]">今天</span>
                            </div>
                        ) : (
                            <>
                                <span className={`font-display text-5xl font-bold tracking-tight tabular-nums ${daysEndColorClass}`}>
                                    {daysLeft}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground mt-1 block">天后</span>
                            </>
                        )}
                    </div>
                ) : (
                    <span className="font-mono text-xl text-muted-foreground">--</span>
                )}
            </div>

            {/* Footer: Title & Next Date */}
            <div className="space-y-1 text-center">
                <Link
                    href={`/anniversaries/${item.id}`}
                    className="block truncate text-lg font-semibold text-primary transition-colors hover:text-brand-primary"
                    title={item.title}
                >
                    {item.title}
                </Link>
                <div className="text-[11px] text-muted flex items-center justify-center gap-2">
                    <IconCalendar className="h-3 w-3 opacity-70" />
                        <span>
                            {nextDate || "未知日期"}
                            {item.dateType === ANNIVERSARY_DATE_TYPE.LUNAR && item.isLeapMonth ? " (闰)" : ""}
                        </span>
                    </div>
                </div>

            {/* 移动端常驻操作入口：右上角 "编辑" 图标直达详情页，触屏无 hover 也能操作。
                桌面端 lg 及以上保留悬浮覆盖层完整操作。 */}
            <Link
                href={`/anniversaries/${item.id}`}
                aria-label="编辑或删除"
                className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-surface/80 text-secondary backdrop-blur-sm border border-divider/60 hover:text-brand-primary hover:bg-surface active:scale-95 transition-all lg:hidden"
            >
                <IconEdit aria-hidden="true" className="h-4 w-4" />
            </Link>

            {/* Hover Actions Overlay（桌面专享：hover 或 focus-within 均可触发） */}
            <div className="absolute inset-0 z-10 hidden lg:flex items-center justify-center gap-4 bg-elevated/95 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 backdrop-blur-sm p-4">
                {item.deletedAt ? (
                    <>
                        <Tooltip content="查看详情">
                            <Link
                                href={`/anniversaries/${item.id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-secondary border border-divider shadow-md hover:text-brand-primary hover:scale-110 transition-all"
                            >
                                <IconEdit className="h-5 w-5" />
                            </Link>
                        </Tooltip>
                        <form action={restoreAnniversary}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="从回收站恢复">
                                <button
                                    type="submit"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white shadow-lg shadow-success/20 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <IconArchiveRestore className="h-5 w-5" />
                                </button>
                            </Tooltip>
                        </form>
                        <form action={deleteAnniversary}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="彻底删除">
                                <ConfirmSubmitButton
                                    confirmMessage="确定彻底删除这个纪念日吗？"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-danger text-white shadow-lg shadow-danger/20 hover:bg-danger/90 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <IconTrash className="h-5 w-5" />
                                </ConfirmSubmitButton>
                            </Tooltip>
                        </form>
                    </>
                ) : (
                    <>
                        <Tooltip content="编辑资料">
                            <Link
                                href={`/anniversaries/${item.id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-110 transition-all"
                            >
                                <IconEdit className="h-5 w-5" />
                            </Link>
                        </Tooltip>
                        <form action={deleteAnniversary}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="移至回收站">
                                <ConfirmSubmitButton
                                    confirmMessage="确定删除这个纪念日吗？"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-danger border border-divider shadow-md hover:bg-danger hover:text-white hover:scale-110 active:scale-95 transition-all"
                                >
                                    <IconTrash className="h-5 w-5" />
                                </ConfirmSubmitButton>
                            </Tooltip>
                        </form>
                    </>
                )}
            </div>
        </motion.div>
    );
}
