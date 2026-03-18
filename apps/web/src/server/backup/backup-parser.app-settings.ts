import "server-only";

import { isValidTimeOfDay, isValidTimeZone } from "@/server/datetime";
import { appSettings } from "@/server/db/schema";

import { asBoolean, asDateFromMs, asInteger, asString, hasOwn } from "./backup-parser.utils";

export function parseAppSettingsRow(
  row: Record<string, unknown>,
): typeof appSettings.$inferInsert {
  const id = asString(row.id);
  const timeZone = asString(row.timeZone);
  const dateReminderTime = asString(row.dateReminderTime);

  if (!id) throw new Error("app.settings.id is missing");
  if (!timeZone) throw new Error("app.settings.timeZone is missing");
  if (!isValidTimeZone(timeZone)) throw new Error("app.settings.timeZone is invalid");
  if (!dateReminderTime) throw new Error("app.settings.dateReminderTime is missing");
  if (!isValidTimeOfDay(dateReminderTime)) {
    throw new Error("app.settings.dateReminderTime is invalid");
  }

  const insert: typeof appSettings.$inferInsert = {
    id,
    timeZone,
    dateReminderTime,
  };

  if (hasOwn(row, "internalSchedulerEnabled")) {
    const value = asBoolean(row.internalSchedulerEnabled);
    if (value === null) throw new Error("app.settings.internalSchedulerEnabled must be boolean");
    insert.internalSchedulerEnabled = value;
  }

  if (hasOwn(row, "internalNotifyEnabled")) {
    const value = asBoolean(row.internalNotifyEnabled);
    if (value === null) throw new Error("app.settings.internalNotifyEnabled must be boolean");
    insert.internalNotifyEnabled = value;
  }

  if (hasOwn(row, "internalNotifyIntervalSeconds")) {
    const value = asInteger(row.internalNotifyIntervalSeconds);
    if (value === null) {
      throw new Error("app.settings.internalNotifyIntervalSeconds must be integer");
    }
    insert.internalNotifyIntervalSeconds = value;
  }

  if (hasOwn(row, "internalWeeklyDigestEnabled")) {
    const value = asBoolean(row.internalWeeklyDigestEnabled);
    if (value === null) {
      throw new Error("app.settings.internalWeeklyDigestEnabled must be boolean");
    }
    insert.internalWeeklyDigestEnabled = value;
  }

  if (hasOwn(row, "internalMonthlyDigestEnabled")) {
    const value = asBoolean(row.internalMonthlyDigestEnabled);
    if (value === null) {
      throw new Error("app.settings.internalMonthlyDigestEnabled must be boolean");
    }
    insert.internalMonthlyDigestEnabled = value;
  }

  if (hasOwn(row, "internalDigestTime")) {
    const value = asString(row.internalDigestTime);
    if (!value) throw new Error("app.settings.internalDigestTime must be string");
    if (!isValidTimeOfDay(value)) throw new Error("app.settings.internalDigestTime is invalid");
    insert.internalDigestTime = value;
  }

  if (hasOwn(row, "telegramEnabled")) {
    const value = asBoolean(row.telegramEnabled);
    if (value === null) throw new Error("app.settings.telegramEnabled must be boolean");
    insert.telegramEnabled = value;
  }

  if (hasOwn(row, "telegramBotToken")) {
    const value = asString(row.telegramBotToken);
    if (row.telegramBotToken !== null && value === null) {
      throw new Error("app.settings.telegramBotToken must be string|null");
    }
    insert.telegramBotToken = value;
  }

  if (hasOwn(row, "telegramChatId")) {
    const value = asString(row.telegramChatId);
    if (row.telegramChatId !== null && value === null) {
      throw new Error("app.settings.telegramChatId must be string|null");
    }
    insert.telegramChatId = value;
  }

  if (hasOwn(row, "webhookEnabled")) {
    const value = asBoolean(row.webhookEnabled);
    if (value === null) throw new Error("app.settings.webhookEnabled must be boolean");
    insert.webhookEnabled = value;
  }

  if (hasOwn(row, "webhookUrl")) {
    const value = asString(row.webhookUrl);
    if (row.webhookUrl !== null && value === null) {
      throw new Error("app.settings.webhookUrl must be string|null");
    }
    insert.webhookUrl = value;
  }

  if (hasOwn(row, "wecomEnabled")) {
    const value = asBoolean(row.wecomEnabled);
    if (value === null) throw new Error("app.settings.wecomEnabled must be boolean");
    insert.wecomEnabled = value;
  }

  if (hasOwn(row, "wecomWebhookUrl")) {
    const value = asString(row.wecomWebhookUrl);
    if (row.wecomWebhookUrl !== null && value === null) {
      throw new Error("app.settings.wecomWebhookUrl must be string|null");
    }
    insert.wecomWebhookUrl = value;
  }

  if (hasOwn(row, "feishuEnabled")) {
    const value = asBoolean(row.feishuEnabled);
    if (value === null) throw new Error("app.settings.feishuEnabled must be boolean");
    insert.feishuEnabled = value;
  }

  if (hasOwn(row, "feishuWebhookUrl")) {
    const value = asString(row.feishuWebhookUrl);
    if (row.feishuWebhookUrl !== null && value === null) {
      throw new Error("app.settings.feishuWebhookUrl must be string|null");
    }
    insert.feishuWebhookUrl = value;
  }

  if (hasOwn(row, "feishuSignSecret")) {
    const value = asString(row.feishuSignSecret);
    if (row.feishuSignSecret !== null && value === null) {
      throw new Error("app.settings.feishuSignSecret must be string|null");
    }
    insert.feishuSignSecret = value;
  }

  if (hasOwn(row, "emailEnabled")) {
    const value = asBoolean(row.emailEnabled);
    if (value === null) throw new Error("app.settings.emailEnabled must be boolean");
    insert.emailEnabled = value;
  }

  if (hasOwn(row, "smtpHost")) {
    const value = asString(row.smtpHost);
    if (row.smtpHost !== null && value === null) {
      throw new Error("app.settings.smtpHost must be string|null");
    }
    insert.smtpHost = value;
  }

  if (hasOwn(row, "smtpPort")) {
    const value = asInteger(row.smtpPort);
    if (value === null) throw new Error("app.settings.smtpPort must be integer");
    insert.smtpPort = value;
  }

  if (hasOwn(row, "smtpSecure")) {
    const value = asBoolean(row.smtpSecure);
    if (value === null) throw new Error("app.settings.smtpSecure must be boolean");
    insert.smtpSecure = value;
  }

  if (hasOwn(row, "smtpUser")) {
    const value = asString(row.smtpUser);
    if (row.smtpUser !== null && value === null) {
      throw new Error("app.settings.smtpUser must be string|null");
    }
    insert.smtpUser = value;
  }

  if (hasOwn(row, "smtpPass")) {
    const value = asString(row.smtpPass);
    if (row.smtpPass !== null && value === null) {
      throw new Error("app.settings.smtpPass must be string|null");
    }
    insert.smtpPass = value;
  }

  if (hasOwn(row, "smtpFrom")) {
    const value = asString(row.smtpFrom);
    if (row.smtpFrom !== null && value === null) {
      throw new Error("app.settings.smtpFrom must be string|null");
    }
    insert.smtpFrom = value;
  }

  if (hasOwn(row, "smtpTo")) {
    const value = asString(row.smtpTo);
    if (row.smtpTo !== null && value === null) {
      throw new Error("app.settings.smtpTo must be string|null");
    }
    insert.smtpTo = value;
  }

  if (hasOwn(row, "createdAt")) {
    const value = asDateFromMs(row.createdAt);
    if (!value) throw new Error("app.settings.createdAt must be ms timestamp");
    insert.createdAt = value;
  }

  if (hasOwn(row, "updatedAt")) {
    const value = asDateFromMs(row.updatedAt);
    if (!value) throw new Error("app.settings.updatedAt must be ms timestamp");
    insert.updatedAt = value;
  }

  return insert;
}
