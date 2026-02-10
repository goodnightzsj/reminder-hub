CREATE TABLE `notification_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text DEFAULT 'webhook' NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL,
	`item_title` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'sending' NOT NULL,
	`sent_at` integer,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `webhook_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `webhook_url` text;