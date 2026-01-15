"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { deleteItem, setItemStatus, restoreItem } from "@/app/_actions/items";
import { formatCurrencyCents } from "@/lib/format";
import { ITEM_STATUS, type ItemStatus } from "@/lib/items";
import { ROUTES } from "@/lib/routes";
import { SmartCategoryBadge } from "../SmartCategoryBadge";
import { Icons } from "../Icons";
import { Tooltip } from "../Tooltip";
import { ITEM_STATUS_ACTIONS, itemVariants } from "./ItemCard.constants";

export type ItemCardItemData = {
    id: string;
    name: string;
    category: string | null;
    status: ItemStatus;
    purchasedDate: string | null;
    priceCents: number | null;
    currency: string;
    deletedAt?: Date | null;
};

type ItemCardProps = {
    item: ItemCardItemData;
    daysUsed: number | null;
    dailyCents: number | null;
};

export function ItemCard({ item, daysUsed, dailyCents }: ItemCardProps) {
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
                        <Icons.Box className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`${ROUTES.items}/${item.id}`}
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
                        {item.status === ITEM_STATUS.USING && (
                            <SmartCategoryBadge overrideColor="emerald" variant="solid">
                                使用中
                            </SmartCategoryBadge>
                        )}
                        {item.status === ITEM_STATUS.IDLE && (
                            <SmartCategoryBadge overrideColor="amber" variant="solid">
                                <Icons.Coffee className="w-3 h-3 mr-0.5" />
                                闲置
                            </SmartCategoryBadge>
                        )}
                        {item.status === ITEM_STATUS.RETIRED && (
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
                                    {formatCurrencyCents(dailyCents, item.currency)}
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
                <span>总投入: <span className="font-mono text-primary font-medium">{item.priceCents ? formatCurrencyCents(item.priceCents, item.currency) : '--'}</span></span>
            </div>

            {/* Hover Overlay Actions */}
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-4 bg-elevated/95 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-sm p-4">
                {item.deletedAt ? (
                    <>
                        <Tooltip content="查看详情">
                            <Link
                                href={`${ROUTES.items}/${item.id}`}
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
                                href={`${ROUTES.items}/${item.id}`}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-secondary border border-divider shadow-md hover:text-brand-primary hover:scale-110 transition-all"
                            >
                                <Icons.Edit className="h-5 w-5" />
                            </Link>
                        </Tooltip>

                        {ITEM_STATUS_ACTIONS[item.status].map((action) => (
                            <form key={action.nextStatus} action={setItemStatus}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="status" value={action.nextStatus} />
                                <Tooltip content={action.tooltip}>
                                    <button type="submit" className={action.className}>
                                        {action.icon}
                                    </button>
                                </Tooltip>
                            </form>
                        ))}

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
