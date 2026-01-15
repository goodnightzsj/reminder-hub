import { ITEM_STATUS, isItemStatus, type ItemStatus } from "@/lib/items";
import { TODO_PRIORITY, type TodoPriority } from "@/lib/todo";

type TodoPriorityBadgeVariant = "danger" | "warning" | "success";

export const todoPriorityBadgeConfig: Record<TodoPriority, { variant: TodoPriorityBadgeVariant; label: string }> = {
  [TODO_PRIORITY.HIGH]: { variant: "danger", label: "高优先级" },
  [TODO_PRIORITY.MEDIUM]: { variant: "warning", label: "中优先级" },
  [TODO_PRIORITY.LOW]: { variant: "success", label: "低优先级" },
} as const;

type ItemStatusBadgeVariant = "success" | "warning" | "danger";

const ITEM_STATUS_BADGE_VARIANT: Record<ItemStatus, ItemStatusBadgeVariant> = {
  [ITEM_STATUS.USING]: "success",
  [ITEM_STATUS.IDLE]: "warning",
  [ITEM_STATUS.RETIRED]: "danger",
};

export function getItemStatusBadgeVariant(status: string) {
  return isItemStatus(status) ? ITEM_STATUS_BADGE_VARIANT[status] : "danger";
}
