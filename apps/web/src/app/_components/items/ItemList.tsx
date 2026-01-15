"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ItemCard } from "./ItemCard";
import { buildCreateModalHref } from "@/lib/url";
import { ROUTES } from "@/lib/routes";
import { CreateCard } from "../CreateCard";
import { ITEM_FILTER, type ItemFilter } from "@/app/items/_lib/item-filters";

type ItemListProps = {
  items: Parameters<typeof ItemCard>[0][];
  filter: ItemFilter;
};

export function ItemList({ items, filter }: ItemListProps) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {filter === ITEM_FILTER.USING && (
          <CreateCard
            key="create-card"
            href={buildCreateModalHref(ROUTES.items)}
            label="添加新物品"
          />
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
            <ItemCard {...props} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
