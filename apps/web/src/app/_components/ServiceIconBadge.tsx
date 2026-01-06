"use client";

import { findServiceSvgIcon } from "./SimpleIconsService";

type ServiceIconBadgeProps = {
    serviceName: string;
    size?: "sm" | "md" | "lg";
    className?: string;
};

const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
};

const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
};

export function ServiceIconBadge({
    serviceName,
    size = "md",
    className = "",
}: ServiceIconBadgeProps) {
    const { path, color, title } = findServiceSvgIcon(serviceName);

    return (
        <div
            className={[
                "flex items-center justify-center rounded-lg bg-elevated border border-default",
                sizeClasses[size],
                className,
            ].join(" ")}
            title={title}
        >
            {path ? (
                <svg
                    role="img"
                    viewBox="0 0 24 24"
                    width={iconSizes[size]}
                    height={iconSizes[size]}
                    fill={color}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d={path} />
                </svg>
            ) : (
                <span
                    className="text-xs font-bold"
                    style={{ color }}
                >
                    {serviceName.charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    );
}
