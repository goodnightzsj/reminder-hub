"use client";

import Link from "next/link";

import type { UpcomingItem } from "./UpcomingList.types";
import { ROUTES } from "@/lib/routes";

export type { UpcomingItem } from "./UpcomingList.types";

type UpcomingListProps = {
    items: UpcomingItem[];
    timeZone: string;
};

const UPCOMING_KIND_META = {
    todo: { hrefPrefix: ROUTES.todo, label: "任务", boxColor: "bg-brand-primary" },
    anniversary: { hrefPrefix: ROUTES.anniversaries, label: "纪念日", boxColor: "bg-pink-500" },
    subscription: { hrefPrefix: ROUTES.subscriptions, label: "订阅", boxColor: "bg-purple-500" },
} as const;

export function UpcomingList({ items, timeZone }: UpcomingListProps) {
    if (items.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted">
                <p className="text-sm">未来 7 天暂无安排</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((u) => {
                const month = u.at
                    .toLocaleString("en-US", { month: "short" })
                    .toUpperCase();
                const day = u.at.getDate();
                const time = new Intl.DateTimeFormat("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone,
                }).format(u.at);

                const meta = UPCOMING_KIND_META[u.kind];
                const href = `${meta.hrefPrefix}/${u.id}`;
                const title = u.kind === "subscription" ? u.name : u.title;

                return (
                    <div key={`${u.kind}:${u.id}`} className="flex items-center gap-4 group">
                        {/* Date Box */}
                        <div className={`
                            h-14 w-14 shrink-0 rounded-2xl flex flex-col items-center justify-center text-white shadow-md transition-transform group-hover:scale-105
                            ${meta.boxColor}
                        `}>
                            <div className="text-[10px] font-bold tracking-wider opacity-80 leading-none mb-0.5">{month}</div>
                            <div className="text-xl font-bold leading-none tracking-tight">{day}</div>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <Link
                                href={href}
                                title={title}
                                className="block truncate text-base font-semibold text-primary hover:text-brand-primary transition-colors mb-0.5"
                            >
                                {title}
                            </Link>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                <span className="opacity-80">{meta.label}</span>
                                <span className="text-[10px] opacity-40">•</span>
                                <span className="opacity-80 font-mono tracking-wide">{time}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
