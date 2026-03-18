import "server-only";

import { eq } from "drizzle-orm";

import { DIGEST_TYPE, type DigestType } from "@/lib/digests";
import { NOTIFICATION_CHANNEL, NOTIFICATION_DELIVERY_STATUS, type NotificationChannel } from "@/lib/notifications";

import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { digestDeliveries } from "@/server/db/schema";
import { assertNotificationChannelConfig } from "@/server/notification-channel-config";
import {
  buildDigestDeliveryId,
  buildDigestEmailSubject,
  buildDigestWebhookPayload,
  buildFeishuDigestCard,
  formatDigestText,
  type DigestMessage,
} from "@/server/digests";
import { buildMonthlyDigestFromSettings, buildWeeklyDigestFromSettings } from "@/server/digests";
import {
  sendEmailMessage,
  sendFeishuWebhookMessage,
  sendTelegramMessage,
  sendWebhookMessage,
  sendWecomWebhookMessage,
} from "@/server/notification-senders";

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

async function sendDigestMessageToChannel(args: {
  channel: NotificationChannel;
  settings: AppSettings;
  message: DigestMessage;
}): Promise<void> {
  const text = formatDigestText(args.message);

  switch (args.channel) {
    case NOTIFICATION_CHANNEL.TELEGRAM: {
      await sendTelegramMessage({
        botToken: args.settings.telegramBotToken ?? "",
        chatId: args.settings.telegramChatId ?? "",
        text,
      });
      return;
    }
    case NOTIFICATION_CHANNEL.WEBHOOK: {
      await sendWebhookMessage({
        webhookUrl: args.settings.webhookUrl ?? "",
        payload: buildDigestWebhookPayload({ message: args.message, channel: args.channel }),
      });
      return;
    }
    case NOTIFICATION_CHANNEL.WECOM: {
      await sendWecomWebhookMessage({
        webhookUrl: args.settings.wecomWebhookUrl ?? "",
        text,
      });
      return;
    }
    case NOTIFICATION_CHANNEL.FEISHU: {
      await sendFeishuWebhookMessage({
        webhookUrl: args.settings.feishuWebhookUrl ?? "",
        signSecret: args.settings.feishuSignSecret ?? null,
        payload: buildFeishuDigestCard(args.message),
      });
      return;
    }
    case NOTIFICATION_CHANNEL.EMAIL: {
      await sendEmailMessage({
        host: args.settings.smtpHost ?? "",
        port: args.settings.smtpPort ?? 587,
        secure: args.settings.smtpSecure ?? false,
        user: args.settings.smtpUser ?? null,
        pass: args.settings.smtpPass ?? null,
        from: args.settings.smtpFrom ?? "",
        to: args.settings.smtpTo ?? "",
        subject: buildDigestEmailSubject(args.message),
        text,
      });
      return;
    }
  }
}

export type RunDigestResult = { sent: number; failed: number; skipped: number };

export async function runDigestForChannel(args: {
  digestType: DigestType;
  channel: NotificationChannel;
  settings: AppSettings;
  message: DigestMessage;
  period: { start: string; end: string };
  now?: Date;
}): Promise<RunDigestResult> {
  assertNotificationChannelConfig(args.settings, args.channel);

  const now = args.now ?? new Date();
  const deliveryId = buildDigestDeliveryId({
    digestType: args.digestType,
    channel: args.channel,
    periodStart: args.period.start,
  });

  try {
    await db.insert(digestDeliveries).values({
      id: deliveryId,
      digestType: args.digestType,
      channel: args.channel,
      periodStart: args.period.start,
      periodEnd: args.period.end,
      status: NOTIFICATION_DELIVERY_STATUS.SENDING,
      updatedAt: now,
    });
  } catch (err) {
    if (!isSqliteConstraintError(err)) throw err;
    return { sent: 0, failed: 0, skipped: 1 };
  }

  try {
    await sendDigestMessageToChannel({ channel: args.channel, settings: args.settings, message: args.message });

    const sentAt = new Date();
    await db
      .update(digestDeliveries)
      .set({
        status: NOTIFICATION_DELIVERY_STATUS.SENT,
        sentAt,
        error: null,
        updatedAt: sentAt,
      })
      .where(eq(digestDeliveries.id, deliveryId));

    return { sent: 1, failed: 0, skipped: 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const failedAt = new Date();
    await db
      .update(digestDeliveries)
      .set({
        status: NOTIFICATION_DELIVERY_STATUS.FAILED,
        error: message.slice(0, 500),
        updatedAt: failedAt,
      })
      .where(eq(digestDeliveries.id, deliveryId));

    return { sent: 0, failed: 1, skipped: 0 };
  }
}

export async function buildWeeklyDigestOnce(args?: { now?: Date }): Promise<{ settings: AppSettings; message: DigestMessage; periodStart: string }> {
  const now = args?.now ?? new Date();
  const settings = await getAppSettings();
  const { message, period } = await buildWeeklyDigestFromSettings(settings, now);
  return { settings, message, periodStart: period.start };
}

export async function buildMonthlyDigestOnce(args?: { now?: Date }): Promise<{ settings: AppSettings; message: DigestMessage; periodStart: string }> {
  const now = args?.now ?? new Date();
  const settings = await getAppSettings();
  const { message, period } = await buildMonthlyDigestFromSettings(settings, now);
  return { settings, message, periodStart: period.start };
}

export function getDigestTypeByPathSegment(segment: string): DigestType | null {
  if (segment === DIGEST_TYPE.WEEKLY) return DIGEST_TYPE.WEEKLY;
  if (segment === DIGEST_TYPE.MONTHLY) return DIGEST_TYPE.MONTHLY;
  return null;
}
