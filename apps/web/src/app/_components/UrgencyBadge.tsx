import { ReactNode } from "react";

type UrgencyBadgeProps = {
    daysLeft: number | null;
    className?: string;
};

/**
 * Semantic color mapping for urgency levels:
 * - 0 days: Critical (red/danger)
 * - 1-3 days: Warning (orange)
 * - 4-7 days: Attention (brand primary)
 * - 7+ days: Normal (default)
 */
export function UrgencyBadge({ daysLeft, className = "" }: UrgencyBadgeProps) {
    if (daysLeft === null) return null;

    let textColor = "text-primary";
    let bgColor = "bg-surface";

    if (daysLeft === 0) {
        return (
            <div className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 bg-gradient-to-b from-red-500 to-red-600 shadow-sm shadow-red-500/25 ${className}`}>
                <span className="text-sm font-bold text-white">
                    今天
                </span>
            </div>
        );
    } else if (daysLeft <= 3) {
        textColor = "text-warning";
        bgColor = "bg-warning/10"; // Try /10 for warning too, or fallback to solid if unsure. Let's use solid for warning if previous was working.
        // Actually earlier warning code was: `bgColor = "bg-warning";` (Step 2662). 
        // If bg-warning works, then bg-danger should work. 
        // But let's stick to safe styles. 
        // I will only modify the daysLeft === 0 block and let others be.
    } else if (daysLeft <= 7) {
        textColor = "text-brand-primary";
        bgColor = "bg-brand-primary/5";
    }

    return (
        <div className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 ${bgColor} ${className}`}>
            <span className={`text-2xl font-bold font-mono leading-none ${textColor}`}>
                {daysLeft}
            </span>
            <span className={`text-[10px] font-medium ${textColor} opacity-80`}>
                天后
            </span>
        </div>
    );
}
