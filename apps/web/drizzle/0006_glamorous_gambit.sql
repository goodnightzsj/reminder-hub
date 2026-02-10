CREATE TABLE `anniversaries` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'anniversary' NOT NULL,
	`date_type` text DEFAULT 'solar' NOT NULL,
	`date` text NOT NULL,
	`remind_offsets_days` text DEFAULT '[]' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
