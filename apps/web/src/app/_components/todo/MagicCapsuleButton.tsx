"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Icons } from "../Icons";
import { motion } from "framer-motion";

export function MagicCapsuleButton() {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Preserve existing params and add modal=create
    const getHref = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("modal", "create");
        return `${pathname}?${params.toString()}`;
    };

    return (
        <Link
            href={getHref()}
            scroll={false}
            className="group relative flex items-center gap-2 rounded-full px-4 py-1.5 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-brand-primary/25 active:scale-95"
        >
            {/* Gradient Background & Border Simulation */}
            <div className="absolute inset-0 bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors" />
            <div className="absolute inset-0 rounded-full border border-brand-primary/20 group-hover:border-brand-primary/40 transition-colors" />

            {/* Shimmer Effect */}
            <motion.div
                className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer"
                initial={false}
            />

            {/* Icon & Text */}
            <Icons.Plus className="relative z-10 h-4 w-4 text-brand-primary transition-transform group-hover:rotate-90 group-active:rotate-90" />
            <span className="relative z-10 text-sm font-medium text-brand-primary">
                新建待办
            </span>
        </Link>
    );
}
