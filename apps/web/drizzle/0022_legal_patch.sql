ALTER TABLE `app_settings` ADD `internal_scheduler_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `internal_notify_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `internal_notify_interval_seconds` integer DEFAULT 300 NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `internal_weekly_digest_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `internal_monthly_digest_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `internal_digest_time` text DEFAULT '10:00' NOT NULL;