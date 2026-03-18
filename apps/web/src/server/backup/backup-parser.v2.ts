import "server-only";

import { isRecord } from "./backup-parser.utils";

export type BackupV2 = {
  schemaVersion: 2;
  exportedAt: string;
  app: {
    timeZone: string;
    dateReminderTime?: string;
    settings?: Record<string, unknown>;
  };
  data: {
    todos: Array<Record<string, unknown>>;
    todoSubtasks: Array<Record<string, unknown>>;
    anniversaries: Array<Record<string, unknown>>;
    subscriptions: Array<Record<string, unknown>>;
    items: Array<Record<string, unknown>>;
    notificationDeliveries: Array<Record<string, unknown>>;
    digestDeliveries: Array<Record<string, unknown>>;
    serviceIcons: Array<Record<string, unknown>>;
    brandMetadata: Array<Record<string, unknown>>;
  };
};

export function parseBackupV2(value: unknown): BackupV2 | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== 2) return null;
  if (typeof value.exportedAt !== "string") return null;
  if (!isRecord(value.app) || typeof value.app.timeZone !== "string") return null;

  const dateReminderTimeValue = (value.app as Record<string, unknown>).dateReminderTime;
  if (dateReminderTimeValue !== undefined && typeof dateReminderTimeValue !== "string") return null;

  const settingsValue = (value.app as Record<string, unknown>).settings;
  if (settingsValue !== undefined && !isRecord(settingsValue)) return null;

  if (!isRecord(value.data)) return null;
  const data = value.data as Record<string, unknown>;

  const todosValue = data.todos;
  const todoSubtasksValue = data.todoSubtasks;
  const anniversariesValue = data.anniversaries;
  const subscriptionsValue = data.subscriptions;
  const itemsValue = data.items;
  const notificationDeliveriesValue = data.notificationDeliveries;
  const digestDeliveriesValue = data.digestDeliveries;
  const serviceIconsValue = data.serviceIcons;
  const brandMetadataValue = data.brandMetadata;

  if (todosValue !== undefined && !Array.isArray(todosValue)) return null;
  if (todoSubtasksValue !== undefined && !Array.isArray(todoSubtasksValue)) return null;
  if (anniversariesValue !== undefined && !Array.isArray(anniversariesValue)) return null;
  if (subscriptionsValue !== undefined && !Array.isArray(subscriptionsValue)) return null;
  if (itemsValue !== undefined && !Array.isArray(itemsValue)) return null;
  if (notificationDeliveriesValue !== undefined && !Array.isArray(notificationDeliveriesValue)) return null;
  if (digestDeliveriesValue !== undefined && !Array.isArray(digestDeliveriesValue)) return null;
  if (serviceIconsValue !== undefined && !Array.isArray(serviceIconsValue)) return null;
  if (brandMetadataValue !== undefined && !Array.isArray(brandMetadataValue)) return null;

  return {
    schemaVersion: 2,
    exportedAt: value.exportedAt,
    app: {
      timeZone: value.app.timeZone,
      dateReminderTime: typeof dateReminderTimeValue === "string" ? dateReminderTimeValue : undefined,
      settings: isRecord(settingsValue) ? settingsValue : undefined,
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
      digestDeliveries: (Array.isArray(digestDeliveriesValue)
        ? digestDeliveriesValue
        : []) as Array<Record<string, unknown>>,
      serviceIcons: (Array.isArray(serviceIconsValue)
        ? serviceIconsValue
        : []) as Array<Record<string, unknown>>,
      brandMetadata: (Array.isArray(brandMetadataValue)
        ? brandMetadataValue
        : []) as Array<Record<string, unknown>>,
    },
  };
}
