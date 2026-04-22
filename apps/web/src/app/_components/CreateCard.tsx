"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";

import { IconPlus } from "./Icons";

type CreateCardProps = {
    href: string;
    label: string;
    ariaLabel?: string;
};

export function CreateCard({ href, label, ariaLabel }: CreateCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-divider bg-surface/30 p-5 transition-all hover:border-brand-primary/50 hover:bg-brand-primary/5 active:scale-[0.98]"
        >
            <Link
                href={href}
                className="absolute inset-0 z-20"
                aria-label={ariaLabel ?? label}
            />
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-brand-primary/30">
                <IconPlus className="h-6 w-6" />
            </div>
            <span className="relative z-10 text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                {label}
            </span>
        </motion.div>
    );
}

