"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./Icons";

export function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: "/todo", label: "待办", icon: Icons.Todo },
        { href: "/anniversaries", label: "纪念日", icon: Icons.Calendar },
        { href: "/subscriptions", label: "订阅", icon: Icons.CreditCard },
        { href: "/dashboard", label: "概览", icon: Icons.Dashboard },
        { href: "/items", label: "物品", icon: Icons.Box },
    ];

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 flex h-16 items-center justify-around border-t border-default bg-elevated/95 px-2 pb-safe backdrop-blur-lg sm:hidden">
            {links.map((link) => {
                const isActive = link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex flex-col items-center justify-center gap-0.5 p-2 transition-colors active-press ${isActive ? "text-brand-primary" : "text-muted"
                            }`}
                    >
                        <link.icon active={isActive} />
                        <span className="text-[10px] font-medium">{link.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
