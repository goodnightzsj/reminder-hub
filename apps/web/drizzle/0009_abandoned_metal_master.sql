ALTER TABLE `app_settings` ADD `telegram_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `telegram_bot_token` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `telegram_chat_id` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `wecom_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `wecom_webhook_url` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `email_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `smtp_host` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `smtp_port` integer DEFAULT 587 NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `smtp_secure` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `smtp_user` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `smtp_pass` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `smtp_from` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `smtp_to` text;