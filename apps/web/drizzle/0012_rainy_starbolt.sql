ALTER TABLE `todos` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `anniversaries` ADD `deleted_at` integer;
