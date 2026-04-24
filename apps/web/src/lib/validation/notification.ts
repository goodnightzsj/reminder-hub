import "server-only";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { normalizeUrl, parsePortStringStrict, looseCheckbox } from "./common";

// Re-usable transformers
const urlTransformer = (val: string | undefined | null) => {
    if (!val) return undefined;
    const normalized = normalizeUrl(val);
    // If invalid URL, we return the original string to let Zod or manual check fail? 
    // Or we return null? 
    // The original Action logic was: rawUrl -> normalizeUrl -> null if failed. 
    // And if rawUrl exists but normalized is null -> invalid-webhook-url error.
    return normalized || null; 
};

// Telegram
export const telegramSettingsSchema = zfd.formData({
    telegramEnabled: looseCheckbox(),
    telegramBotToken: zfd.text(z.string().optional()),
    telegramChatId: zfd.text(z.string().optional()),
});

// Webhook
export const webhookSettingsSchema = zfd.formData({
    webhookEnabled: looseCheckbox(),
    webhookUrl: zfd.text(z.string().transform(urlTransformer).optional()),
});

// Wecom
export const wecomSettingsSchema = zfd.formData({
    wecomEnabled: looseCheckbox(),
    wecomPushType: zfd.text(z.enum(["webhook", "app"]).catch("webhook")),
    wecomWebhookUrl: zfd.text(z.string().transform(urlTransformer).optional()),
    wecomCorpId: zfd.text(z.string().optional()),
    wecomAgentId: zfd.text(z.string().optional()),
    wecomAppSecret: zfd.text(z.string().optional()),
    wecomToUser: zfd.text(z.string().optional()),
});

// Feishu
export const feishuSettingsSchema = zfd.formData({
    feishuEnabled: looseCheckbox(),
    feishuWebhookUrl: zfd.text(z.string().transform(urlTransformer).optional()),
    feishuSignSecret: zfd.text(z.string().optional()),
});

// Email
export const emailSettingsSchema = zfd.formData({
    emailEnabled: looseCheckbox(),
    smtpHost: zfd.text(z.string().optional()),
    smtpFrom: zfd.text(z.string().optional()),
    smtpTo: zfd.text(z.string().optional()),
    smtpUser: zfd.text(z.string().optional()),
    smtpPass: zfd.text(z.string().optional()),
    smtpPort: zfd.text(z.string().optional().transform((val) => {
        if (!val) return undefined;
        return parsePortStringStrict(val);
    })),
    smtpSecure: looseCheckbox(),
});

export const notificationClearSchema = zfd.formData({
  channel: zfd.text(z.string().optional()),
});
