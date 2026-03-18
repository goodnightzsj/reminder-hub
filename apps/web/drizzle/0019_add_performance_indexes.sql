-- Migration: Add performance indexes for frequently queried columns
-- This improves query performance for common operations like:
-- - Listing non-deleted todos/subscriptions/anniversaries/items
-- - Finding todos by due date or completion status
-- - Querying pending notifications

-- Todos table indexes
CREATE INDEX IF NOT EXISTS "idx_todos_deleted_at" ON "todos" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_todos_is_done" ON "todos" ("is_done");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_todos_due_at" ON "todos" ("due_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_todos_is_archived" ON "todos" ("is_archived");--> statement-breakpoint

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS "idx_subscriptions_deleted_at" ON "subscriptions" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_next_renew_date" ON "subscriptions" ("next_renew_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_is_archived" ON "subscriptions" ("is_archived");--> statement-breakpoint

-- Anniversaries table indexes
CREATE INDEX IF NOT EXISTS "idx_anniversaries_deleted_at" ON "anniversaries" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_anniversaries_date" ON "anniversaries" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_anniversaries_is_archived" ON "anniversaries" ("is_archived");--> statement-breakpoint

-- Items table indexes
CREATE INDEX IF NOT EXISTS "idx_items_deleted_at" ON "items" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_items_status" ON "items" ("status");--> statement-breakpoint

-- Notification deliveries table indexes (for cron job queries)
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_scheduled_at" ON "notification_deliveries" ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_status" ON "notification_deliveries" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_deliveries_channel" ON "notification_deliveries" ("channel");--> statement-breakpoint

-- Todo subtasks index (for cascade lookups)
CREATE INDEX IF NOT EXISTS "idx_todo_subtasks_todo_id" ON "todo_subtasks" ("todo_id");
