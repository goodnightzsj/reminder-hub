"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { appSettings } from "@/server/db/schema";
import {
  NotificationConfigError,
  clearFailedDeliveries as clearFailedDeliveriesForChannel,
  runAllNotificationsInOrder,
  runNotificationsForChannel,
  sendTestNotification,
} from "@/server/notification-runner";
import type { NotificationChannel } from "@/server/notifications";

const SETTINGS_ID = "singleton";

function parseStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBooleanField(formData: FormData, key: string): boolean | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

function normalizeUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function parsePortFieldStrict(formData: FormData, key: string): number | null {
  const raw = parseStringField(formData, key);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 65535) return null;
  return parsed;
}

export async function updateTelegramSettings(formData: FormData) {
  const enabled = parseBooleanField(formData, "telegramEnabled") ?? false;
  const tokenRaw = parseStringField(formData, "telegramBotToken");
  const chatIdRaw = parseStringField(formData, "telegramChatId");

  const existing = await getAppSettings();

  const token = tokenRaw ? tokenRaw.trim() : null;
  const chatId = chatIdRaw ? chatIdRaw.trim() : null;

  if (enabled && !token && !existing.telegramBotToken) redirect("/settings?error=missing-telegram-token");
  if (enabled && !chatId && !existing.telegramChatId) redirect("/settings?error=missing-telegram-chat-id");

  const set: Partial<typeof appSettings.$inferInsert> = {
    telegramEnabled: enabled,
    updatedAt: new Date(),
  };
  if (token) set.telegramBotToken = token;
  if (chatId) set.telegramChatId = chatId;

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: existing.timeZone, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.id, set });

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function updateWebhookSettings(formData: FormData) {
  const enabled = parseBooleanField(formData, "webhookEnabled") ?? false;
  const rawUrl = parseStringField(formData, "webhookUrl");
  const webhookUrl = rawUrl ? normalizeUrl(rawUrl) : null;

  if (enabled && !webhookUrl) redirect("/settings?error=missing-webhook-url");
  if (rawUrl && !webhookUrl) redirect("/settings?error=invalid-webhook-url");

  const existing = await getAppSettings();

  const set: Partial<typeof appSettings.$inferInsert> = {
    webhookEnabled: enabled,
    updatedAt: new Date(),
  };
  if (webhookUrl) set.webhookUrl = webhookUrl;

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: existing.timeZone, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.id, set });

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function updateWecomSettings(formData: FormData) {
  const enabled = parseBooleanField(formData, "wecomEnabled") ?? false;
  const rawUrl = parseStringField(formData, "wecomWebhookUrl");
  const wecomWebhookUrl = rawUrl ? normalizeUrl(rawUrl) : null;

  if (enabled && !wecomWebhookUrl) redirect("/settings?error=missing-wecom-webhook-url");
  if (rawUrl && !wecomWebhookUrl) redirect("/settings?error=invalid-wecom-webhook-url");

  const existing = await getAppSettings();

  const set: Partial<typeof appSettings.$inferInsert> = {
    wecomEnabled: enabled,
    updatedAt: new Date(),
  };
  if (wecomWebhookUrl) set.wecomWebhookUrl = wecomWebhookUrl;

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: existing.timeZone, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.id, set });

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function updateEmailSettings(formData: FormData) {
  const enabled = parseBooleanField(formData, "emailEnabled") ?? false;

  const existing = await getAppSettings();

  const smtpHost = parseStringField(formData, "smtpHost");
  const smtpFrom = parseStringField(formData, "smtpFrom");
  const smtpTo = parseStringField(formData, "smtpTo");
  const smtpUser = parseStringField(formData, "smtpUser");
  const smtpPass = parseStringField(formData, "smtpPass");
  const smtpPortRaw = parsePortFieldStrict(formData, "smtpPort");
  const smtpSecure = parseBooleanField(formData, "smtpSecure") ?? false;

  if (enabled && !smtpHost && !existing.smtpHost) redirect("/settings?error=missing-smtp-host");
  if (enabled && !smtpFrom && !existing.smtpFrom) redirect("/settings?error=missing-smtp-from");
  if (enabled && !smtpTo && !existing.smtpTo) redirect("/settings?error=missing-smtp-to");
  if (parseStringField(formData, "smtpPort") && smtpPortRaw === null) {
    redirect("/settings?error=invalid-smtp-port");
  }

  if (
    (smtpUser && !smtpPass && !existing.smtpPass) ||
    (!smtpUser && smtpPass && !existing.smtpUser)
  ) {
    redirect("/settings?error=missing-smtp-auth");
  }

  const set: Partial<typeof appSettings.$inferInsert> = {
    emailEnabled: enabled,
    updatedAt: new Date(),
  };

  if (smtpHost !== null) set.smtpHost = smtpHost;
  if (smtpFrom !== null) set.smtpFrom = smtpFrom;
  if (smtpTo !== null) set.smtpTo = smtpTo;
  if (smtpPortRaw !== null) set.smtpPort = smtpPortRaw;
  set.smtpSecure = smtpSecure;
  if (smtpUser !== null) set.smtpUser = smtpUser;
  if (smtpPass !== null) set.smtpPass = smtpPass;

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: existing.timeZone, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.id, set });

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function sendTestTelegram() {
  try {
    await sendTestNotification("telegram");
  } catch (err) {
    if (err instanceof NotificationConfigError) redirect(`/settings?error=${err.code}`);
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(
      `/settings?testChannel=telegram&test=failed&message=${encodeURIComponent(message)}`,
    );
  }

  redirect("/settings?testChannel=telegram&test=1");
}

