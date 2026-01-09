"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchModal } from "./SearchModal";
import { Icons } from "./Icons";

export function MainNav() {
    const pathname = usePathname();

    const links = [
        { href: "/dashboard", label: "仪表盘" },
        { href: "/todo", label: "Todo" },
        { href: "/anniversaries", label: "纪念日" },
        { href: "/subscriptions", label: "订阅" },
        { href: "/items", label: "物品" },
        // Search moved to icon
        { href: "/settings", label: "设置" },
    ];

    function cn(...classes: (string | undefined | null | false)[]) {
        return classes.filter(Boolean).join(" ");
    }

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <nav className="hidden items-center gap-1 md:flex">
                {links.map(({ href, label }) => {
                    const isActive = href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "relative whitespace-nowrap px-3 py-2 text-xs font-medium transition-all duration-200 active-press",
                                "rounded-lg hover:bg-interactive-hover",
                                isActive
                                    ? "text-gradient-brand bg-surface font-semibold"
                                    : "text-secondary hover:text-primary"
                            )}
                        >
                            {label}
                            {isActive && (
                                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-primary/80 dark:bg-brand-primary" />
                            )}
                        </Link>
                    );
                })}

                <div className="mx-1 h-4 w-px bg-divider" />

                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="group flex items-center justify-center rounded-lg p-2 text-secondary hover:bg-interactive-hover hover:text-primary active-press"
                    title="搜索 (Cmd+K)"
                >
                    <Icons.Search className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                </button>
            </nav>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
