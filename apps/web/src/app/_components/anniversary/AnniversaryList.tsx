"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Icons } from "../Icons";
import { AnniversaryCard } from "./AnniversaryCard";

type AnniversaryListProps = {
    items: {
        item: any; // Using any for simplicity in rapid refactor, ideally infer from schema
        daysLeft: number | null;
        nextDate: string | null;
        preview: any[];
    }[];
    filter: string;
};

export function AnniversaryList({ items, filter }: AnniversaryListProps) {
    return (
        <div className="border-t border-divider p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
                {filter === "active" && (
                    <motion.div
                        key="create-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-divider bg-surface/30 p-5 transition-all hover:border-brand-primary/50 hover:bg-brand-primary/5 active:scale-[0.98]"
                    >
                        <Link
                            href="/anniversaries?modal=create"
                            className="absolute inset-0 z-20"
                            aria-label="记录新的瞬间"
                        />
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-brand-primary/30">
                            <Icons.Plus className="h-6 w-6" />
                        </div>
                        <span className="relative z-10 text-sm font-medium text-secondary group-hover:text-primary transition-colors">记录新的瞬间</span>
                    </motion.div>
                )}
                {items.map(({ item, daysLeft, nextDate, preview }, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                        }}
                    >
                        <AnniversaryCard
                            item={item}
                            daysLeft={daysLeft}
                            nextDate={nextDate}
                            preview={preview}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

