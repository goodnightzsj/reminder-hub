CREATE TABLE `service_icons` (
	`name` text PRIMARY KEY NOT NULL,
	`icon` text,
	`color` text,
	`last_fetched_at` integer,
	`created_at` integer DEFAULT (unixepoch()*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()*1000) NOT NULL
);
