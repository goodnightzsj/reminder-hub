"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AnniversaryCard } from "./AnniversaryCard";

type AnniversaryListProps = {
    items: {
        item: any; // Using any for simplicity in rapid refactor, ideally infer from schema
        daysLeft: number | null;
        nextDate: string | null;
        preview: any[];
    }[];
};

export function AnniversaryList({ items }: AnniversaryListProps) {
    return (
        <div className="border-t border-divider p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
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

