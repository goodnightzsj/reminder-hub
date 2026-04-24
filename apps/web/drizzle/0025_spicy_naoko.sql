CREATE TABLE `device_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`last_active_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_device_tokens_platform` ON `device_tokens` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_device_tokens_last_active_at` ON `device_tokens` (`last_active_at`);