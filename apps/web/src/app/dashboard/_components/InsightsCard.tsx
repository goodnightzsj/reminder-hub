import { formatCurrencyAmount } from "@/lib/format";
import { BentoCard } from "../../_components/shared/BentoCard";
import { Icons } from "../../_components/Icons";
import { SpendBarChart } from "./SpendBarChart";

import type { LowestDailyCostItem, SpendRow } from "../_lib/dashboard-utils";

type InsightsCardProps = {
    monthlySpendRows: SpendRow[];
    lowestDailyCostItems: LowestDailyCostItem[];
};

export function InsightsCard({ monthlySpendRows, lowestDailyCostItems }: InsightsCardProps) {
    const maxMonthlySpend = Math.max(1, ...monthlySpendRows.map((r) => r.amount));

    return (
        <BentoCard title="财务与洞察" className="h-full" delay={0.35} icon={<Icons.LineChart className="h-5 w-5" />}>
            <div className="grid grid-cols-1 gap-4">
                {/* Subscription Spend - Bar Chart */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary px-1">
                        <Icons.CreditCard className="h-3.5 w-3.5 text-brand-primary" />
                        <span>订阅支出 (月度归纳)</span>
                    </div>
                    <SpendBarChart monthlySpendRows={monthlySpendRows} maxMonthlySpend={maxMonthlySpend} />
                </div>

                <div className="rounded-xl bg-surface/50 p-4 border border-border/40">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary mb-3">
                        <Icons.Package className="h-3.5 w-3.5 text-amber-500" />
                        <span>物品性价比 (日均成本 Top 3)</span>
                    </div>
                    {lowestDailyCostItems.length > 0 ? (
                        <ul className="space-y-3">
                            {lowestDailyCostItems.map((it) => (
                                <li key={it.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                                        <span className="truncate text-sm text-secondary">{it.name}</span>
                                    </div>
                                    <span className="text-sm font-mono text-muted tabular-nums">
                                        {formatCurrencyAmount(it.dailyCents / 100, it.currency)}/天
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-sm text-muted">暂无物品数据</div>
                    )}
                </div>
            </div>
        </BentoCard>
    );
}
