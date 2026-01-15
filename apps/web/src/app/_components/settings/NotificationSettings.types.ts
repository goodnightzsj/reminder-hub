import type { NotificationChannel } from "@/lib/notifications";

export type ChannelType = NotificationChannel;

export type NotificationSettings = {
  telegramEnabled: boolean;
  telegramChatId: string | null;
  telegramHasBotToken: boolean;

  webhookEnabled: boolean;
  webhookUrl: string | null;

  wecomEnabled: boolean;
  wecomWebhookUrl: string | null;

  emailEnabled: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpHasPass: boolean;
  smtpFrom: string | null;
  smtpTo: string | null;
};
