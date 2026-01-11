"use client";

import Link from "next/link";
import { Icons } from "../Icons";

export type UpcomingItem =
    | {
        kind: "todo";
        at: Date;
        id: string;
        title: string;
    }
    | {
        kind: "anniversary";
        at: Date;
        id: string;
        title: string;
        dateType: "solar" | "lunar";
    }
    | {
        kind: "subscription";
        at: Date;
        id: string;
        name: string;
    };

type UpcomingListProps = {
    items: UpcomingItem[];
    timeZone: string;
};

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
                const month = u.at.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                const day = u.at.getDate();
                const time = new Intl.DateTimeFormat("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone,
                }).format(u.at);

                const getLink = () => {
                    switch (u.kind) {
                        case "todo": return `/todo/${u.id}`;
                        case "anniversary": return `/anniversaries/${u.id}`;
                        case "subscription": return `/subscriptions/${u.id}`;
                    }
                };

                const getLabel = () => {
                    switch (u.kind) {
                        case "todo": return "任务";
                        case "anniversary": return "纪念日";
                        case "subscription": return "订阅";
                    }
                };

                const getBoxColor = () => {
                    switch (u.kind) {
                        case "todo": return "bg-brand-primary";
                        case "anniversary": return "bg-pink-500";
                        case "subscription": return "bg-purple-500";
                    }
                };

                return (
                    <div key={`${u.kind}:${u.id}`} className="flex items-center gap-4 group">
                        {/* Date Box */}
                        <div className={`
                            h-14 w-14 shrink-0 rounded-2xl flex flex-col items-center justify-center text-white shadow-md transition-transform group-hover:scale-105
                            ${getBoxColor()}
                        `}>
                            <div className="text-[10px] font-bold tracking-wider opacity-80 leading-none mb-0.5">{month}</div>
                            <div className="text-xl font-bold leading-none tracking-tight">{day}</div>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <Link
                                href={getLink()}
                                className="block truncate text-base font-semibold text-primary hover:text-brand-primary transition-colors mb-0.5"
                            >
                                {u.kind === "subscription" ? (u as any).name : u.title}
                            </Link>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                <span className="opacity-80">{getLabel()}</span>
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
