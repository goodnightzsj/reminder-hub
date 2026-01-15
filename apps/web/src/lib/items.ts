export const itemStatusValues = ["using", "idle", "retired"] as const;
export type ItemStatus = (typeof itemStatusValues)[number];

export const ITEM_STATUS = {
  USING: "using",
  IDLE: "idle",
  RETIRED: "retired",
} as const satisfies Record<string, ItemStatus>;

export const DEFAULT_ITEM_STATUS: ItemStatus = ITEM_STATUS.USING;

export const ITEM_FILTER = {
  ACTIVE: "active",
  USING: "using",
  IDLE: "idle",
  RETIRED: "retired",
  ALL: "all",
  TRASH: "trash",
} as const;

export type ItemFilter = (typeof ITEM_FILTER)[keyof typeof ITEM_FILTER];

export const itemFilterValues = [
  ITEM_FILTER.ACTIVE,
  ITEM_FILTER.USING,
  ITEM_FILTER.IDLE,
  ITEM_FILTER.RETIRED,
  ITEM_FILTER.ALL,
  ITEM_FILTER.TRASH,
] as const satisfies readonly ItemFilter[];

export const DEFAULT_ITEM_FILTER: ItemFilter = ITEM_FILTER.USING;

export const DEFAULT_ITEM_CATEGORY = "其他";

export function isItemStatus(value: string): value is ItemStatus {
  return (itemStatusValues as readonly string[]).includes(value);
}

export const itemStatusLabels = {
  using: "使用中",
  idle: "闲置",
  retired: "淘汰",
} as const satisfies Record<ItemStatus, string>;

export function getItemStatusLabel(status: string): string {
  return isItemStatus(status) ? itemStatusLabels[status] : status;
}

export const itemStatusOptions: { value: ItemStatus; label: string }[] = [
  { value: ITEM_STATUS.USING, label: itemStatusLabels.using },
  { value: ITEM_STATUS.IDLE, label: itemStatusLabels.idle },
  { value: ITEM_STATUS.RETIRED, label: itemStatusLabels.retired },
];

export const itemCategoryOptions: { value: string; label: string }[] = [
  { value: DEFAULT_ITEM_CATEGORY, label: DEFAULT_ITEM_CATEGORY },
  { value: "数码", label: "数码" },
  { value: "家居", label: "家居" },
  { value: "衣物", label: "衣物" },
  { value: "虚拟", label: "虚拟" },
  { value: "运动", label: "运动" },
];

export const itemCurrencyOptions: { value: string; label: string }[] = [
  { value: "CNY", label: "CNY (人民币)" },
  { value: "USD", label: "USD (美元)" },
  { value: "JPY", label: "JPY (日元)" },
  { value: "EUR", label: "EUR (欧元)" },
  { value: "GBP", label: "GBP (英镑)" },
  { value: "HKD", label: "HKD (港币)" },
];
