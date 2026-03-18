ALTER TABLE `app_settings` ADD `feishu_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `feishu_webhook_url` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `feishu_sign_secret` text;