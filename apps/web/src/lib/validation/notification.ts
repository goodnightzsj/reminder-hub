import "server-only";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { normalizeUrl, parsePortStringStrict } from "@/app/_actions/notifications.utils";

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
    telegramEnabled: zfd.checkbox(),
    telegramBotToken: zfd.text(z.string().optional()),
    telegramChatId: zfd.text(z.string().optional()),
});

// Webhook
export const webhookSettingsSchema = zfd.formData({
    webhookEnabled: zfd.checkbox(),
    webhookUrl: zfd.text(z.string().transform(urlTransformer).optional()),
});

// Wecom
export const wecomSettingsSchema = zfd.formData({
    wecomEnabled: zfd.checkbox(),
    wecomWebhookUrl: zfd.text(z.string().transform(urlTransformer).optional()),
});

// Email
export const emailSettingsSchema = zfd.formData({
    emailEnabled: zfd.checkbox(),
    smtpHost: zfd.text(z.string().optional()),
    smtpFrom: zfd.text(z.string().optional()),
    smtpTo: zfd.text(z.string().optional()),
    smtpUser: zfd.text(z.string().optional()),
    smtpPass: zfd.text(z.string().optional()),
    smtpPort: zfd.text(z.string().optional().transform((val) => {
        if (!val) return undefined;
        return parsePortStringStrict(val);
    })),
    smtpSecure: zfd.checkbox(),
});
