/**
 * Shared record types between server and client.
 * Must stay in sync with apps/web/src/server/api/serializers.ts
 * and apps/web/src/server/db/schema.ts.
 */

export type IsoDate = string; // e.g. "2026-04-24T11:30:47.000Z"

export type TodoPriority = "low" | "medium" | "high" | "urgent";

export type TodoRecord = {
  id: string;
  title: string;
  description: string | null;
  taskType: string;
  priority: TodoPriority;
  tags: string[];
  dueAt: IsoDate | null;
  reminderOffsetsMinutes: number[];
  recurrenceRule: string | null;
  recurrenceRootId: string | null;
  recurrenceNextId: string | null;
  isDone: boolean;
  completedAt: IsoDate | null;
  isArchived: boolean;
  archivedAt: IsoDate | null;
  deletedAt: IsoDate | null;
  createdAt: IsoDate | null;
  updatedAt: IsoDate | null;
};

export type AnniversaryDateType = "solar" | "lunar";

export type AnniversaryRecord = {
  id: string;
  title: string;
  category: string;
  dateType: AnniversaryDateType;
  isLeapMonth: boolean;
  date: string; // YYYY-MM-DD
  remindOffsetsDays: number[];
  isArchived: boolean;
  archivedAt: IsoDate | null;
  deletedAt: IsoDate | null;
  createdAt: IsoDate | null;
  updatedAt: IsoDate | null;
};

export type SubscriptionCycleUnit = "day" | "week" | "month" | "year";

export type SubscriptionRecord = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  category: string;
  currency: string;
  cycleUnit: SubscriptionCycleUnit;
  cycleInterval: number;
  nextRenewDate: string;
  autoRenew: boolean;
  remindOffsetsDays: number[];
  icon: string | null;
  color: string | null;
  isArchived: boolean;
  archivedAt: IsoDate | null;
  deletedAt: IsoDate | null;
  createdAt: IsoDate | null;
  updatedAt: IsoDate | null;
};

export type ItemStatus = "active" | "idle" | "retired";

export type ItemRecord = {
  id: string;
  name: string;
  priceCents: number | null;
  currency: string;
  purchasedDate: string | null;
  category: string | null;
  status: ItemStatus;
  usageCount: number;
  targetDailyCostCents: number | null;
  deletedAt: IsoDate | null;
  createdAt: IsoDate | null;
  updatedAt: IsoDate | null;
};

export type ListFilters = {
  includeDeleted?: boolean;
  includeArchived?: boolean;
};

export type SyncChanges = {
  todos: TodoRecord[];
  anniversaries: AnniversaryRecord[];
  subscriptions: SubscriptionRecord[];
  items: ItemRecord[];
};

export type SyncRequest = {
  since: IsoDate | null;
  changes: Partial<SyncChanges>;
};

export type SyncResponse = {
  serverTime: IsoDate;
  changes: SyncChanges;
};
