"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { NumberTicker } from "../../_components/NumberTicker";
import { useEffect } from "react";

type SpendBarChartProps = {
    monthlySpendRows: { currency: string; amount: number }[];
    maxMonthlySpend: number;
};

function formatCurrencyAmount(value: number, currency: string): string {
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

export function SpendBarChart({ monthlySpendRows, maxMonthlySpend }: SpendBarChartProps) {
    return (
        <div className="rounded-xl bg-surface/50 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-semibold text-secondary uppercase tracking-wider">预估月度支出</div>
                <div className="text-[10px] text-muted bg-surface border border-border/50 px-2 py-0.5 rounded-full font-medium">
                    按币种
                </div>
            </div>

            {monthlySpendRows.length > 0 ? (
                <div className="space-y-4">
                    {monthlySpendRows.map((row, idx) => {
                        const targetWidth = (row.amount / maxMonthlySpend) * 100;

                        return (
                            <div key={row.currency} className="group">
                                <div className="flex items-baseline justify-between text-sm mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-secondary text-xs">{row.currency}</span>
                                    </div>
                                    <span className="font-bold tabular-nums text-primary flex items-baseline">
                                        <span className="text-[10px] mr-0.5 opacity-70">
                                            {formatCurrencyAmount(0, row.currency).charAt(0)}
                                        </span>
                                        <NumberTicker value={row.amount} delay={0.6 + idx * 0.1} className="text-sm" />
                                    </span>
                                </div>
                                <div className="relative h-3 w-full overflow-hidden rounded-full bg-divider/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${targetWidth}%` }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 80,
                                            damping: 15,
                                            delay: 0.4 + idx * 0.1
                                        }}
                                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary bg-[length:200%_100%] shadow-[0_2px_10px_-3px_rgba(var(--brand-primary-rgb),0.3)] group-hover:shadow-[0_4px_15px_-3px_rgba(var(--brand-primary-rgb),0.5)] transition-shadow duration-500"
                                    >
                                        {/* Gloss Layer */}
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />

                                        {/* Shimmer on hover */}
                                        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex h-24 items-center justify-center text-sm text-muted">暂无支出数据</div>
            )}
        </div>
    );
}
