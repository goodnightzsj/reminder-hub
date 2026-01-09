"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge, getBadgeVariantFromLabel } from "../Badge";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { ServiceIconBadge } from "../ServiceIconBadge";
import { deleteSubscription, renewSubscription, setSubscriptionArchived, restoreSubscription } from "@/app/_actions/subscriptions";

type SubscriptionCardProps = {
    item: {
        id: string;
        name: string;
        priceCents: number;
        currency: string;
        cycleInterval: number;
        cycleUnit: string;
        autoRenew: boolean;
        nextRenewDate: string;
        description: string | null;
        isArchived: boolean;
        deletedAt?: Date | null;
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
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
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

export function SubscriptionCard({ item, cycleLabel, daysLeft, progressColor, urgencyClass, preview }: SubscriptionCardProps) {
    const now = new Date();

    return (
        <motion.div
            layout
            variants={itemVariants}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-default bg-elevated p-4 shadow-sm transition-all hover:bg-muted/30`}
        >
            <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex items-start gap-4">
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

            {/* Status Badges - Bento Style */}
            <div className="mb-4 flex flex-wrap gap-2">
                {item.autoRenew ? (
                    <Badge variant="success" className="px-2 py-1 text-[11px]">
                        自动续费
                    </Badge>
                ) : (
                    <Badge variant={getBadgeVariantFromLabel("手动续期")} className="px-2 py-1 text-[11px]">
                        手动续期
                    </Badge>
                )}
                {item.isArchived && (
                    <Badge variant="secondary" className="px-2 py-1 text-[11px]">
                        已归档
                    </Badge>
                )}
            </div>

            {/* Payment Info Box - Bento Cell */}
            <div className="flex flex-col gap-3 rounded-lg bg-surface/50 p-4 border border-border/40 transition-colors hover:bg-surface/80">
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted">下期扣款</span>
                    <span className={`font-mono text-lg font-semibold tracking-tight ${urgencyClass || 'text-primary'}`}>
                        {item.nextRenewDate}
                    </span>
                </div>

                {/* Days Left Bar - Progress Indicator */}
                <div className="flex flex-col gap-1.5">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-divider/20">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: daysLeft !== null && daysLeft < 30 ? '100%' : '5%' }}
                        />
                    </div>
                    <div className="flex justify-end">
                        <span className="text-[11px] font-medium text-secondary">
                            {daysLeft !== null
                                ? (daysLeft >= 0 ? `还有 ${daysLeft} 天` : `已过期 ${Math.abs(daysLeft)} 天`)
                                : "未知"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex flex-col gap-1">
                {preview.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted">🔔 提醒</span>
                        <div className="flex flex-wrap gap-1.5 opacity-80">
                            {preview.slice(0, 3).map((p) => {
                                const isPast = p.at.getTime() < now.getTime();
                                return (
                                    <span
                                        key={`${item.id}:${p.days}`}
                                        className={[
                                            "rounded px-1.5 py-0.5 text-[10px]",
                                            isPast
                                                ? "bg-danger text-white border-transparent"
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

                {item.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted truncate">
                        {item.description}
                    </p>
                )}
            </div>

            {/* Actions - Bottom Bento Segment */}
            <div className="flex items-center justify-end gap-2 border-t border-divider pt-3 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                {item.deletedAt ? (
                    <>
                        <form action={restoreSubscription}>
                            <input type="hidden" name="id" value={item.id} />
                            <button
                                type="submit"
                                className="h-7 rounded border border-brand-primary text-brand-primary px-3 text-[11px] font-medium hover:bg-brand-primary hover:text-white transition-colors active-press"
                            >
                                恢复
                            </button>
                        </form>
                        <form action={deleteSubscription}>
                            <input type="hidden" name="id" value={item.id} />
                            <ConfirmSubmitButton
                                confirmMessage="确定彻底删除这个订阅吗？此操作无法撤销。"
                                className="h-7 rounded border border-transparent px-2 text-[11px] font-medium text-danger hover:bg-danger/10 active-press"
                            >
                                彻底删除
                            </ConfirmSubmitButton>
                        </form>
                    </>
                ) : (
                    <>
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
                            <input type="hidden" name="isArchived" value={item.isArchived ? "0" : "1"} />
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
                                confirmMessage="确定删除这个订阅吗？它将被移至回收站。"
                                className="h-7 rounded border border-transparent px-2 text-[11px] font-medium text-danger hover:bg-danger/10 active-press"
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
