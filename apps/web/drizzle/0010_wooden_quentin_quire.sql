CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer,
	`currency` text DEFAULT 'CNY' NOT NULL,
	`purchased_date` text,
	`category` text,
	`status` text DEFAULT 'using' NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`target_daily_cost_cents` integer,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
