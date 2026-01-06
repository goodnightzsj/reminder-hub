import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todoPriorityValues = ["low", "medium", "high"] as const;
export type TodoPriority = (typeof todoPriorityValues)[number];

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull().default("personal"),
  priority: text("priority", { enum: todoPriorityValues })
    .notNull()
    .default("medium"),
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
  timeZone: text("time_zone").notNull().default("Asia/Shanghai"),
  dateReminderTime: text("date_reminder_time").notNull().default("09:00"),
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

export const subscriptionCycleUnitValues = ["month", "year"] as const;
export type SubscriptionCycleUnit = (typeof subscriptionCycleUnitValues)[number];

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents"),
  currency: text("currency").notNull().default("CNY"),
  cycleUnit: text("cycle_unit", { enum: subscriptionCycleUnitValues })
    .notNull()
    .default("month"),
  cycleInterval: integer("cycle_interval").notNull().default(1),
  nextRenewDate: text("next_renew_date").notNull(),
  autoRenew: integer("auto_renew", { mode: "boolean" }).notNull().default(true),
  remindOffsetsDays: text("remind_offsets_days").notNull().default("[]"),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const itemStatusValues = ["using", "idle", "retired"] as const;
export type ItemStatus = (typeof itemStatusValues)[number];

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceCents: integer("price_cents"),
  currency: text("currency").notNull().default("CNY"),
  purchasedDate: text("purchased_date"),
  category: text("category"),
  status: text("status", { enum: itemStatusValues }).notNull().default("using"),
  usageCount: integer("usage_count").notNull().default(0),
  targetDailyCostCents: integer("target_daily_cost_cents"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const anniversaryCategoryValues = [
  "birthday",
  "anniversary",
  "festival",
  "custom",
] as const;
export type AnniversaryCategory = (typeof anniversaryCategoryValues)[number];

export const anniversaryDateTypeValues = ["solar", "lunar"] as const;
export type AnniversaryDateType = (typeof anniversaryDateTypeValues)[number];

export const anniversaries = sqliteTable("anniversaries", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category", { enum: anniversaryCategoryValues })
    .notNull()
    .default("anniversary"),
  dateType: text("date_type", { enum: anniversaryDateTypeValues })
    .notNull()
    .default("solar"),
  isLeapMonth: integer("is_leap_month", { mode: "boolean" })
    .notNull()
    .default(false),
  date: text("date").notNull(),
  remindOffsetsDays: text("remind_offsets_days").notNull().default("[]"),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});

export const notificationChannelValues = [
  "telegram",
  "webhook",
  "wecom",
  "email",
] as const;
export type NotificationChannel = (typeof notificationChannelValues)[number];

export const notificationItemTypeValues = [
  "todo",
  "anniversary",
  "subscription",
] as const;
export type NotificationItemType = (typeof notificationItemTypeValues)[number];

export const notificationDeliveryStatusValues = ["sending", "sent", "failed"] as const;
export type NotificationDeliveryStatus =
  (typeof notificationDeliveryStatusValues)[number];

export const notificationDeliveries = sqliteTable("notification_deliveries", {
  id: text("id").primaryKey(),
  channel: text("channel", { enum: notificationChannelValues })
    .notNull()
    .default("webhook"),
  itemType: text("item_type", { enum: notificationItemTypeValues }).notNull(),
  itemId: text("item_id").notNull(),
  itemTitle: text("item_title").notNull(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: notificationDeliveryStatusValues })
    .notNull()
    .default("sending"),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch()*1000)`),
});
