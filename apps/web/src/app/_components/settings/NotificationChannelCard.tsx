"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

type ChannelStatus = "bound" | "unbound" | "disabled";

type NotificationChannelCardPropsBase = {
    /** 渠道名称 */
    name: string;
    /** Iconify 图标 ID */
    icon: string;
    /** 品牌色 (用于图标) */
    brandColor: string;
    /** 绑定状态 */
    status: ChannelStatus;
    /** 状态文本（如"已绑定"、"未绑定"、绑定的账号名等） */
    statusText: string;
    /** 操作按钮文本 */
    actionLabel: string;
};

type NotificationChannelCardProps =
    | (NotificationChannelCardPropsBase & { onAction: () => void; actionHref?: never })
    | (NotificationChannelCardPropsBase & { onAction?: never; actionHref: string });

/**
 * 通知渠道卡片组件
 * 参照用户提供的参考图设计：品牌图标 + 名称 + 状态 + 操作按钮
 */
export function NotificationChannelCard({
    ...props
}: NotificationChannelCardProps) {
    const { name, icon, brandColor, status, statusText, actionLabel } = props;
    const isBound = status === "bound";
    const isDisabled = status === "disabled";

    return (
        <div className="group relative flex items-center justify-between gap-4 rounded-xl border border-default bg-elevated p-4 shadow-sm transition-all duration-200 hover:border-brand-primary/30 hover:shadow-md hover:shadow-brand-primary/5">
            {/* 左侧：图标 + 名称 + 状态 */}
            <div className="flex items-center gap-3">
                {/* 品牌图标 */}
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface"
                    style={{ color: brandColor }}
                >
                    {icon ? (
                        <Icon icon={icon} className="h-6 w-6" />
                    ) : (
                        <span className="text-sm font-bold">{name.charAt(0).toUpperCase()}</span>
                    )}
                </div>

                {/* 名称 + 状态 */}
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary">{name}</span>
                    <span
                        className={`text-xs ${isBound ? "text-brand-primary" : "text-muted"}`}
                    >
                        {statusText}
                    </span>
                </div>
            </div>

            {/* 右侧：操作按钮 */}
            {/* 右侧：操作按钮 */}
            {props.onAction ? (
                <button
                    onClick={props.onAction}
                    className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer ${isBound
                            ? "bg-brand-primary text-white hover:bg-brand-secondary"
                            : isDisabled
                                ? "border border-divider text-muted hover:bg-muted/10"
                                : "border border-divider text-secondary hover:bg-interactive-hover"
                        }`}
                >
                    {actionLabel}
                </button>
            ) : (
                <Link
                    href={props.actionHref}
                    className={`shrink-0 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${isBound
                            ? "bg-brand-primary text-white hover:bg-brand-secondary"
                            : isDisabled
                                ? "border border-divider text-muted hover:bg-muted/10"
                                : "border border-divider text-secondary hover:bg-interactive-hover"
                        }`}
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
