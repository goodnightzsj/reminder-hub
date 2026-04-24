import "server-only";

import { createRequire } from "node:module";
import { createHmac } from "node:crypto";

import {
  buildEmailSubject,
  buildWebhookPayload,
  formatNotificationText,
  type NotificationItemType,
  type NotificationCandidate,
  type NotificationChannel,
} from "@/server/notifications";
import { NOTIFICATION_ITEM_TYPE_LABEL } from "@/server/notifications.utils";
import { fetchWithTimeout } from "@/server/fetch";
import { NOTIFICATION_CHANNEL } from "@/lib/notifications";
import { formatDateTime } from "@/lib/format";

import type { getAppSettings } from "@/server/db/settings";

type AppSettings = Awaited<ReturnType<typeof getAppSettings>>;

const require = createRequire(import.meta.url);

type TestSender = (nowIso: string) => Promise<void>;
type CandidateSender = (candidate: NotificationCandidate) => Promise<void>;

export async function sendTelegramMessage(args: { botToken: string; chatId: string; text: string }) {
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

export async function sendWebhookMessage(args: { webhookUrl: string; payload: unknown }) {
  const res = await fetchWithTimeout(args.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args.payload),
    timeoutMs: 10_000,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

let wecomAccessTokenCache: { token: string; expiresAt: number } | null = null;

async function getWecomAccessToken(corpId: string, appSecret: string): Promise<string> {
  if (wecomAccessTokenCache && Date.now() < wecomAccessTokenCache.expiresAt) {
    return wecomAccessTokenCache.token;
  }
  const res = await fetchWithTimeout(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(corpId)}&corpsecret=${encodeURIComponent(appSecret)}`,
    { timeoutMs: 10_000 },
  );
  if (!res.ok) throw new Error(`WeChat Work token HTTP ${res.status}`);
  const data = (await res.json()) as { errcode: number; errmsg: string; access_token?: string; expires_in?: number };
  if (data.errcode !== 0 || !data.access_token) {
    throw new Error(`WeChat Work token error ${data.errcode}: ${data.errmsg}`);
  }
  wecomAccessTokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000 - 60_000 };
  return data.access_token;
}

export async function sendWecomAppMessage(args: { corpId: string; appSecret: string; agentId: string; toUser: string; text: string }) {
  const token = await getWecomAccessToken(args.corpId, args.appSecret);
  const res = await fetchWithTimeout(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        touser: args.toUser || "@all",
        msgtype: "text",
        agentid: Number(args.agentId),
        text: { content: args.text },
      }),
      timeoutMs: 10_000,
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { errcode: number; errmsg: string };
  if (data.errcode !== 0) {
    wecomAccessTokenCache = null;
    throw new Error(`errcode ${data.errcode}: ${data.errmsg}`);
  }
}

export async function sendWecomWebhookMessage(args: { webhookUrl: string; text: string }) {
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

type FeishuCardHeaderTemplate =
  | "blue"
  | "wathet"
  | "turquoise"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "carmine"
  | "violet"
  | "purple"
  | "indigo"
  | "grey";

function getFeishuCardTemplate(itemType: NotificationItemType): FeishuCardHeaderTemplate {
  switch (itemType) {
    case "todo":
      return "blue";
    case "anniversary":
      return "orange";
    case "subscription":
      return "green";
  }
}

function buildFeishuSign(secret: string, timestampSeconds: string): string {
  const stringToSign = `${timestampSeconds}\n${secret}`;
  return createHmac("sha256", secret).update(stringToSign).digest("base64");
}

function buildFeishuTestCard(args: { nowIso: string; timeZone: string }): Record<string, unknown> {
  return {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true, enable_forward: true },
      header: {
        template: "green",
        title: { tag: "plain_text", content: "飞书通知已连通" },
      },
      elements: [
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: [
              "**todo-list**",
              "",
              "已成功向该群机器人发送测试消息。",
              "如果你开启了「加签」，也说明签名校验配置正确。",
            ].join("\n"),
          },
        },
        {
          tag: "div",
          fields: [
            {
              is_short: true,
              text: { tag: "lark_md", content: `**时间**\n${args.nowIso}` },
            },
            {
              is_short: true,
              text: { tag: "lark_md", content: `**时区**\n${args.timeZone}` },
            },
          ],
        },
        {
          tag: "note",
          elements: [{ tag: "plain_text", content: "todo-list" }],
        },
      ],
    },
  };
}

function buildFeishuCandidateCard(candidate: NotificationCandidate, timeZone: string): Record<string, unknown> {
  const prefix = NOTIFICATION_ITEM_TYPE_LABEL[candidate.itemType];
  const template = getFeishuCardTemplate(candidate.itemType);

  const scheduledAtText = formatDateTime(candidate.scheduledAt, timeZone);
  const eventAtText = formatDateTime(candidate.eventAt, timeZone);

  return {
    msg_type: "interactive",
    card: {
      config: { wide_screen_mode: true, enable_forward: true },
      header: {
        template,
        title: { tag: "plain_text", content: `提醒 · ${prefix}` },
      },
      elements: [
        { tag: "div", text: { tag: "lark_md", content: `**${candidate.itemTitle}**` } },
        { tag: "hr" },
        {
          tag: "div",
          fields: [
            {
              is_short: true,
              text: { tag: "lark_md", content: `**${candidate.eventLabel}**\n${eventAtText}` },
            },
            {
              is_short: true,
              text: { tag: "lark_md", content: `**提醒时间**\n${scheduledAtText}` },
            },
            {
              is_short: true,
              text: { tag: "lark_md", content: `**提前**\n${candidate.offsetLabel}` },
            },
            {
              is_short: true,
              text: { tag: "lark_md", content: `**时区**\n${timeZone}` },
            },
          ],
        },
        {
          tag: "note",
          elements: [
            { tag: "plain_text", content: "todo-list" },
            { tag: "plain_text", content: candidate.path },
          ],
        },
      ],
    },
  };
}

export async function sendFeishuWebhookMessage(args: { webhookUrl: string; payload: Record<string, unknown>; signSecret: string | null }) {
  const body: Record<string, unknown> = { ...args.payload };
  if (args.signSecret) {
    const timestampSeconds = Math.floor(Date.now() / 1000).toString();
    body.timestamp = timestampSeconds;
    body.sign = buildFeishuSign(args.signSecret, timestampSeconds);
  }

  const res = await fetchWithTimeout(args.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: 10_000,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Ignore json parse errors; some proxies may not return JSON.
    return;
  }
  if (!payload || typeof payload !== "object") return;

  if ("StatusCode" in payload && typeof (payload as { StatusCode?: unknown }).StatusCode === "number") {
    const code = (payload as { StatusCode: number }).StatusCode;
    if (code !== 0) {
      const message = (payload as { StatusMessage?: unknown }).StatusMessage;
      throw new Error(`StatusCode ${code}${typeof message === "string" ? `: ${message}` : ""}`);
    }
    return;
  }

  if ("code" in payload && typeof (payload as { code?: unknown }).code === "number") {
    const code = (payload as { code: number }).code;
    if (code !== 0) {
      const message = (payload as { msg?: unknown }).msg;
      throw new Error(`code ${code}${typeof message === "string" ? `: ${message}` : ""}`);
    }
  }
}

export async function sendEmailMessage(args: {
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
      const sendWecom = settings.wecomPushType === "app"
        ? (text: string) => sendWecomAppMessage({
            corpId: settings.wecomCorpId ?? "",
            appSecret: settings.wecomAppSecret ?? "",
            agentId: settings.wecomAgentId ?? "",
            toUser: settings.wecomToUser ?? "@all",
            text,
          })
        : (text: string) => sendWecomWebhookMessage({ webhookUrl: settings.wecomWebhookUrl ?? "", text });
      return {
        sendTest: async (nowIso: string) => {
          await sendWecom(`测试通知（${nowIso}）`);
        },
        sendCandidate: async (candidate: NotificationCandidate) => {
          await sendWecom(formatNotificationText(candidate, settings.timeZone));
        },
      };
    }
    case NOTIFICATION_CHANNEL.FEISHU: {
      const webhookUrl = settings.feishuWebhookUrl ?? "";
      const signSecret = settings.feishuSignSecret ?? null;
      return {
        sendTest: async (nowIso: string) => {
          await sendFeishuWebhookMessage({
            webhookUrl,
            signSecret,
            payload: buildFeishuTestCard({ nowIso, timeZone: settings.timeZone }),
          });
        },
        sendCandidate: async (candidate: NotificationCandidate) => {
          await sendFeishuWebhookMessage({
            webhookUrl,
            signSecret,
            payload: buildFeishuCandidateCard(candidate, settings.timeZone),
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
