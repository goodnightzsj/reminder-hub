"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ItemCard } from "./ItemCard";

type ItemListProps = {
    items: {
        item: any;
        daysUsed: number | null;
        dailyCents: number | null;
    }[];
    filter: string;
};

export function ItemList({ items, filter }: ItemListProps) {
    return (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        <ItemCard {...props} filter={filter} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

