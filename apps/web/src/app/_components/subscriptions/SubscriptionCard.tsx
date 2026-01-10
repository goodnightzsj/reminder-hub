"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "../Badge";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { ServiceIconBadge } from "../ServiceIconBadge";
import { deleteSubscription, renewSubscription, setSubscriptionArchived, restoreSubscription } from "@/app/_actions/subscriptions";
import { SmartCategoryBadge } from "../SmartCategoryBadge";
import { Icons } from "../Icons";
import { Tooltip } from "../Tooltip";

type SubscriptionCardProps = {
    item: {
        id: string;
        name: string;
        category: string;
        priceCents: number;
        currency: string;
        cycleInterval: number;
        cycleUnit: string;
        autoRenew: boolean;
        nextRenewDate: string;
        description: string | null;
        isArchived: boolean;
        deletedAt?: Date | null;
        icon?: string | null;
        color?: string | null;
    };
    cycleLabel: string;
    daysLeft: number | null;
    progressColor: string;
    urgencyClass: string;
    preview: {
        days: number;
        label: string;
        at: Date;
    }[];
};

const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

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

// Simple Circular Progress Component
function ProgressRing({ radius, stroke, progress, color }: { radius: number; stroke: number; progress: number; color: string }) {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-muted/40"
                />
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + " " + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={`${color} transition-all duration-500`}
                />
            </svg>
        </div>
    );
}

export function SubscriptionCard({ item, cycleLabel, daysLeft, progressColor, preview }: SubscriptionCardProps) {
    // Calculate progress (Estimation)
    let totalDays = 30;
    if (item.cycleUnit === 'year') totalDays = 365;
    if (item.cycleUnit === 'week') totalDays = 7;
    totalDays = totalDays * item.cycleInterval;

    const safeDaysLeft = daysLeft ?? 0;
    const daysPassed = Math.max(0, totalDays - safeDaysLeft);
    const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

    // Calculate Daily Cost
    const dailyPriceCents = Math.round(item.priceCents / totalDays);

    // Dynamic Color for Price
    const priceColor = item.priceCents > 10000 ? "text-primary" : "text-brand-primary";

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
                                <h3 className="font-semibold text-lg text-primary leading-tight truncate">{item.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {item.deletedAt && (
                                        <SmartCategoryBadge overrideColor="red" variant="solid">
                                            已删除
                                        </SmartCategoryBadge>
                                    )}

                                    {item.isArchived && !item.deletedAt && (
                                        <SmartCategoryBadge overrideColor="slate" variant="solid">
                                            已停用
                                        </SmartCategoryBadge>
                                    )}

                                    {!item.deletedAt && !item.isArchived && (
                                        <SmartCategoryBadge overrideColor="sky" variant="solid">
                                            进行中
                                        </SmartCategoryBadge>
                                    )}

                                    <SmartCategoryBadge overrideColor="cyan">
                                        {cycleLabel}
                                    </SmartCategoryBadge>

                                    {item.category && item.category !== "其他" && (
                                        <SmartCategoryBadge>{item.category}</SmartCategoryBadge>
                                    )}

                                    {/* Reminder Moved to Date Section */}

                                    {!item.deletedAt && !item.isArchived && (
                                        item.autoRenew ? (
                                            <SmartCategoryBadge overrideColor="indigo" variant="solid">
                                                自动续费
                                            </SmartCategoryBadge>
                                        ) : (
                                            <SmartCategoryBadge overrideColor="amber" variant="solid">
                                                手动扣款
                                            </SmartCategoryBadge>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Ring Progress - Dynamic Size */}
                        {(() => {
                            // Calculate dynamic radius based on text length
                            const displayText = `${daysLeft ?? "?"}d`;
                            const textLength = displayText.length;
                            // Base radius + extra padding per character
                            const dynamicRadius = textLength >= 4 ? 28 : textLength >= 3 ? 24 : 20;
                            const strokeWidth = 3;

                            return (
                                <div className="relative shrink-0 flex items-center justify-center">
                                    <ProgressRing
                                        radius={dynamicRadius}
                                        stroke={strokeWidth}
                                        progress={progressPercent}
                                        color={daysLeft !== null && daysLeft <= 7 ? "text-warning" : "text-brand-primary"}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="font-bold text-secondary text-xs leading-none select-none">
                                            {displayText}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
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
                            <span className="font-outfit text-2xl font-bold text-brand-primary">
                                {formatPrice(dailyPriceCents, item.currency)}
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
                                        <Icons.Bell className="h-2.5 w-2.5" />
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
                            <Icons.Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-secondary">
                                续费总计: <span className="font-outfit font-bold text-primary">{formatPrice(item.priceCents, item.currency)}</span>
                            </span>
                        </div>

                    </div>
                </div>

            </div>
            {/* Hover Overlay Actions */}<div className="absolute inset-0 z-10 flex items-center justify-center gap-4 bg-elevated/95 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-sm p-4">
                {item.deletedAt ? (
                    <>
                        <Tooltip content="查看详情/编辑">
                            <Link
                                href={`/subscriptions/${item.id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-secondary border border-divider shadow-md hover:text-brand-primary hover:scale-110 transition-all"
                            >
                                <Icons.Edit className="h-5 w-5" />
                            </Link>
                        </Tooltip>
                        <form action={restoreSubscription}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="从回收站恢复">
                                <button
                                    type="submit"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white shadow-lg shadow-success/20 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <Icons.ArchiveRestore className="h-5 w-5" />
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
                                    <Icons.Trash className="h-5 w-5" />
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
                                <Icons.Edit className="h-5 w-5" />
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
                                    <Icons.Banknote className="h-6 w-6" />
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
                                    <Icons.Trash className="h-5 w-5" />
                                </ConfirmSubmitButton>
                            </Tooltip>
                        </form>
                    </>
                )}
            </div>
        </motion.div>
    );
}
