import "server-only";

import { isRecord } from "./backup-parser.utils";

export type BackupV1 = {
  schemaVersion: 1;
  exportedAt: string;
  app: {
    timeZone: string;
    dateReminderTime?: string;
  };
  data: {
    todos: Array<Record<string, unknown>>;
    todoSubtasks: Array<Record<string, unknown>>;
    anniversaries: Array<Record<string, unknown>>;
    subscriptions: Array<Record<string, unknown>>;
    items: Array<Record<string, unknown>>;
    notificationDeliveries: Array<Record<string, unknown>>;
  };
};

export function parseBackupV1(value: unknown): BackupV1 | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== 1) return null;
  if (typeof value.exportedAt !== "string") return null;
  if (!isRecord(value.app) || typeof value.app.timeZone !== "string") return null;
  const dateReminderTimeValue = (value.app as Record<string, unknown>).dateReminderTime;
  if (dateReminderTimeValue !== undefined && typeof dateReminderTimeValue !== "string") return null;
  if (!isRecord(value.data)) return null;

  const data = value.data as Record<string, unknown>;
  const todosValue = data.todos;
  const todoSubtasksValue = data.todoSubtasks;
  const anniversariesValue = data.anniversaries;
  const subscriptionsValue = data.subscriptions;
  const itemsValue = data.items;
  const notificationDeliveriesValue = data.notificationDeliveries;

  if (todosValue !== undefined && !Array.isArray(todosValue)) return null;
  if (todoSubtasksValue !== undefined && !Array.isArray(todoSubtasksValue)) return null;
  if (anniversariesValue !== undefined && !Array.isArray(anniversariesValue)) return null;
  if (subscriptionsValue !== undefined && !Array.isArray(subscriptionsValue)) return null;
  if (itemsValue !== undefined && !Array.isArray(itemsValue)) return null;
  if (notificationDeliveriesValue !== undefined && !Array.isArray(notificationDeliveriesValue)) return null;

  return {
    schemaVersion: 1,
    exportedAt: value.exportedAt,
    app: {
      timeZone: value.app.timeZone,
      dateReminderTime: typeof dateReminderTimeValue === "string" ? dateReminderTimeValue : undefined,
    },
    data: {
      todos: (Array.isArray(todosValue) ? todosValue : []) as Array<Record<string, unknown>>,
      todoSubtasks: (Array.isArray(todoSubtasksValue)
        ? todoSubtasksValue
        : []) as Array<Record<string, unknown>>,
      anniversaries: (Array.isArray(anniversariesValue)
        ? anniversariesValue
        : []) as Array<Record<string, unknown>>,
      subscriptions: (Array.isArray(subscriptionsValue)
        ? subscriptionsValue
        : []) as Array<Record<string, unknown>>,
      items: (Array.isArray(itemsValue) ? itemsValue : []) as Array<Record<string, unknown>>,
      notificationDeliveries: (Array.isArray(notificationDeliveriesValue)
        ? notificationDeliveriesValue
        : []) as Array<Record<string, unknown>>,
    },
  };
}
