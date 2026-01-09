import { ReactNode } from "react";
import { Icons } from "./Icons";

type EmptyStateProps = {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
};

/**
 * Beautiful empty state component with optional icon and action button.
 * Pro Max: Uses consistent icon set and subtle glow effect.
 */
export function EmptyState({
    title = "暂无数据",
    description,
    icon,
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
            {icon ? (
                <div className="mb-4 text-muted">{icon}</div>
            ) : (
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-full bg-brand-primary/5 blur-xl" />
                    <Icons.Box className="relative h-8 w-8 text-muted" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

