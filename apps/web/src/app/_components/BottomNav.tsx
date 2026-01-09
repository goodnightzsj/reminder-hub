"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./Icons";
import { Magnetic } from "./Magnetic";

export function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: "/dashboard", label: "概览", icon: Icons.Dashboard },
        { href: "/todo", label: "待办", icon: Icons.Todo },
        { href: "/anniversaries", label: "纪念日", icon: Icons.Calendar },
        { href: "/subscriptions", label: "订阅", icon: Icons.CreditCard },
        { href: "/items", label: "物品", icon: Icons.Box },
    ];

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 flex h-20 items-center justify-around border-t border-white/10 bg-glass px-2 pb-safe sm:hidden transition-all duration-500">
            {links.map((link) => {
                const isActive = pathname.startsWith(link.href);

                return (
                    <Magnetic key={link.href} strength={0.3} className="flex-1">
                        <Link
                            href={link.href}
                            className={`group flex flex-col items-center justify-center gap-1 py-1 transition-all duration-300 active:scale-90 ${isActive ? "text-gradient-brand" : "text-muted hover:text-secondary"
                                }`}
                        >
                            <div className={`relative p-1.5 transition-transform duration-300 ${isActive ? "-translate-y-1" : ""}`}>
                                <link.icon className={`h-6 w-6 transition-all duration-300 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                                {isActive && (
                                    <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-primary shadow-[0_0_8px_currentColor]" />
                                )}
                            </div>
                            <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-70 translate-y-0.5"
                                }`}>
                                {link.label}
                            </span>
                        </Link>
                    </Magnetic>
                );
            })}
        </div>
    );
}
