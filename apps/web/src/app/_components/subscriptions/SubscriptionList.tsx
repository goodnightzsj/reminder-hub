"use client";

import { AnimatePresence, motion } from "framer-motion";
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
};

export function SubscriptionList({ items }: SubscriptionListProps) {
    return (
        <div className="p-4 grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
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

