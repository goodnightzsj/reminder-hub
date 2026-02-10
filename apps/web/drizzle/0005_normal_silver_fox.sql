CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price_cents` integer,
	`currency` text DEFAULT 'CNY' NOT NULL,
	`cycle_unit` text DEFAULT 'month' NOT NULL,
	`cycle_interval` integer DEFAULT 1 NOT NULL,
	`next_renew_date` text NOT NULL,
	`auto_renew` integer DEFAULT true NOT NULL,
	`remind_offsets_days` text DEFAULT '[]' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
