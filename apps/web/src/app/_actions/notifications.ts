"use server";

import { redirect } from "next/navigation";

import { getAppSettings } from "@/server/db/settings";
import {
  NotificationConfigError,
  clearFailedDeliveries as clearFailedDeliveriesForChannel,
  runAllNotificationsInOrder,
  runNotificationsForChannel,
  sendTestNotification,
} from "@/server/notification-runner";
import { isNotificationChannel, NOTIFICATION_CHANNELS, type NotificationChannel } from "@/server/notifications";
import { NOTIFICATION_CHANNEL } from "@/lib/notifications";
import { FLASH_FLAG_VALUE_FALSE, FLASH_FLAG_VALUE_TRUE, FLASH_TOAST_QUERY_KEY } from "@/lib/flash";

import { parseBooleanField, parseStringField } from "./form-data";
import { withSearchParams } from "./redirect-url";
import {
  SETTINGS_PATH,
  normalizeUrl,
  parsePortStringStrict,
  revalidateSettings,
  redirectSettingsError,
  redirectSettingsSavedAfterRevalidate,
  upsertAppSettings,
  type AppSettingsUpdate,
} from "./notifications.utils";
import { type InferSelectModel } from "drizzle-orm";
import { appSettings } from "@/server/db/schema";

type AppSettings = InferSelectModel<typeof appSettings>;

type SettingsUpdater = (
  formData: FormData,
  existing: AppSettings
) => Promise<AppSettingsUpdate | null> | AppSettingsUpdate | null;

async function validateAndUpsertSettings(
  formData: FormData,
  updater: SettingsUpdater
) {
  const existing = await getAppSettings();
  const update = await updater(formData, existing);

  if (update) {
    await upsertAppSettings(existing, update);
  }

  redirectSettingsSavedAfterRevalidate();
}


export async function updateTelegramSettings(formData: FormData) {
  await validateAndUpsertSettings(formData, (data, existing) => {
    const enabled = parseBooleanField(data, "telegramEnabled") ?? false;
    const token = parseStringField(data, "telegramBotToken");
    const chatId = parseStringField(data, "telegramChatId");

    if (enabled && !token && !existing.telegramBotToken) {
      redirectSettingsError("missing-telegram-token");
    }
    if (enabled && !chatId && !existing.telegramChatId) {
      redirectSettingsError("missing-telegram-chat-id");
    }

    const set: AppSettingsUpdate = { telegramEnabled: enabled };
    if (token) set.telegramBotToken = token;
    if (chatId) set.telegramChatId = chatId;
    return set;
  });
}

export async function updateWebhookSettings(formData: FormData) {
  await validateAndUpsertSettings(formData, (data) => {
    const enabled = parseBooleanField(data, "webhookEnabled") ?? false;
    const rawUrl = parseStringField(data, "webhookUrl");
    const webhookUrl = rawUrl ? normalizeUrl(rawUrl) : null;

    if (enabled && !webhookUrl) redirectSettingsError("missing-webhook-url");
    if (rawUrl && !webhookUrl) redirectSettingsError("invalid-webhook-url");

    const set: AppSettingsUpdate = { webhookEnabled: enabled };
    if (webhookUrl) set.webhookUrl = webhookUrl;
    return set;
  });
}

export async function updateWecomSettings(formData: FormData) {
  await validateAndUpsertSettings(formData, (data) => {
    const enabled = parseBooleanField(data, "wecomEnabled") ?? false;
    const rawUrl = parseStringField(data, "wecomWebhookUrl");
    const wecomWebhookUrl = rawUrl ? normalizeUrl(rawUrl) : null;

    if (enabled && !wecomWebhookUrl) redirectSettingsError("missing-wecom-webhook-url");
    if (rawUrl && !wecomWebhookUrl) redirectSettingsError("invalid-wecom-webhook-url");

    const set: AppSettingsUpdate = { wecomEnabled: enabled };
    if (wecomWebhookUrl) set.wecomWebhookUrl = wecomWebhookUrl;
    return set;
  });
}

export async function updateEmailSettings(formData: FormData) {
  await validateAndUpsertSettings(formData, (data, existing) => {
    const enabled = parseBooleanField(data, "emailEnabled") ?? false;
    const smtpHost = parseStringField(data, "smtpHost");
    const smtpFrom = parseStringField(data, "smtpFrom");
    const smtpTo = parseStringField(data, "smtpTo");
    const smtpUser = parseStringField(data, "smtpUser");
    const smtpPass = parseStringField(data, "smtpPass");
    const smtpPortText = parseStringField(data, "smtpPort");
    const smtpPort = smtpPortText ? parsePortStringStrict(smtpPortText) : null;
    const smtpSecure = parseBooleanField(data, "smtpSecure") ?? false;

    if (enabled && !smtpHost && !existing.smtpHost) redirectSettingsError("missing-smtp-host");
    if (enabled && !smtpFrom && !existing.smtpFrom) redirectSettingsError("missing-smtp-from");
    if (enabled && !smtpTo && !existing.smtpTo) redirectSettingsError("missing-smtp-to");
    if (smtpPortText && smtpPort === null) redirectSettingsError("invalid-smtp-port");

    if (
      (smtpUser && !smtpPass && !existing.smtpPass) ||
      (!smtpUser && smtpPass && !existing.smtpUser)
    ) {
      redirectSettingsError("missing-smtp-auth");
    }

    const set: AppSettingsUpdate = { emailEnabled: enabled };
    if (smtpHost !== null) set.smtpHost = smtpHost;
    if (smtpFrom !== null) set.smtpFrom = smtpFrom;
    if (smtpTo !== null) set.smtpTo = smtpTo;
    if (smtpPort !== null) set.smtpPort = smtpPort;
    set.smtpSecure = smtpSecure;
    if (smtpUser !== null) set.smtpUser = smtpUser;
    if (smtpPass !== null) set.smtpPass = smtpPass;

    return set;
  });
}

