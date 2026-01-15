"use client";

import { Input } from "@/app/_components/Input";
import {
  runEmailNotifications,
  runTelegramNotifications,
  runWebhookNotifications,
  runWecomNotifications,
  sendTestEmail,
  sendTestTelegram,
  sendTestWebhook,
  sendTestWecom,
  updateEmailSettings,
  updateTelegramSettings,
  updateWebhookSettings,
  updateWecomSettings,
} from "@/app/_actions/notifications";

import { NOTIFICATION_CHANNEL } from "@/lib/notifications";
import { ActionButtons, ChannelEnabledToggle, SaveConfigButton } from "./NotificationChannelForms.shared";
import type { ChannelType, NotificationSettings } from "./NotificationSettings.types";

export type AppSettings = NotificationSettings;
export type { ChannelType };

export function TelegramForm({ settings }: { settings: AppSettings }) {
  return (
    <div className="space-y-6">
      <form action={updateTelegramSettings} className="flex flex-col gap-4">
        <ChannelEnabledToggle
          name="telegramEnabled"
          defaultChecked={settings.telegramEnabled}
          label="启用 Telegram 通知"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-secondary">Bot Token</span>
            {settings.telegramHasBotToken && <span className="text-[10px] text-success">已保存</span>}
          </div>
          <Input type="password" name="telegramBotToken" placeholder="123456:ABCDEF..." />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-secondary">Chat ID</span>
            {settings.telegramChatId && (
              <span className="text-[10px] text-muted">当前: {settings.telegramChatId}</span>
            )}
          </div>
          <Input name="telegramChatId" placeholder="-100xxxxxxxxxx" />
        </div>

        <SaveConfigButton />
      </form>

      <ActionButtons
        channel={NOTIFICATION_CHANNEL.TELEGRAM}
        onTest={sendTestTelegram}
        onRun={runTelegramNotifications}
      />
    </div>
  );
}

export function WebhookForm({ settings }: { settings: AppSettings }) {
  return (
    <div className="space-y-6">
      <form action={updateWebhookSettings} className="flex flex-col gap-4">
        <ChannelEnabledToggle
          name="webhookEnabled"
          defaultChecked={settings.webhookEnabled}
          label="启用 Webhook 通知"
        />

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-secondary">Webhook URL</span>
          <Input
            name="webhookUrl"
            placeholder="https://example.com/webhook"
            defaultValue={settings.webhookUrl ?? ""}
          />
        </div>

        <SaveConfigButton />
      </form>

      <ActionButtons
        channel={NOTIFICATION_CHANNEL.WEBHOOK}
        onTest={sendTestWebhook}
        onRun={runWebhookNotifications}
      />
    </div>
  );
}

export function WeComForm({ settings }: { settings: AppSettings }) {
  return (
    <div className="space-y-6">
      <form action={updateWecomSettings} className="flex flex-col gap-4">
        <ChannelEnabledToggle
          name="wecomEnabled"
          defaultChecked={settings.wecomEnabled}
          label="启用企业微信群机器人"
        />

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-secondary">Webhook URL</span>
          <Input
            name="wecomWebhookUrl"
            placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
            defaultValue={settings.wecomWebhookUrl ?? ""}
          />
        </div>

        <SaveConfigButton />
      </form>

      <ActionButtons
        channel={NOTIFICATION_CHANNEL.WECOM}
        onTest={sendTestWecom}
        onRun={runWecomNotifications}
      />
    </div>
  );
}

export function EmailForm({ settings }: { settings: AppSettings }) {
  return (
    <div className="space-y-6">
      <form action={updateEmailSettings} className="flex flex-col gap-4">
        <ChannelEnabledToggle
          name="emailEnabled"
          defaultChecked={settings.emailEnabled}
          label="启用邮件通知"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-secondary">SMTP Host</span>
            <Input
              name="smtpHost"
              placeholder="smtp.example.com"
              defaultValue={settings.smtpHost ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-secondary">SMTP Port</span>
            <Input
              name="smtpPort"
              type="number"
              inputMode="numeric"
              placeholder="587"
              defaultValue={settings.smtpPort ?? 587}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors cursor-pointer border border-transparent hover:border-divider">
          <input
            type="checkbox"
            name="smtpSecure"
            value="1"
            defaultChecked={settings.smtpSecure}
            className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
          />
          <span className="text-xs font-medium">使用 TLS (通常 465)</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-secondary">SMTP User</span>
            <Input name="smtpUser" defaultValue={settings.smtpUser ?? ""} />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-secondary">SMTP Pass</span>
            <Input type="password" name="smtpPass" placeholder={settings.smtpHasPass ? "已保存" : ""} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-secondary">From</span>
            <Input
              name="smtpFrom"
              placeholder="you@example.com"
              defaultValue={settings.smtpFrom ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-secondary">To</span>
            <Input
              name="smtpTo"
              placeholder="you@example.com"
              defaultValue={settings.smtpTo ?? ""}
            />
          </div>
        </div>

        <SaveConfigButton />
      </form>

      <ActionButtons
        channel={NOTIFICATION_CHANNEL.EMAIL}
        onTest={sendTestEmail}
        onRun={runEmailNotifications}
      />
    </div>
  );
}
