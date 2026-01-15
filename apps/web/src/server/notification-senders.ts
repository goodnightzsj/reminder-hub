import "server-only";

import { createRequire } from "node:module";

import {
  buildEmailSubject,
  buildWebhookPayload,
  formatNotificationText,
  type NotificationCandidate,
  type NotificationChannel,
} from "@/server/notifications";
import { fetchWithTimeout } from "@/server/fetch";
import { NOTIFICATION_CHANNEL } from "@/lib/notifications";

import type { getAppSettings } from "@/server/db/settings";

type AppSettings = Awaited<ReturnType<typeof getAppSettings>>;

const require = createRequire(import.meta.url);

type TestSender = (nowIso: string) => Promise<void>;
type CandidateSender = (candidate: NotificationCandidate) => Promise<void>;

async function sendTelegramMessage(args: { botToken: string; chatId: string; text: string }) {
  const res = await fetchWithTimeout(`https://api.telegram.org/bot${args.botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: args.chatId,
      text: args.text,
      disable_web_page_preview: true,
    }),
    timeoutMs: 10_000,
  });

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
  const res = await fetchWithTimeout(args.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args.payload),
    timeoutMs: 10_000,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function sendWecomWebhookMessage(args: { webhookUrl: string; text: string }) {
  const res = await fetchWithTimeout(args.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      msgtype: "text",
      text: { content: args.text },
    }),
    timeoutMs: 10_000,
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
      throw new Error(`errcode ${errcode}${typeof errmsg === "string" ? `: ${errmsg}` : ""}`);
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

export function createSenders(
  settings: AppSettings,
  channel: NotificationChannel,
): { sendTest: TestSender; sendCandidate: CandidateSender } {
  switch (channel) {
    case NOTIFICATION_CHANNEL.TELEGRAM: {
      const botToken = settings.telegramBotToken ?? "";
      const chatId = settings.telegramChatId ?? "";
      return {
        sendTest: async (nowIso: string) => {
          await sendTelegramMessage({ botToken, chatId, text: `测试通知（${nowIso}）` });
        },
        sendCandidate: async (candidate: NotificationCandidate) => {
          await sendTelegramMessage({
            botToken,
            chatId,
            text: formatNotificationText(candidate, settings.timeZone),
          });
        },
      };
    }
    case NOTIFICATION_CHANNEL.WEBHOOK: {
      const webhookUrl = settings.webhookUrl ?? "";
      return {
        sendTest: async (nowIso: string) => {
          await sendWebhookMessage({
            webhookUrl,
            payload: {
              source: "todo-list",
              type: "test",
              title: "测试通知",
              at: nowIso,
              timeZone: settings.timeZone,
            },
          });
        },
        sendCandidate: async (candidate: NotificationCandidate) => {
          await sendWebhookMessage({
            webhookUrl,
            payload: buildWebhookPayload(candidate, settings.timeZone),
          });
        },
      };
    }
    case NOTIFICATION_CHANNEL.WECOM: {
      const webhookUrl = settings.wecomWebhookUrl ?? "";
      return {
        sendTest: async (nowIso: string) => {
          await sendWecomWebhookMessage({ webhookUrl, text: `测试通知（${nowIso}）` });
        },
        sendCandidate: async (candidate: NotificationCandidate) => {
          await sendWecomWebhookMessage({
            webhookUrl,
            text: formatNotificationText(candidate, settings.timeZone),
          });
        },
      };
    }
    case NOTIFICATION_CHANNEL.EMAIL: {
      const transport = {
        host: settings.smtpHost ?? "",
        port: settings.smtpPort ?? 587,
        secure: settings.smtpSecure ?? false,
        user: settings.smtpUser ?? null,
        pass: settings.smtpPass ?? null,
        from: settings.smtpFrom ?? "",
        to: settings.smtpTo ?? "",
      };
      return {
        sendTest: async (nowIso: string) => {
          await sendEmailMessage({
            ...transport,
            subject: "测试通知（todo-list）",
            text: `测试通知（${nowIso}）`,
          });
        },
        sendCandidate: async (candidate: NotificationCandidate) => {
          await sendEmailMessage({
            ...transport,
            subject: buildEmailSubject(candidate),
            text: formatNotificationText(candidate, settings.timeZone),
          });
        },
      };
    }
  }
}
