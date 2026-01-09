"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { deleteItem, setItemStatus, restoreItem } from "@/app/_actions/items";
import { Badge, getBadgeVariantFromLabel } from "../Badge";
import { Button } from "../Button";



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
    filter: string; // Used to build redirect href?
    daysUsed: number | null;
    dailyCents: number | null;
};

const statusLabel = {
    using: "使用中",
    idle: "闲置",
    retired: "淘汰",
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
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

export function ItemCard({ item, filter, daysUsed, dailyCents }: ItemCardProps) {
    // Reconstruct href for redirect if possible, or just redirect to /items?filter=...
    // In Server Component we built complex href. Here we can maybe just use simple redirect or pass it down.
    // Ideally Action accepts the path. 
    // For simplicity, let's default to "/items" or rely on the fact that `filter` prop is passed.
    // Actually, extracting `href` construction to client is fine if simple.
    const href = `/items${filter !== "active" ? `?filter=${filter}` : ""}`;

    return (
        <motion.div
            layout
            variants={itemVariants}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-default bg-elevated p-3 shadow-sm transition-all hover:bg-muted/30 hover-float`}
        >
            <div className="mb-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-secondary">
                    <Badge
                        variant={
                            item.status === 'using' ? 'success' :
                                item.status === 'retired' ? 'danger' :
                                    item.status === 'idle' ? 'warning' :
                                        'default'
                        }
                        className="px-2 py-0.5 text-[11px]"
                    >
                        {statusLabel[item.status]}
                    </Badge>
                    {item.category ? (
                        <Badge variant={getBadgeVariantFromLabel(item.category)} className="px-1.5 py-0 text-[10px]">
                            {item.category}
                        </Badge>
                    ) : null}
                </div>

                <Link
                    href={`/items/${item.id}`}
                    className="block truncate text-base font-semibold text-primary transition-colors hover:text-brand-primary hover:underline"
                    title={item.name}
                >
                    {item.name}
                </Link>

                {/* Bento Cell: Cost Info */}
                <div className="mt-3 space-y-2 rounded-lg bg-surface/50 p-3 border border-border/40">
                    {item.purchasedDate && <div className="text-xs text-muted flex justify-between"><span>购入</span> <span className="font-mono">{item.purchasedDate}</span></div>}
                    {typeof item.priceCents === "number" && (
                        <div className="text-xs text-muted flex justify-between">
                            <span>总价</span>
                            <span className="font-medium text-primary font-mono">{formatMoneyCents(item.priceCents, item.currency)}</span>
                        </div>
                    )}
                    {dailyCents !== null && (
                        <div className="text-xs flex justify-between pt-1 border-t border-divider/50">
                            <span className="text-muted">日均成本</span>
                            <span className="font-bold text-brand-primary font-mono">{formatMoneyCents(dailyCents, item.currency)}</span>
                        </div>
                    )}
                    {typeof daysUsed === "number" && (
                        <div className="text-[10px] text-right text-muted">已使用 {daysUsed} 天</div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-divider pt-3 opacity-80 group-hover:opacity-100 transition-opacity">
                {item.deletedAt ? (
                    <>
                        <form action={restoreItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <Button type="submit" variant="outline" size="sm">恢复</Button>
                        </form>
                        <form action={deleteItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <Button type="submit" variant="danger" size="sm">彻底删除</Button>
                        </form>
                    </>
                ) : (
                    <>
                        {item.status === "using" ? (
                            <>
                                <form action={setItemStatus}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="status" value="idle" />
                                    <input type="hidden" name="redirectTo" value={href} />
                                    <Button type="submit" variant="outline" size="sm">闲置</Button>
                                </form>
                                <form action={setItemStatus}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="status" value="retired" />
                                    <input type="hidden" name="redirectTo" value={href} />
                                    <Button type="submit" variant="outline" size="sm">淘汰</Button>
                                </form>
                            </>
                        ) : item.status === "idle" ? (
                            <>
                                <form action={setItemStatus}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="status" value="using" />
                                    <input type="hidden" name="redirectTo" value={href} />
                                    <Button type="submit" variant="outline" size="sm">使用</Button>
                                </form>
                                <form action={setItemStatus}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="status" value="retired" />
                                    <input type="hidden" name="redirectTo" value={href} />
                                    <Button type="submit" variant="outline" size="sm">淘汰</Button>
                                </form>
                            </>
                        ) : (
                            <form action={setItemStatus}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="status" value="using" />
                                <input type="hidden" name="redirectTo" value={href} />
                                <Button type="submit" variant="outline" size="sm">恢复使用</Button>
                            </form>
                        )}

                        <form action={deleteItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="redirectTo" value={href} />
                            <ConfirmSubmitButton
                                confirmMessage="确定删除这个物品吗？它将被移至回收站。"
                                className="h-8 rounded-md border border-transparent px-2 text-[11px] font-medium text-danger hover:bg-danger/10 active-press"
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