async function sendTestForChannel(channel: NotificationChannel) {
  try {
    await sendTestNotification(channel);
  } catch (err) {
    if (err instanceof NotificationConfigError) {
      redirectSettingsError(err.code);
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(
      withSearchParams(SETTINGS_PATH, {
        [FLASH_TOAST_QUERY_KEY.TEST_CHANNEL]: channel,
        [FLASH_TOAST_QUERY_KEY.TEST]: FLASH_FLAG_VALUE_FALSE,
        [FLASH_TOAST_QUERY_KEY.MESSAGE]: message,
      }),
    );
  }

  redirect(
    withSearchParams(SETTINGS_PATH, {
      [FLASH_TOAST_QUERY_KEY.TEST_CHANNEL]: channel,
      [FLASH_TOAST_QUERY_KEY.TEST]: FLASH_FLAG_VALUE_TRUE,
    }),
  );
}

export async function sendTestTelegram() {
  await sendTestForChannel(NOTIFICATION_CHANNEL.TELEGRAM);
}

export async function sendTestWebhook() {
  await sendTestForChannel(NOTIFICATION_CHANNEL.WEBHOOK);
}

export async function sendTestWecom() {
  await sendTestForChannel(NOTIFICATION_CHANNEL.WECOM);
}

export async function sendTestEmail() {
  await sendTestForChannel(NOTIFICATION_CHANNEL.EMAIL);
}

async function runNotificationsForChannelAndRedirect(channel: NotificationChannel) {
  try {
    const { sent, failed, skipped } = await runNotificationsForChannel(channel);
    revalidateSettings();
    redirect(
      withSearchParams(SETTINGS_PATH, {
        [FLASH_TOAST_QUERY_KEY.NOTIFY_CHANNEL]: channel,
        [FLASH_TOAST_QUERY_KEY.NOTIFY_SENT]: sent,
        [FLASH_TOAST_QUERY_KEY.NOTIFY_FAILED]: failed,
        [FLASH_TOAST_QUERY_KEY.NOTIFY_SKIPPED]: skipped,
      }),
    );
  } catch (err) {
    if (err instanceof NotificationConfigError) {
      redirectSettingsError(err.code);
    }
    throw err;
  }
}

export async function runTelegramNotifications() {
  await runNotificationsForChannelAndRedirect(NOTIFICATION_CHANNEL.TELEGRAM);
}

export async function runWebhookNotifications() {
  await runNotificationsForChannelAndRedirect(NOTIFICATION_CHANNEL.WEBHOOK);
}

export async function runWecomNotifications() {
  await runNotificationsForChannelAndRedirect(NOTIFICATION_CHANNEL.WECOM);
}

export async function runEmailNotifications() {
  await runNotificationsForChannelAndRedirect(NOTIFICATION_CHANNEL.EMAIL);
}

export async function runAllNotifications() {
  const results = await runAllNotificationsInOrder(NOTIFICATION_CHANNELS);

  const summary = results
    .map((r) => `${r.channel}:${r.sent}/${r.failed}/${r.skipped}`)
    .join(",");

  revalidateSettings();
  redirect(withSearchParams(SETTINGS_PATH, {
    [FLASH_TOAST_QUERY_KEY.NOTIFY_CHANNEL]: "all",
    [FLASH_TOAST_QUERY_KEY.NOTIFY_SUMMARY]: summary,
  }));
}

export async function clearFailedDeliveries(formData: FormData) {
  const channelRaw = parseStringField(formData, "channel");
  const channel = channelRaw && isNotificationChannel(channelRaw) ? channelRaw : null;
  if (!channel) redirect(SETTINGS_PATH);

  await clearFailedDeliveriesForChannel(channel);

  revalidateSettings();
  redirect(withSearchParams(SETTINGS_PATH, {
    [FLASH_TOAST_QUERY_KEY.NOTIFY_CHANNEL]: channel,
    [FLASH_TOAST_QUERY_KEY.NOTIFY_CLEARED]: FLASH_FLAG_VALUE_TRUE,
  }));
}
