"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchModal } from "../modals/SearchModal";
import { IconSearch } from "../Icons";
import { Magnetic } from "../shared/Magnetic";
import { cn } from "../../../lib/utils";
import { ROUTES } from "../../../lib/routes";

export function MainNav() {
    const pathname = usePathname();

    const links = [
        { href: ROUTES.dashboard, label: "仪表盘" },
        { href: ROUTES.todo, label: "Todo" },
        { href: ROUTES.anniversaries, label: "纪念日" },
        { href: ROUTES.subscriptions, label: "订阅" },
        { href: ROUTES.items, label: "物品" },
        // 搜索入口已改为图标按钮
        { href: ROUTES.settings, label: "设置" },
    ];

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <nav className="hidden items-center gap-1 md:flex">
                {links.map(({ href, label }) => {
                    const isActive = pathname.startsWith(href);

                    return (
                        <Magnetic key={href} strength={0.2}>
                            <Link
                                href={href}
                                className={cn(
                                    "relative whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-all duration-300",
                                    "rounded-full hover:bg-surface/80 active:scale-95",
                                    isActive
                                        ? "bg-glass border border-white/10 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                        : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                {isActive && (
                                    <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-primary/10 to-brand-secondary/5 opacity-50 pointer-events-none" />
                                )}
                                <span className={cn("relative z-10", isActive && "text-gradient-brand font-semibold")}>
                                    {label}
                                </span>
                            </Link>
                        </Magnetic>
                    );
                })}

                <div className="mx-1 h-4 w-px bg-divider" />

                <Magnetic strength={0.4}>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="group flex items-center justify-center rounded-lg p-2 text-secondary hover:bg-interactive-hover hover:text-primary active-press"
                        title="搜索 (Cmd+K)"
                    >
                        <IconSearch className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                    </button>
                </Magnetic>
            </nav>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
