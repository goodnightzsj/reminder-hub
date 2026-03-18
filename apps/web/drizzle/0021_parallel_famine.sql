CREATE TABLE `digest_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`digest_type` text NOT NULL,
	`channel` text DEFAULT 'webhook' NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`status` text DEFAULT 'sending' NOT NULL,
	`sent_at` integer,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_digest_deliveries_channel` ON `digest_deliveries` (`channel`);--> statement-breakpoint
CREATE INDEX `idx_digest_deliveries_digest_type` ON `digest_deliveries` (`digest_type`);--> statement-breakpoint
CREATE INDEX `idx_digest_deliveries_period_start` ON `digest_deliveries` (`period_start`);--> statement-breakpoint
CREATE INDEX `idx_digest_deliveries_status` ON `digest_deliveries` (`status`);