"use client";

import { ReactNode } from "react";

type StatsCardProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    trend?: {
        value: number;
        label: string;
        positive?: boolean;
    };
    className?: string;
};

export function StatsCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    className = "",
}: StatsCardProps) {
    return (
        <div
            className={[
                "rounded-2xl border border-glass bg-glass p-4 shadow-sm hover-float",
                className,
            ].join(" ")}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted">{title}</p>
                    <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{value}</p>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span
                                className={[
                                    "text-xs font-medium",
                                    trend.positive ? "text-success" : trend.value < 0 ? "text-danger" : "text-muted",
                                ].join(" ")}
                            >
                                {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "→"} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-muted">{trend.label}</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="text-brand-primary">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

type ProgressRingProps = {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
};

export function ProgressRing({
    percentage,
    size = 60,
    strokeWidth = 6,
    className = "",
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-brand-primary transition-all duration-500"
                />
            </svg>
            <span className="absolute text-sm font-bold text-primary tabular-nums">
                {Math.round(percentage)}%
            </span>
        </div>
    );
}
