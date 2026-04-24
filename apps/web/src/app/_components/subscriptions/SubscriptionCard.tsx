"use client";

import { m as motion } from "framer-motion";
import Link from "next/link";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { ServiceIconBadge } from "../shared/ServiceIconBadge";
import { deleteSubscription, renewSubscription, restoreSubscription } from "@/app/_actions/subscriptions";
import { formatCurrencyCents } from "@/lib/format";
import { SUBSCRIPTION_CYCLE_UNIT } from "@/lib/subscriptions";
import { SmartCategoryBadge } from "../shared/SmartCategoryBadge";
import { IconArchiveRestore, IconBanknote, IconBell, IconEdit, IconTrash, IconWallet } from "../Icons";
import { Tooltip } from "../ui/Tooltip";
import { ProgressRing } from "./ProgressRing";
import type {
    SubscriptionCardItemData,
    SubscriptionCardPreviewItem,
} from "./SubscriptionCard.types";

export type { SubscriptionCardItemData } from "./SubscriptionCard.types";

type SubscriptionCardProps = {
    item: SubscriptionCardItemData;
    cycleLabel: string;
    daysLeft: number | null;
    preview: SubscriptionCardPreviewItem[];
};

const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

export function SubscriptionCard({ item, cycleLabel, daysLeft, preview }: SubscriptionCardProps) {
    // Calculate progress (Estimation)
    const cycleInterval = Math.max(1, Math.trunc(item.cycleInterval));
    const totalDays = (item.cycleUnit === SUBSCRIPTION_CYCLE_UNIT.YEAR ? 365 : 30) * cycleInterval;

    const safeDaysLeft = daysLeft ?? 0;
    const daysPassed = Math.max(0, totalDays - safeDaysLeft);
    const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

    // Calculate Daily Cost
    const priceCents = item.priceCents ?? 0;
    const dailyPriceCents = Math.round(priceCents / totalDays);

    const statusBadge = item.deletedAt ? (
        <SmartCategoryBadge overrideColor="red" variant="solid">
            已删除
        </SmartCategoryBadge>
    ) : item.isArchived ? (
        <SmartCategoryBadge overrideColor="slate" variant="solid">
            已停用
        </SmartCategoryBadge>
    ) : (
        <SmartCategoryBadge overrideColor="sky" variant="solid">
            进行中
        </SmartCategoryBadge>
    );

    const categoryBadge = item.category ? <SmartCategoryBadge>{item.category}</SmartCategoryBadge> : null;

    const autoRenewBadge =
        !item.deletedAt && !item.isArchived ? (
            item.autoRenew ? (
                <SmartCategoryBadge overrideColor="indigo" variant="solid">
                    自动续费
                </SmartCategoryBadge>
            ) : (
                <SmartCategoryBadge overrideColor="amber" variant="solid">
                    手动扣款
                </SmartCategoryBadge>
            )
        ) : null;

    const displayText = `${daysLeft ?? "?"}d`;
    const textLength = displayText.length;
    const dynamicRadius = textLength >= 4 ? 28 : textLength >= 3 ? 24 : 20;
    const strokeWidth = 3;
    const progressColor = daysLeft !== null && daysLeft <= 7 ? "text-warning" : "text-brand-primary";

    return (
        <motion.div
            layout
            variants={itemVariants}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-default bg-elevated shadow-sm transition-all hover:shadow-lg hover-float min-h-[220px]"
        >
            <div className="flex-1 flex flex-col">
                <div className="p-6 pb-4 relative z-10">
                    {/* Header: Icon + Name */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                            <ServiceIconBadge
                                serviceName={item.name}
                                size="md"
                                className="rounded-xl shadow-md shrink-0"
                                overrideIcon={item.icon}
                                overrideColor={item.color}
                            />
                            <div className="min-w-0 flex-1 py-0.5">
                                <h3 className="font-semibold text-lg text-primary leading-tight truncate" title={item.name}>{item.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {statusBadge}

                                    <SmartCategoryBadge>
                                        {cycleLabel}
                                    </SmartCategoryBadge>

                                    {categoryBadge}

                                    {autoRenewBadge}
                                </div>
                            </div>
                        </div>
                        {/* Ring Progress - Dynamic Size */}
                        <div className="relative shrink-0 flex items-center justify-center">
                            <ProgressRing
                                radius={dynamicRadius}
                                stroke={strokeWidth}
                                progress={progressPercent}
                                color={progressColor}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-bold text-secondary text-xs leading-none select-none">
                                    {displayText}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ticket Perforation - Relative Flow */}
                <div className="relative h-px w-full my-2">
                    <div className="absolute inset-0 border-b border-dashed border-divider/60" />
                    <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-base border border-r-default" />
                    <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-base border border-l-default" />
                </div>

                {/* Main Stats: Daily Cost (Hero) */}
                <div className="px-6 py-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">日均成本</span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-display text-2xl font-bold text-brand-primary">
                                {formatCurrencyCents(dailyPriceCents, item.currency)}
                            </span>
                            <span className="text-xs text-muted-foreground leading-none">/天</span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">下次周期</span>
                        <div className="flex flex-col items-end">
                            <span className="font-mono text-sm font-semibold text-primary">
                                {item.nextRenewDate}
                            </span>
                            {preview.length > 0 && (
                                <Tooltip content={`所有提醒: ${preview.map(p => p.label).join(", ")}`}>
                                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-brand-primary animate-pulse cursor-help">
                                        <IconBell className="h-2.5 w-2.5" />
                                        <span>{preview[0].label}{preview.length > 1 ? ` +${preview.length - 1}` : ""}</span>
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Total Price Area */}
                <div className="mt-4 flex flex-1 flex-col justify-end bg-surface/50 p-6 pt-4 border-t border-divider/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <IconWallet className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-secondary">
                                续费总计: <span className="font-display font-bold text-primary">{formatCurrencyCents(item.priceCents ?? 0, item.currency)}</span>
                            </span>
                        </div>

                    </div>
                </div>

            </div>
            {/* Hover Overlay Actions */}
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-4 bg-elevated/95 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-sm p-4">
                {item.deletedAt ? (
                    <>
                        <Tooltip content="查看详情/编辑">
                            <Link
                                href={`/subscriptions/${item.id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-secondary border border-divider shadow-md hover:text-brand-primary hover:scale-110 transition-all"
                            >
                                <IconEdit className="h-5 w-5" />
                            </Link>
                        </Tooltip>
                        <form action={restoreSubscription}>
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
                        <form action={deleteSubscription}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="彻底删除">
                                <ConfirmSubmitButton
                                    confirmMessage="确定彻底删除？"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-danger text-white shadow-lg shadow-danger/20 hover:bg-danger/90 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <IconTrash className="h-5 w-5" />
                                </ConfirmSubmitButton>
                            </Tooltip>
                        </form>
                    </>
                ) : (
                    <>
                        {/* Edit Action */}
                        <Tooltip content="编辑订阅">
                            <Link
                                href={`/subscriptions/${item.id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-secondary border border-divider shadow-md hover:text-brand-primary hover:scale-110 transition-all"
                            >
                                <IconEdit className="h-5 w-5" />
                            </Link>
                        </Tooltip>

                        {/* Renew Action */}
                        <form action={renewSubscription}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="立即续期一次">
                                <button
                                    type="submit"
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <IconBanknote className="h-6 w-6" />
                                </button>
                            </Tooltip>
                        </form>

                        {/* Delete Action */}
                        <form action={deleteSubscription}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="移至回收站">
                                <ConfirmSubmitButton
                                    confirmMessage="将订阅移至回收站？"
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
