import { and, eq } from "drizzle-orm";

import {
  buildEmailSubject,
  buildNotificationDeliveryId,
  buildWebhookPayload,
  collectDueNotificationCandidates,
  formatNotificationText,
  type NotificationChannel,
} from "@/server/notifications";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { notificationDeliveries } from "@/server/db/schema";

export class NotificationConfigError extends Error {
  readonly code: string;

  constructor(code: string) {
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

function assertConfig(
  settings: Awaited<ReturnType<typeof getAppSettings>>,
  channel: NotificationChannel,
) {
  if (channel === "telegram") {
    if (!settings.telegramEnabled) throw new NotificationConfigError("telegram-disabled");
    if (!settings.telegramBotToken) throw new NotificationConfigError("missing-telegram-token");
    if (!settings.telegramChatId) throw new NotificationConfigError("missing-telegram-chat-id");
    return;
  }

  if (channel === "webhook") {
    if (!settings.webhookEnabled) throw new NotificationConfigError("webhook-disabled");
    if (!settings.webhookUrl) throw new NotificationConfigError("missing-webhook-url");
    return;
  }

  if (channel === "wecom") {
    if (!settings.wecomEnabled) throw new NotificationConfigError("wecom-disabled");
    if (!settings.wecomWebhookUrl) throw new NotificationConfigError("missing-wecom-webhook-url");
    return;
  }

  if (channel === "email") {
    if (!settings.emailEnabled) throw new NotificationConfigError("email-disabled");
    if (!settings.smtpHost) throw new NotificationConfigError("missing-smtp-host");
    if (!settings.smtpFrom) throw new NotificationConfigError("missing-smtp-from");
    if (!settings.smtpTo) throw new NotificationConfigError("missing-smtp-to");
  }
}

async function sendTelegramMessage(args: {
  botToken: string;
  chatId: string;
  text: string;
}) {
  const res = await fetch(
    `https://api.telegram.org/bot${args.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: args.chatId,
        text: args.text,
        disable_web_page_preview: true,
      }),
    },
  );

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  if (payload && typeof payload === "object" && "ok" in payload) {
    const ok = (payload as { ok?: unknown }).ok;
    if (ok === false) {
      const errorCode = (payload as { error_code?: unknown }).error_code;
      const desc = (payload as { description?: unknown }).description;
      throw new Error(
        `Telegram error${typeof errorCode === "number" ? ` ${errorCode}` : ""}${
          typeof desc === "string" ? `: ${desc}` : ""
        }`,
      );
    }
  }
}

async function sendWebhookMessage(args: { webhookUrl: string; payload: unknown }) {
  const res = await fetch(args.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args.payload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function sendWecomWebhookMessage(args: { webhookUrl: string; text: string }) {
  const res = await fetch(args.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      msgtype: "text",
      text: { content: args.text },
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  try {
    const payload: unknown = await res.json();
    if (
      typeof payload === "object" &&
      payload &&
      "errcode" in payload &&
      typeof (payload as { errcode?: unknown }).errcode === "number" &&
      (payload as { errcode: number }).errcode !== 0
    ) {
      const errcode = (payload as { errcode: number }).errcode;
      const errmsg = (payload as { errmsg?: unknown }).errmsg;
      throw new Error(
        `errcode ${errcode}${typeof errmsg === "string" ? `: ${errmsg}` : ""}`,
      );
    }
  } catch {
    // Ignore json parse errors; some proxies may not return JSON.
  }
}

async function sendEmailMessage(args: {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  pass: string | null;
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require("nodemailer") as typeof import("nodemailer");

  const transporter = nodemailer.createTransport({
    host: args.host,
    port: args.port,
    secure: args.secure,
    auth: args.user && args.pass ? { user: args.user, pass: args.pass } : undefined,
  });

  await transporter.sendMail({
    from: args.from,
    to: args.to,
    subject: args.subject,
    text: args.text,
  });
}

export async function sendTestNotification(channel: NotificationChannel): Promise<void> {
  const settings = await getAppSettings();
  assertConfig(settings, channel);
  const now = new Date().toISOString();

  if (channel === "telegram") {
    await sendTelegramMessage({
      botToken: settings.telegramBotToken ?? "",
      chatId: settings.telegramChatId ?? "",
      text: `测试通知（${now}）`,
    });
    return;
  }

  if (channel === "webhook") {
    await sendWebhookMessage({
      webhookUrl: settings.webhookUrl ?? "",
      payload: {
        source: "todo-list",
        type: "test",
        title: "测试通知",
        at: now,
        timeZone: settings.timeZone,
      },
    });
    return;
  }

  if (channel === "wecom") {
    await sendWecomWebhookMessage({
      webhookUrl: settings.wecomWebhookUrl ?? "",
      text: `测试通知（${now}）`,
    });
    return;
  }

  await sendEmailMessage({
    host: settings.smtpHost ?? "",
    port: settings.smtpPort ?? 587,
    secure: settings.smtpSecure ?? false,
    user: settings.smtpUser ?? null,
    pass: settings.smtpPass ?? null,
    from: settings.smtpFrom ?? "",
    to: settings.smtpTo ?? "",
    subject: "测试通知（todo-list）",
    text: `测试通知（${now}）`,
  });
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
        status: "sending",
        updatedAt: now,
      });
    } catch {
      skipped += 1;
      continue;
    }

    try {
      if (channel === "telegram") {
        await sendTelegramMessage({
          botToken: settings.telegramBotToken ?? "",
          chatId: settings.telegramChatId ?? "",
          text: formatNotificationText(candidate, settings.timeZone),
        });
      } else if (channel === "webhook") {
        await sendWebhookMessage({
          webhookUrl: settings.webhookUrl ?? "",
          payload: buildWebhookPayload(candidate, settings.timeZone),
        });
      } else if (channel === "wecom") {
        await sendWecomWebhookMessage({
          webhookUrl: settings.wecomWebhookUrl ?? "",
          text: formatNotificationText(candidate, settings.timeZone),
        });
      } else if (channel === "email") {
        await sendEmailMessage({
          host: settings.smtpHost ?? "",
          port: settings.smtpPort ?? 587,
          secure: settings.smtpSecure ?? false,
          user: settings.smtpUser ?? null,
          pass: settings.smtpPass ?? null,
          from: settings.smtpFrom ?? "",
          to: settings.smtpTo ?? "",
          subject: buildEmailSubject(candidate),
          text: formatNotificationText(candidate, settings.timeZone),
        });
      }

      await db
        .update(notificationDeliveries)
        .set({
          status: "sent",
          sentAt: new Date(),
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(notificationDeliveries.id, deliveryId));
      sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await db
        .update(notificationDeliveries)
        .set({
          status: "failed",
          error: message.slice(0, 500),
          updatedAt: new Date(),
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
    .where(and(eq(notificationDeliveries.channel, channel), eq(notificationDeliveries.status, "failed")));
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
