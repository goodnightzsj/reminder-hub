"use client";

import { createElement } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { deleteItem, setItemStatus, restoreItem } from "@/app/_actions/items";
import { Badge } from "../Badge";
import { SmartCategoryBadge } from "../SmartCategoryBadge";
import { Button } from "../Button";
import { Icons } from "../Icons";
import { Tooltip } from "../Tooltip";

type ItemCardProps = {
    item: {
        id: string;
        name: string;
        category: string | null;
        status: "using" | "idle" | "retired";
        purchasedDate: string | null;
        priceCents: number | null;
        currency: string;
        deletedAt?: Date | null;
    };
    filter: string; // Used to build redirect href
    daysUsed: number | null;
    dailyCents: number | null;
};

const statusLabel = {
    using: "使用中",
    idle: "闲置",
    retired: "淘汰",
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
};

function formatMoneyCents(priceCents: number, currency: string): string {
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

// Category Icon Mapping (Fallback to Box)
function getCategoryIcon(category: string | null) {
    if (!category) return Icons.Box;
    const c = category.toLowerCase();
    if (c.includes("数码") || c.includes("电子") || c.includes("digital")) return Icons.Box; // Placeholder for Laptop
    if (c.includes("衣") || c.includes("服") || c.includes("fashion")) return Icons.Box; // Placeholder for Shirt
    if (c.includes("家") || c.includes("furn")) return Icons.Box; // Placeholder for Home
    return Icons.Box;
}

export function ItemCard({ item, filter, daysUsed, dailyCents }: ItemCardProps) {
    const href = `/items${filter !== "active" ? `?filter=${filter}` : ""}`;

    return (
        <motion.div
            layout
            variants={itemVariants}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-default bg-elevated p-5 shadow-sm transition-all hover:border-brand-primary/30 hover:shadow-md hover-float"
        >
            {/* Header: Icon + Name + Status */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-primary border border-border/50">
                        {createElement(getCategoryIcon(item.category), { className: "h-5 w-5" })}
                    </div>
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/items/${item.id}`}
                            className="block truncate text-base font-semibold text-primary transition-colors hover:text-brand-primary"
                            title={item.name}
                        >
                            {item.name}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            {/* Tags Row */}
                            {item.category && (
                                <SmartCategoryBadge>{item.category}</SmartCategoryBadge>
                            )}
                            {item.purchasedDate && (
                                <span>{item.purchasedDate} 购入</span>
                            )}
                        </div>
                    </div>
                </div>
                {item.deletedAt ? (
                    <SmartCategoryBadge overrideColor="red" variant="solid">
                        已删除
                    </SmartCategoryBadge>
                ) : (
                    <>
                        {item.status === "using" && (
                            <SmartCategoryBadge overrideColor="emerald" variant="solid">
                                使用中
                            </SmartCategoryBadge>
                        )}
                        {item.status === "idle" && (
                            <SmartCategoryBadge overrideColor="amber" variant="solid">
                                <Icons.Coffee className="w-3 h-3 mr-0.5" />
                                闲置
                            </SmartCategoryBadge>
                        )}
                        {item.status === "retired" && (
                            <SmartCategoryBadge overrideColor="slate">
                                <Icons.History className="w-3 h-3 mr-0.5" />
                                淘汰
                            </SmartCategoryBadge>
                        )}
                    </>
                )}
            </div>

            {/* Main Stats: Daily Cost (Hero) */}
            <div className="mt-5 flex items-end justify-between border-t border-divider/50 pt-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                        日均成本
                    </span>
                    <div className="flex items-baseline gap-1">
                        {dailyCents !== null ? (
                            <>
                                <span className="font-outfit text-2xl font-bold text-brand-primary">
                                    {formatMoneyCents(dailyCents, item.currency)}
                                </span>
                                <span className="text-xs text-muted-foreground">/天</span>
                            </>
                        ) : (
                            <span className="font-outfit text-xl text-muted-foreground">--</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-0.5 text-right">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                        已陪伴
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="font-outfit text-lg font-medium text-primary">
                            {daysUsed || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">天</span>
                    </div>
                </div>
            </div>

            {/* Total Price & Depreciation (Mini Bar) */}
            <div className="mt-4 flex items-center gap-3 text-xs text-secondary bg-surface/40 p-2 rounded-lg border border-border/30">
                <Icons.Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                <span>总投入: <span className="font-mono text-primary font-medium">{item.priceCents ? formatMoneyCents(item.priceCents, item.currency) : '--'}</span></span>
            </div>

            {/* Hover Overlay Actions */}
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-4 bg-elevated/95 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-sm p-4">
                {item.deletedAt ? (
                    <>
                        <Tooltip content="查看详情">
                            <Link
                                href={`/items/${item.id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-secondary border border-divider shadow-md hover:text-brand-primary hover:scale-110 transition-all"
                            >
                                <Icons.Edit className="h-5 w-5" />
                            </Link>
                        </Tooltip>
                        <form action={restoreItem}>
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
                        <form action={deleteItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="彻底删除">
                                <ConfirmSubmitButton
                                    confirmMessage="确定彻底删除这个物品吗？"
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
                        <Tooltip content="编辑资料">
                            <Link
                                href={`/items/${item.id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-secondary border border-divider shadow-md hover:text-brand-primary hover:scale-110 transition-all"
                            >
                                <Icons.Edit className="h-5 w-5" />
                            </Link>
                        </Tooltip>

                        {/* Status Transitions when Using */}
                        {item.status === 'using' && (
                            <>
                                <form action={setItemStatus}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="status" value="idle" />
                                    <Tooltip content="标志为'闲置'">
                                        <button
                                            type="submit"
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <Icons.Coffee className="h-5 w-5" />
                                        </button>
                                    </Tooltip>
                                </form>
                                <form action={setItemStatus}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="status" value="retired" />
                                    <Tooltip content="标志为'淘汰'">
                                        <button
                                            type="submit"
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-600 text-white shadow-lg shadow-zinc-600/20 hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <Icons.History className="h-5 w-5" />
                                        </button>
                                    </Tooltip>
                                </form>
                            </>
                        )}

                        {/* Transitions between Idle and Retired */}
                        {item.status === 'idle' && (
                            <form action={setItemStatus}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="status" value="retired" />
                                <Tooltip content="标志为'淘汰'">
                                    <button
                                        type="submit"
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-600 text-white shadow-lg shadow-zinc-600/20 hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Icons.History className="h-5 w-5" />
                                    </button>
                                </Tooltip>
                            </form>
                        )}

                        {item.status === 'retired' && (
                            <form action={setItemStatus}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="status" value="idle" />
                                <Tooltip content="标志为'闲置'">
                                    <button
                                        type="submit"
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Icons.Coffee className="h-5 w-5" />
                                    </button>
                                </Tooltip>
                            </form>
                        )}

                        {/* Restore/Status Action for Non-Using items */}
                        {item.status !== 'using' && (
                            <form action={setItemStatus}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="status" value="using" />
                                <Tooltip content="将状态恢复为'使用中'">
                                    <button
                                        type="submit"
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Icons.ArchiveRestore className="h-5 w-5" />
                                    </button>
                                </Tooltip>
                            </form>
                        )}

                        {/* Delete Action */}
                        <form action={deleteItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <Tooltip content="移至回收站">
                                <ConfirmSubmitButton
                                    confirmMessage="将物品移至回收站？"
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
