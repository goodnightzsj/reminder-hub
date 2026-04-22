"use client";

import { AnimatePresence, m as motion } from "framer-motion";
import { AnniversaryCard } from "./AnniversaryCard";
import { buildCreateModalHref } from "@/lib/url";
import { ROUTES } from "@/lib/routes";
import { CreateCard } from "../CreateCard";
import {
  ANNIVERSARY_FILTER,
  type AnniversaryFilter,
} from "@/app/anniversaries/_lib/anniversary-filters";

type AnniversaryListProps = {
  items: Parameters<typeof AnniversaryCard>[0][];
  filter: AnniversaryFilter;
};

export function AnniversaryList({ items, filter }: AnniversaryListProps) {
  const showCreateCard = filter === ANNIVERSARY_FILTER.ACTIVE && items.length > 0;
  return (
    <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {showCreateCard && (
          <CreateCard
            key="create-card"
            href={buildCreateModalHref(ROUTES.anniversaries)}
            label="记录新的瞬间"
          />
        )}
        {items.map(({ item, daysLeft, nextDate }, index) => (
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
            <AnniversaryCard item={item} daysLeft={daysLeft} nextDate={nextDate} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
