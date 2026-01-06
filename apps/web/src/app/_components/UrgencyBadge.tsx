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
        textColor = "text-danger";
        bgColor = "bg-danger";
    } else if (daysLeft <= 3) {
        textColor = "text-warning";
        bgColor = "bg-warning";
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
