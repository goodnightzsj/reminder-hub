"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { deleteAnniversary, setAnniversaryArchived, restoreAnniversary } from "@/app/_actions/anniversaries";
import { UrgencyBadge } from "../UrgencyBadge";
import { Icons } from "../Icons";
import { Badge, getBadgeVariantFromLabel } from "../Badge";



type AnniversaryCardProps = {
    item: {
        id: string;
        title: string;
        category: string;
        date: string;
        dateType: string;
        isLeapMonth: boolean;
        isArchived: boolean;
        deletedAt?: Date | null;
    };
    daysLeft: number | null;
    nextDate: string | null;
    preview: {
        days: number;
        label: string;
        at: Date;
    }[];
};

const categoryLabels: Record<string, string> = {
    // 中文 keys
    "生日": "生日",
    "纪念日": "纪念日",
    "节日": "节日",
    // Legacy English keys
    birthday: "生日",
    anniversary: "纪念日",
    festival: "节日",
    custom: "自定义",
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
};

export function AnniversaryCard({ item, daysLeft, nextDate, preview }: AnniversaryCardProps) {
    const now = new Date();

    return (
        <motion.div
            layout
            variants={itemVariants}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-default bg-elevated p-4 shadow-sm transition-all hover:bg-muted/30`}
        >
            <div className="mb-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Badge variant={item.dateType === "lunar" ? "purple" : "blue"} className="px-1.5 py-0 text-[10px]">
                                {item.dateType === "lunar" ? "农历" : "公历"}
                            </Badge>
                            <Badge variant={getBadgeVariantFromLabel(item.category)} className="px-1.5 py-0 text-[10px]">
                                {categoryLabels[item.category] || item.category}
                            </Badge>
                        </div>
                        <Link
                            href={`/anniversaries/${item.id}`}
                            className="block truncate text-lg font-bold text-primary transition-colors hover:text-brand-primary"
                            title={item.title}
                        >
                            {item.title}
                        </Link>
                    </div>

                    {daysLeft !== null && <UrgencyBadge daysLeft={daysLeft} />}
                </div>

                {/* Bento Cell: Date Info */}
                <div className="mt-4 flex flex-col gap-2 rounded-lg bg-surface/60 p-3 border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-secondary">目标日期</span>
                        <span className="font-medium font-mono text-primary">
                            {item.dateType === "solar"
                                ? item.date
                                : `农历${item.isLeapMonth ? "闰" : ""}${item.date}`}
                        </span>
                    </div>
                    {nextDate && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-secondary">下一次</span>
                            <span className="font-medium text-brand-primary font-mono">{nextDate}</span>
                        </div>
                    )}
                </div>

                {preview.length > 0 && (
                    <div className="mt-3">
                        <div className="flex flex-wrap gap-1.5 opacity-80">
                            {preview.slice(0, 3).map((p) => {
                                const isPast = p.at.getTime() < now.getTime();
                                const isToday = p.days === 0;

                                // "Today" gets the special red badge
                                if (isToday) {
                                    return (
                                        <span
                                            key={`${item.id}:${p.days}`}
                                            className="rounded px-2 py-0.5 text-[10px] bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm shadow-red-500/25 font-medium border-0"
                                        >
                                            {p.label}
                                        </span>
                                    );
                                }

                                return (
                                    <span
                                        key={`${item.id}:${p.days}`}
                                        className={[
                                            "rounded px-1.5 py-0.5 text-[10px] border",
                                            isPast
                                                ? "bg-danger/5 text-danger border-danger/20 opacity-70"
                                                : "bg-surface text-secondary border-divider",
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

            <div className="flex items-center justify-end gap-2 border-t border-divider pt-3 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                {item.deletedAt ? (
                    <>
                        <form action={restoreAnniversary}>
                            <input type="hidden" name="id" value={item.id} />
                            <button
                                type="submit"
                                className="h-7 rounded border border-brand-primary text-brand-primary px-2 text-xs font-medium hover:bg-brand-primary hover:text-white transition-colors active-press"
                            >
                                恢复
                            </button>
                        </form>
                        <form action={deleteAnniversary}>
                            <input type="hidden" name="id" value={item.id} />
                            <ConfirmSubmitButton
                                confirmMessage="确定彻底删除这个纪念日吗？此操作无法撤销。"
                                className="h-7 rounded border border-transparent px-2 text-xs font-medium text-danger hover:bg-danger/10 active-press"
                            >
                                彻底删除
                            </ConfirmSubmitButton>
                        </form>
                    </>
                ) : (
                    <>
                        <form action={setAnniversaryArchived}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="isArchived" value={item.isArchived ? "0" : "1"} />
                            <button
                                type="submit"
                                className="h-7 rounded border border-default px-2 text-xs font-medium hover:bg-interactive-hover text-secondary active-press"
                            >
                                {item.isArchived ? "取消归档" : "归档"}
                            </button>
                        </form>

                        <form action={deleteAnniversary}>
                            <input type="hidden" name="id" value={item.id} />
                            <ConfirmSubmitButton
                                confirmMessage="确定删除这个纪念日吗？它将被移至回收站。"
                                className="h-7 rounded border border-transparent px-2 text-xs font-medium text-danger hover:bg-danger/10 active-press"
                            >
                                删除
                            </ConfirmSubmitButton>
                        </form>
                    </>
                )}
            </div>
        </motion.div>
    );
}
