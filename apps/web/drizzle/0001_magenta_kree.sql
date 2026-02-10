CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`time_zone` text DEFAULT 'Asia/Shanghai' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
