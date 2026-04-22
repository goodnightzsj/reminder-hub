"use client";

import { AnimatePresence, m as motion } from "framer-motion";
import { SubscriptionCard } from "./SubscriptionCard";
import { buildCreateModalHref } from "@/lib/url";
import { ROUTES } from "@/lib/routes";
import { CreateCard } from "../CreateCard";
import {
  SUBSCRIPTION_FILTER,
  type SubscriptionFilter,
} from "@/app/subscriptions/_lib/subscription-filters";

type SubscriptionListProps = {
  items: Parameters<typeof SubscriptionCard>[0][];
  filter: SubscriptionFilter;
};

export function SubscriptionList({ items, filter }: SubscriptionListProps) {
  // 首屏空态下由页面的 EmptyState 教学化引导，这里不再重复"新建"入口避免噪音
  const showCreateCard = filter === SUBSCRIPTION_FILTER.ACTIVE && items.length > 0;
  return (
    <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {showCreateCard && (
          <CreateCard
            key="create-card"
            href={buildCreateModalHref(ROUTES.subscriptions)}
            label="新建订阅"
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
            <SubscriptionCard {...props} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
