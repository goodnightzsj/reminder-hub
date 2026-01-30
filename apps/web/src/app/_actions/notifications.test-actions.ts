"use server";

import { redirect } from "next/navigation";

import {
  NotificationConfigError,
  sendTestNotification,
} from "@/server/notification-runner";
import { type NotificationChannel } from "@/server/notifications";
import { NOTIFICATION_CHANNEL } from "@/lib/notifications";
import { FLASH_FLAG_VALUE_FALSE, FLASH_FLAG_VALUE_TRUE, FLASH_TOAST_QUERY_KEY } from "@/lib/flash"; // lib/flash might be client safe but imported here for constants
import { withSearchParams } from "./redirect-url";
import { SETTINGS_PATH, redirectSettingsError } from "./notifications.utils";

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
