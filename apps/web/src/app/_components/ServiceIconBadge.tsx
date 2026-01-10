import { Icon } from '@iconify/react';
import { findServiceIcon } from "./IconService";

type ServiceIconBadgeProps = {
    serviceName: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    overrideIcon?: string | null;
    overrideColor?: string | null;
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
    overrideIcon,
    overrideColor,
}: ServiceIconBadgeProps) {
    const { icon: serviceIcon, color: serviceColor, title: serviceTitle } = findServiceIcon(serviceName);

    // Priority: Override -> Service Default
    const icon = overrideIcon || serviceIcon;
    const color = overrideColor || serviceColor;
    const title = serviceTitle;

    return (
        <div
            className={[
                "flex items-center justify-center rounded-lg bg-elevated border border-default",
                sizeClasses[size],
                className,
            ].join(" ")}
            title={title}
        >
            {icon ? (
                <Icon
                    icon={icon}
                    width={iconSizes[size]}
                    height={iconSizes[size]}
                    style={{ color }}
                />
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
