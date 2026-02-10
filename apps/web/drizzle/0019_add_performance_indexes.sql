-- Migration: Add performance indexes for frequently queried columns
-- This improves query performance for common operations like:
-- - Listing non-deleted todos/subscriptions/anniversaries/items
-- - Finding todos by due date or completion status
-- - Querying pending notifications

-- Todos table indexes
CREATE INDEX IF NOT EXISTS "idx_todos_deleted_at" ON "todos" ("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_todos_is_done" ON "todos" ("is_done");
CREATE INDEX IF NOT EXISTS "idx_todos_due_at" ON "todos" ("due_at");
CREATE INDEX IF NOT EXISTS "idx_todos_is_archived" ON "todos" ("is_archived");

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS "idx_subscriptions_deleted_at" ON "subscriptions" ("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_next_renew_date" ON "subscriptions" ("next_renew_date");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_is_archived" ON "subscriptions" ("is_archived");

-- Anniversaries table indexes
CREATE INDEX IF NOT EXISTS "idx_anniversaries_deleted_at" ON "anniversaries" ("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_anniversaries_date" ON "anniversaries" ("date");
CREATE INDEX IF NOT EXISTS "idx_anniversaries_is_archived" ON "anniversaries" ("is_archived");

-- Items table indexes
CREATE INDEX IF NOT EXISTS "idx_items_deleted_at" ON "items" ("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_items_status" ON "items" ("status");

-- Notification deliveries table indexes (for cron job queries)
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_scheduled_at" ON "notification_deliveries" ("scheduled_at");
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_status" ON "notification_deliveries" ("status");
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_channel" ON "notification_deliveries" ("channel");

-- Todo subtasks index (for cascade lookups)
CREATE INDEX IF NOT EXISTS "idx_todo_subtasks_todo_id" ON "todo_subtasks" ("todo_id");
