import { ReactNode } from "react";

type EmptyStateProps = {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
};

/**
 * Beautiful empty state component with optional icon and action button.
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
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
                    <svg
                        className="h-8 w-8 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                    </svg>
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
