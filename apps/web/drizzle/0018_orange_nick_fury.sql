CREATE TABLE `brand_metadata` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`hex` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
