"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Icons } from "../Icons";
import { SubscriptionCard } from "./SubscriptionCard";

type SubscriptionListProps = {
    items: {
        item: any;
        cycleLabel: string;
        daysLeft: number | null;
        progressColor: string;
        urgencyClass: string;
        preview: any[];
    }[];
    filter: string;
};

export function SubscriptionList({ items, filter }: SubscriptionListProps) {
    return (
        <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
                {filter === "active" && (
                    <motion.div
                        key="create-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-divider bg-surface/30 p-5 transition-all hover:border-brand-primary/50 hover:bg-brand-primary/5 active:scale-[0.98]"
                    >
                        <Link
                            href="/subscriptions?modal=create"
                            className="absolute inset-0 z-20"
                            aria-label="新建订阅"
                        />
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-brand-primary/30">
                            <Icons.Plus className="h-6 w-6" />
                        </div>
                        <span className="relative z-10 text-sm font-medium text-secondary group-hover:text-primary transition-colors">新建订阅</span>
                    </motion.div>
                )}
                {items.map((props, index) => (
                    <motion.div
                        key={props.item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                        }}
                    >
                        <SubscriptionCard {...props} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

