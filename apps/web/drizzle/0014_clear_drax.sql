PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_todos` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`task_type` text DEFAULT '个人' NOT NULL,
	`priority` text DEFAULT 'low' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`due_at` integer,
	`reminder_offsets_minutes` text DEFAULT '[]' NOT NULL,
	`recurrence_rule` text,
	`recurrence_root_id` text,
	`recurrence_next_id` text,
	`is_done` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`is_archived` integer DEFAULT false NOT NULL,
	`archived_at` integer,
	`deleted_at` integer,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_todos`("id", "title", "description", "task_type", "priority", "tags", "due_at", "reminder_offsets_minutes", "recurrence_rule", "recurrence_root_id", "recurrence_next_id", "is_done", "completed_at", "is_archived", "archived_at", "deleted_at", "created_at", "updated_at") SELECT "id", "title", "description", "task_type", "priority", "tags", "due_at", "reminder_offsets_minutes", "recurrence_rule", "recurrence_root_id", "recurrence_next_id", "is_done", "completed_at", "is_archived", "archived_at", "deleted_at", "created_at", "updated_at" FROM `todos`;--> statement-breakpoint
DROP TABLE `todos`;--> statement-breakpoint
ALTER TABLE `__new_todos` RENAME TO `todos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;