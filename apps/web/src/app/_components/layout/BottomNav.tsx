"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m as motion } from "framer-motion";
import { IconBox, IconCalendar, IconCreditCard, IconDashboard, IconTodo } from "../Icons";
import { Magnetic } from "../shared/Magnetic";
import { ROUTES } from "../../../lib/routes";

export function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: ROUTES.dashboard, label: "概览", icon: IconDashboard },
        { href: ROUTES.todo, label: "待办", icon: IconTodo },
        { href: ROUTES.anniversaries, label: "纪念日", icon: IconCalendar },
        { href: ROUTES.subscriptions, label: "订阅", icon: IconCreditCard },
        { href: ROUTES.items, label: "物品", icon: IconBox },
    ];

    return (
        <nav
            aria-label="底部导航"
            className="fixed bottom-0 inset-x-0 z-50 flex h-20 items-stretch justify-around border-t border-white/10 bg-glass px-2 pb-safe md:hidden"
        >
            {links.map((link) => {
                const isActive = pathname.startsWith(link.href);

                return (
                    <Magnetic key={link.href} strength={0.3} className="flex-1">
                        <Link
                            href={link.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`group relative flex h-full min-h-[44px] flex-col items-center justify-center gap-1 py-1 transition-colors duration-200 active:scale-95 ${
                                isActive ? "text-brand-primary" : "text-muted hover:text-secondary"
                            }`}
                        >
                            {/* 顶部活跃指示条：pill 形态，用 layoutId 在路由间平滑迁移 */}
                            {isActive && (
                                <motion.span
                                    layoutId="bottom-nav-indicator"
                                    className="absolute left-4 right-4 top-1 h-[3px] rounded-full bg-brand-primary"
                                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                                />
                            )}
                            <div className={`relative p-1.5 transition-transform duration-300 ${isActive ? "-translate-y-0.5" : ""}`}>
                                <link.icon
                                    aria-hidden="true"
                                    className={`h-6 w-6 transition-all duration-200 ${isActive ? "stroke-[2.25px]" : "stroke-2"}`}
                                />
                            </div>
                            <span
                                className={`text-[10px] font-medium transition-opacity ${
                                    isActive ? "opacity-100" : "opacity-70"
                                }`}
                            >
                                {link.label}
                            </span>
                        </Link>
                    </Magnetic>
                );
            })}
        </nav>
    );
}
