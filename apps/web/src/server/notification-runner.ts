import "server-only";

import { and, eq } from "drizzle-orm";

import {
  buildNotificationDeliveryId,
  collectDueNotificationCandidates,
  type NotificationChannel,
} from "@/server/notifications";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { notificationDeliveries } from "@/server/db/schema";
import { createSenders } from "@/server/notification-senders";
import { NOTIFICATION_CHANNEL, NOTIFICATION_DELIVERY_STATUS } from "@/lib/notifications";
import type { FlashErrorCode } from "@/lib/flash";

export class NotificationConfigError extends Error {
  readonly code: FlashErrorCode;

  constructor(code: FlashErrorCode) {
    super(code);
    this.code = code;
  }
}

export type RunOptions = {
  now?: Date;
  lookbackHours?: number;
  maxSend?: number;
};

const DEFAULT_LOOKBACK_HOURS = 24;
const DEFAULT_MAX_SEND = 50;

type AppSettings = Awaited<ReturnType<typeof getAppSettings>>;

function isSqliteConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string" &&
    (err as { code: string }).code.startsWith("SQLITE_CONSTRAINT")
  );
}

function assertConfig(
  settings: AppSettings,
  channel: NotificationChannel,
) {
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
    if (!settings.wecomWebhookUrl) throw new NotificationConfigError("missing-wecom-webhook-url");
    return;
  }

  if (channel === NOTIFICATION_CHANNEL.EMAIL) {
    if (!settings.emailEnabled) throw new NotificationConfigError("email-disabled");
    if (!settings.smtpHost) throw new NotificationConfigError("missing-smtp-host");
    if (!settings.smtpFrom) throw new NotificationConfigError("missing-smtp-from");
    if (!settings.smtpTo) throw new NotificationConfigError("missing-smtp-to");
  }
}

export async function sendTestNotification(channel: NotificationChannel): Promise<void> {
  const settings = await getAppSettings();
  assertConfig(settings, channel);
  const now = new Date().toISOString();

  const { sendTest } = createSenders(settings, channel);
  await sendTest(now);
}

export async function runNotificationsForChannel(
  channel: NotificationChannel,
  opts: RunOptions = {},
): Promise<{ sent: number; failed: number; skipped: number }> {
  const settings = await getAppSettings();
  assertConfig(settings, channel);

  const now = opts.now ?? new Date();
  const lookbackHours = opts.lookbackHours ?? DEFAULT_LOOKBACK_HOURS;
  const maxSend = opts.maxSend ?? DEFAULT_MAX_SEND;
  const { sendCandidate } = createSenders(settings, channel);

  const candidates = await collectDueNotificationCandidates({
    now,
    timeZone: settings.timeZone,
    dateReminderTime: settings.dateReminderTime,
    lookbackHours,
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const candidate of candidates.slice(0, maxSend)) {
    const deliveryId = buildNotificationDeliveryId(channel, candidate);

    try {
      await db.insert(notificationDeliveries).values({
        id: deliveryId,
        channel,
        itemType: candidate.itemType,
        itemId: candidate.itemId,
        itemTitle: candidate.itemTitle,
        scheduledAt: candidate.scheduledAt,
        status: NOTIFICATION_DELIVERY_STATUS.SENDING,
        updatedAt: now,
      });
    } catch (err) {
      // Most likely a duplicate ID collision (already inserted by another run).
      if (!isSqliteConstraintError(err)) throw err;
      skipped += 1;
      continue;
    }

    try {
      await sendCandidate(candidate);

      const sentAt = new Date();
      await db
        .update(notificationDeliveries)
        .set({
          status: NOTIFICATION_DELIVERY_STATUS.SENT,
          sentAt,
          error: null,
          updatedAt: sentAt,
        })
        .where(eq(notificationDeliveries.id, deliveryId));
      sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const failedAt = new Date();
      await db
        .update(notificationDeliveries)
        .set({
          status: NOTIFICATION_DELIVERY_STATUS.FAILED,
          error: message.slice(0, 500),
          updatedAt: failedAt,
        })
        .where(eq(notificationDeliveries.id, deliveryId));
      failed += 1;
    }
  }

  return { sent, failed, skipped };
}

export async function clearFailedDeliveries(channel: NotificationChannel): Promise<void> {
  await db
    .delete(notificationDeliveries)
    .where(
      and(
        eq(notificationDeliveries.channel, channel),
        eq(notificationDeliveries.status, NOTIFICATION_DELIVERY_STATUS.FAILED),
      ),
    );
}

export async function runAllNotificationsInOrder(
  order: readonly NotificationChannel[],
  opts: RunOptions = {},
): Promise<Array<{ channel: NotificationChannel; sent: number; failed: number; skipped: number }>> {
  const results: Array<{
    channel: NotificationChannel;
    sent: number;
    failed: number;
    skipped: number;
  }> = [];

  for (const channel of order) {
    try {
      const r = await runNotificationsForChannel(channel, opts);
      results.push({ channel, ...r });
    } catch (err) {
      if (err instanceof NotificationConfigError) continue;
      results.push({ channel, sent: 0, failed: 1, skipped: 0 });
    }
  }

  return results;
}
