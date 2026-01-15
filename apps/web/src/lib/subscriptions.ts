export const DEFAULT_SUBSCRIPTION_CATEGORY = "其他";

export const subscriptionCategoryOptions: { value: string; label: string }[] = [
  { value: DEFAULT_SUBSCRIPTION_CATEGORY, label: DEFAULT_SUBSCRIPTION_CATEGORY },
  { value: "娱乐", label: "娱乐" },
  { value: "工具", label: "工具" },
  { value: "学习", label: "学习" },
  { value: "办公", label: "办公" },
];

export const SUBSCRIPTION_FILTER = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  ALL: "all",
  TRASH: "trash",
} as const;

export type SubscriptionFilter =
  (typeof SUBSCRIPTION_FILTER)[keyof typeof SUBSCRIPTION_FILTER];

export const subscriptionFilterValues = [
  SUBSCRIPTION_FILTER.ACTIVE,
  SUBSCRIPTION_FILTER.ARCHIVED,
  SUBSCRIPTION_FILTER.ALL,
  SUBSCRIPTION_FILTER.TRASH,
] as const satisfies readonly SubscriptionFilter[];

export const DEFAULT_SUBSCRIPTION_FILTER: SubscriptionFilter =
  SUBSCRIPTION_FILTER.ACTIVE;

export const subscriptionCycleUnitValues = ["month", "year"] as const;
export type SubscriptionCycleUnit = (typeof subscriptionCycleUnitValues)[number];

export const SUBSCRIPTION_CYCLE_UNIT = {
  MONTH: "month",
  YEAR: "year",
} as const satisfies Record<string, SubscriptionCycleUnit>;

export const DEFAULT_SUBSCRIPTION_CYCLE_UNIT: SubscriptionCycleUnit = SUBSCRIPTION_CYCLE_UNIT.MONTH;

export function isSubscriptionCycleUnit(value: string): value is SubscriptionCycleUnit {
  return (subscriptionCycleUnitValues as readonly string[]).includes(value);
}

export const subscriptionCycleUnitOptions: { value: SubscriptionCycleUnit; label: string }[] = [
  { value: SUBSCRIPTION_CYCLE_UNIT.MONTH, label: "月" },
  { value: SUBSCRIPTION_CYCLE_UNIT.YEAR, label: "年" },
];
