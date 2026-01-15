import "server-only";

import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  DEFAULT_NOTIFICATION_CHANNEL,
  NOTIFICATION_DELIVERY_STATUS,
  notificationChannelValues,
  notificationDeliveryStatusValues,
  notificationItemTypeValues,
  type NotificationChannel,
  type NotificationDeliveryStatus,
  type NotificationItemType,
} from "@/lib/notifications";
import { DEFAULT_ANNIVERSARY_DATE_TYPE, anniversaryDateTypeValues, type AnniversaryDateType } from "@/lib/anniversary";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { DEFAULT_ITEM_STATUS, itemStatusValues, type ItemStatus } from "@/lib/items";
import {
  DEFAULT_SUBSCRIPTION_CATEGORY,
  DEFAULT_SUBSCRIPTION_CYCLE_UNIT,
  subscriptionCycleUnitValues,
  type SubscriptionCycleUnit,
} from "@/lib/subscriptions";
import { DEFAULT_TODO_TASK_TYPE, TODO_PRIORITY, todoPriorityValues, type TodoPriority } from "@/lib/todo";
import { DEFAULT_DATE_REMINDER_TIME, DEFAULT_TIME_ZONE } from "./app-settings.constants";

export { notificationChannelValues, notificationDeliveryStatusValues, notificationItemTypeValues };
export type { NotificationChannel, NotificationDeliveryStatus, NotificationItemType };
export { anniversaryDateTypeValues };
export type { AnniversaryDateType };
export { itemStatusValues, subscriptionCycleUnitValues, todoPriorityValues };
export type { ItemStatus, SubscriptionCycleUnit, TodoPriority };

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull().default(DEFAULT_TODO_TASK_TYPE),
  priority: text("priority", { enum: todoPriorityValues })
    .notNull()
    .default(TODO_PRIORITY.LOW),
  tags: text("tags").notNull().default("[]"),
  dueAt: integer("due_at", { mode: "timestamp_ms" }),
  reminderOffsetsMinutes: text("reminder_offsets_minutes")
    .notNull()
    .default("[]"),
  recurrenceRule: text("recurrence_rule"),
  recurrenceRootId: text("recurrence_root_id"),
  recurrenceNextId: text("recurrence_next_id"),
  isDone: integer("is_done", { mode: "boolean" }).notNull().default(false),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const todoSubtasks = sqliteTable("todo_subtasks", {
  id: text("id").primaryKey(),
  todoId: text("todo_id")
    .notNull()
    .references(() => todos.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isDone: integer("is_done", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const todosRelations = relations(todos, ({ many }) => ({
  subtasks: many(todoSubtasks),
}));

export const todoSubtasksRelations = relations(todoSubtasks, ({ one }) => ({
  todo: one(todos, {
    fields: [todoSubtasks.todoId],
    references: [todos.id],
  }),
}));

export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey(),
  timeZone: text("time_zone").notNull().default(DEFAULT_TIME_ZONE),
  dateReminderTime: text("date_reminder_time").notNull().default(DEFAULT_DATE_REMINDER_TIME),
  telegramEnabled: integer("telegram_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  webhookEnabled: integer("webhook_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  webhookUrl: text("webhook_url"),
  wecomEnabled: integer("wecom_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  wecomWebhookUrl: text("wecom_webhook_url"),
  emailEnabled: integer("email_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpSecure: integer("smtp_secure", { mode: "boolean" }).notNull().default(false),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  smtpFrom: text("smtp_from"),
  smtpTo: text("smtp_to"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents"),
  category: text("category").notNull().default(DEFAULT_SUBSCRIPTION_CATEGORY),
  currency: text("currency").notNull().default(DEFAULT_CURRENCY),
  cycleUnit: text("cycle_unit", { enum: subscriptionCycleUnitValues })
    .notNull()
    .default(DEFAULT_SUBSCRIPTION_CYCLE_UNIT),
  cycleInterval: integer("cycle_interval").notNull().default(1),
  nextRenewDate: text("next_renew_date").notNull(),
  autoRenew: integer("auto_renew", { mode: "boolean" }).notNull().default(true),
  remindOffsetsDays: text("remind_offsets_days").notNull().default("[]"),
  icon: text("icon"), // Iconify ID or similar
  color: text("color"), // Hex color code
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceCents: integer("price_cents"),
  currency: text("currency").notNull().default(DEFAULT_CURRENCY),
  purchasedDate: text("purchased_date"),
  category: text("category"),
  status: text("status", { enum: itemStatusValues }).notNull().default(DEFAULT_ITEM_STATUS),
  usageCount: integer("usage_count").notNull().default(0),
  targetDailyCostCents: integer("target_daily_cost_cents"),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const anniversaries = sqliteTable("anniversaries", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("anniversary"),
  dateType: text("date_type", { enum: anniversaryDateTypeValues })
    .notNull()
    .default(DEFAULT_ANNIVERSARY_DATE_TYPE),
  isLeapMonth: integer("is_leap_month", { mode: "boolean" })
    .notNull()
    .default(false),
  date: text("date").notNull(),
  remindOffsetsDays: text("remind_offsets_days").notNull().default("[]"),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const serviceIcons = sqliteTable("service_icons", {
  name: text("name").primaryKey(), // Service name 
  icon: text("icon"), // Iconify ID
  color: text("color"), // Hex color
  lastFetchedAt: integer("last_fetched_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const notificationDeliveries = sqliteTable("notification_deliveries", {
  id: text("id").primaryKey(),
  channel: text("channel", { enum: notificationChannelValues })
    .notNull()
    .default(DEFAULT_NOTIFICATION_CHANNEL),
  itemType: text("item_type", { enum: notificationItemTypeValues }).notNull(),
  itemId: text("item_id").notNull(),
  itemTitle: text("item_title").notNull(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: notificationDeliveryStatusValues })
    .notNull()
    .default(NOTIFICATION_DELIVERY_STATUS.SENDING),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const brandMetadata = sqliteTable("brand_metadata", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  hex: text("hex").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});
