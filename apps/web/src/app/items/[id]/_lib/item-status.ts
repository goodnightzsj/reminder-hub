import { ITEM_STATUS, type ItemStatus } from "@/lib/items";

type ItemStatusBadgeVariant = "success" | "danger" | "default";

const ITEM_STATUS_BADGE_VARIANT: Record<ItemStatus, ItemStatusBadgeVariant> = {
  [ITEM_STATUS.USING]: "success",
  [ITEM_STATUS.IDLE]: "default",
  [ITEM_STATUS.RETIRED]: "danger",
};

export function getItemStatusBadgeVariant(status: ItemStatus) {
  return ITEM_STATUS_BADGE_VARIANT[status];
}

export type ItemStatusAction = {
  nextStatus: ItemStatus;
  label: string;
};

export const ITEM_STATUS_ACTIONS: Record<ItemStatus, readonly ItemStatusAction[]> = {
  [ITEM_STATUS.USING]: [
    { nextStatus: ITEM_STATUS.IDLE, label: "闲置" },
    { nextStatus: ITEM_STATUS.RETIRED, label: "淘汰" },
  ],
  [ITEM_STATUS.IDLE]: [
    { nextStatus: ITEM_STATUS.USING, label: "使用中" },
    { nextStatus: ITEM_STATUS.RETIRED, label: "淘汰" },
  ],
  [ITEM_STATUS.RETIRED]: [{ nextStatus: ITEM_STATUS.USING, label: "恢复使用" }],
};
