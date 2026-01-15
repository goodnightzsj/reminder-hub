export const todoPriorityValues = ["low", "medium", "high"] as const;
export type TodoPriority = (typeof todoPriorityValues)[number];

export const DEFAULT_TODO_TASK_TYPE = "个人";

export const TODO_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const satisfies Record<string, TodoPriority>;

export const TODO_FILTER = {
  ACTIVE: "active",
  DONE: "done",
  TRASH: "trash",
  ALL: "all",
} as const;

export type TodoFilter = (typeof TODO_FILTER)[keyof typeof TODO_FILTER];

export const todoFilterValues = [
  TODO_FILTER.ACTIVE,
  TODO_FILTER.DONE,
  TODO_FILTER.TRASH,
  TODO_FILTER.ALL,
] as const satisfies readonly TodoFilter[];

export const DEFAULT_TODO_FILTER: TodoFilter = TODO_FILTER.ACTIVE;

export const DEFAULT_TODO_PRIORITY: TodoPriority = TODO_PRIORITY.MEDIUM;

export const PRIORITY_FILTER_ALL = "all" as const;

export const priorityFilterValues = [
  PRIORITY_FILTER_ALL,
  TODO_PRIORITY.LOW,
  TODO_PRIORITY.MEDIUM,
  TODO_PRIORITY.HIGH,
] as const;

export type PriorityFilter = (typeof priorityFilterValues)[number];

export function isTodoPriority(value: string): value is TodoPriority {
  return (todoPriorityValues as readonly string[]).includes(value);
}

export const todoPriorityLabels = {
  low: "低",
  medium: "中",
  high: "高",
} as const satisfies Record<TodoPriority, string>;

export const todoPriorityOptions: { value: TodoPriority; label: string }[] = [
  { value: TODO_PRIORITY.LOW, label: todoPriorityLabels.low },
  { value: TODO_PRIORITY.MEDIUM, label: todoPriorityLabels.medium },
  { value: TODO_PRIORITY.HIGH, label: todoPriorityLabels.high },
];

export const todoTaskTypeOptions: { value: string; label: string }[] = [
  { value: DEFAULT_TODO_TASK_TYPE, label: "个人" },
  { value: "公司", label: "公司" },
  { value: "生活", label: "生活" },
];

export const todoReminderOptionsMinutes = [
  { minutes: 0, label: "到期时" },
  { minutes: 10, label: "提前 10 分钟" },
  { minutes: 60, label: "提前 1 小时" },
  { minutes: 1440, label: "提前 1 天" },
  { minutes: 4320, label: "提前 3 天" },
] as const;

export type TodoReminderOption = (typeof todoReminderOptionsMinutes)[number];

export function getTodoPriorityLabel(priority: string): string {
  return isTodoPriority(priority) ? todoPriorityLabels[priority] : priority;
}
