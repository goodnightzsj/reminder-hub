ALTER TABLE `app_settings` ADD `wecom_push_type` text DEFAULT 'webhook' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `wecom_corp_id` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `wecom_agent_id` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `wecom_app_secret` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `wecom_to_user` text;