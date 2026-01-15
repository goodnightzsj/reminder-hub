import type { SubscriptionCycleUnit } from "@/lib/subscriptions";

export type SubscriptionCardItemData = {
  id: string;
  name: string;
  category: string;
  priceCents: number | null;
  currency: string;
  cycleInterval: number;
  cycleUnit: SubscriptionCycleUnit;
  autoRenew: boolean;
  nextRenewDate: string;
  isArchived: boolean;
  deletedAt?: Date | null;
  icon?: string | null;
  color?: string | null;
};

export type SubscriptionCardPreviewItem = {
  days: number;
  label: string;
  at: Date;
};

