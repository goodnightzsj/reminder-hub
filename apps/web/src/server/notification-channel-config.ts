import "server-only";

import { NOTIFICATION_CHANNEL, type NotificationChannel } from "@/lib/notifications";
import type { FlashErrorCode } from "@/lib/flash";

import type { getAppSettings } from "@/server/db/settings";

type AppSettings = Awaited<ReturnType<typeof getAppSettings>>;

export class NotificationConfigError extends Error {
  readonly code: FlashErrorCode;

  constructor(code: FlashErrorCode) {
    super(code);
    this.code = code;
  }
}

export function assertNotificationChannelConfig(settings: AppSettings, channel: NotificationChannel) {
  if (channel === NOTIFICATION_CHANNEL.TELEGRAM) {
    if (!settings.telegramEnabled) throw new NotificationConfigError("telegram-disabled");
    if (!settings.telegramBotToken) throw new NotificationConfigError("missing-telegram-token");
    if (!settings.telegramChatId) throw new NotificationConfigError("missing-telegram-chat-id");
    return;
  }

  if (channel === NOTIFICATION_CHANNEL.WEBHOOK) {
    if (!settings.webhookEnabled) throw new NotificationConfigError("webhook-disabled");
    if (!settings.webhookUrl) throw new NotificationConfigError("missing-webhook-url");
    return;
  }

  if (channel === NOTIFICATION_CHANNEL.WECOM) {
    if (!settings.wecomEnabled) throw new NotificationConfigError("wecom-disabled");
    if (settings.wecomPushType === "app") {
      if (!settings.wecomCorpId) throw new NotificationConfigError("missing-wecom-corp-id");
      if (!settings.wecomAgentId) throw new NotificationConfigError("missing-wecom-agent-id");
      if (!settings.wecomAppSecret) throw new NotificationConfigError("missing-wecom-app-secret");
    } else {
      if (!settings.wecomWebhookUrl) throw new NotificationConfigError("missing-wecom-webhook-url");
    }
    return;
  }

  if (channel === NOTIFICATION_CHANNEL.FEISHU) {
    if (!settings.feishuEnabled) throw new NotificationConfigError("feishu-disabled");
    if (!settings.feishuWebhookUrl) throw new NotificationConfigError("missing-feishu-webhook-url");
    return;
  }

  if (channel === NOTIFICATION_CHANNEL.EMAIL) {
    if (!settings.emailEnabled) throw new NotificationConfigError("email-disabled");
    if (!settings.smtpHost) throw new NotificationConfigError("missing-smtp-host");
    if (!settings.smtpFrom) throw new NotificationConfigError("missing-smtp-from");
    if (!settings.smtpTo) throw new NotificationConfigError("missing-smtp-to");
  }
}