export async function sendTestWebhook() {
  try {
    await sendTestNotification("webhook");
  } catch (err) {
    if (err instanceof NotificationConfigError) redirect(`/settings?error=${err.code}`);
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(
      `/settings?testChannel=webhook&test=failed&message=${encodeURIComponent(message)}`,
    );
  }

  redirect("/settings?testChannel=webhook&test=1");
}

export async function sendTestWecom() {
  try {
    await sendTestNotification("wecom");
  } catch (err) {
    if (err instanceof NotificationConfigError) redirect(`/settings?error=${err.code}`);
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(
      `/settings?testChannel=wecom&test=failed&message=${encodeURIComponent(message)}`,
    );
  }

  redirect("/settings?testChannel=wecom&test=1");
}

export async function sendTestEmail() {
  try {
    await sendTestNotification("email");
  } catch (err) {
    if (err instanceof NotificationConfigError) redirect(`/settings?error=${err.code}`);
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(
      `/settings?testChannel=email&test=failed&message=${encodeURIComponent(message)}`,
    );
  }

  redirect("/settings?testChannel=email&test=1");
}

export async function runTelegramNotifications() {
  try {
    const { sent, failed, skipped } = await runNotificationsForChannel("telegram");
    revalidatePath("/settings");
    redirect(
      `/settings?notifyChannel=telegram&notifySent=${sent}&notifyFailed=${failed}&notifySkipped=${skipped}`,
    );
  } catch (err) {
    if (err instanceof NotificationConfigError) redirect(`/settings?error=${err.code}`);
    throw err;
  }
}

export async function runWebhookNotifications() {
  try {
    const { sent, failed, skipped } = await runNotificationsForChannel("webhook");
    revalidatePath("/settings");
    redirect(
      `/settings?notifyChannel=webhook&notifySent=${sent}&notifyFailed=${failed}&notifySkipped=${skipped}`,
    );
  } catch (err) {
    if (err instanceof NotificationConfigError) redirect(`/settings?error=${err.code}`);
    throw err;
  }
}

export async function runWecomNotifications() {
  try {
    const { sent, failed, skipped } = await runNotificationsForChannel("wecom");
    revalidatePath("/settings");
    redirect(
      `/settings?notifyChannel=wecom&notifySent=${sent}&notifyFailed=${failed}&notifySkipped=${skipped}`,
    );
  } catch (err) {
    if (err instanceof NotificationConfigError) redirect(`/settings?error=${err.code}`);
    throw err;
  }
}

export async function runEmailNotifications() {
  try {
    const { sent, failed, skipped } = await runNotificationsForChannel("email");
    revalidatePath("/settings");
    redirect(
      `/settings?notifyChannel=email&notifySent=${sent}&notifyFailed=${failed}&notifySkipped=${skipped}`,
    );
  } catch (err) {
    if (err instanceof NotificationConfigError) redirect(`/settings?error=${err.code}`);
    throw err;
  }
}

export async function runAllNotifications() {
  const order = ["telegram", "webhook", "wecom", "email"] as const;
  const results = await runAllNotificationsInOrder(order);

  const summary = results
    .map((r) => `${r.channel}:${r.sent}/${r.failed}/${r.skipped}`)
    .join(",");

  revalidatePath("/settings");
  redirect(`/settings?notifyChannel=all&notifySummary=${encodeURIComponent(summary)}`);
}

export async function clearFailedDeliveries(formData: FormData) {
  const channelRaw = parseStringField(formData, "channel");
  const channel =
    channelRaw === "telegram" ||
    channelRaw === "webhook" ||
    channelRaw === "wecom" ||
    channelRaw === "email"
      ? (channelRaw as NotificationChannel)
      : null;
  if (!channel) redirect("/settings");

  await clearFailedDeliveriesForChannel(channel);

  revalidatePath("/settings");
  redirect(`/settings?notifyChannel=${channel}&notifyCleared=1`);
}
