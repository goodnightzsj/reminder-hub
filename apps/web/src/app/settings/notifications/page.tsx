import Link from "next/link";
import { desc } from "drizzle-orm";

import { Badge } from "@/app/_components/Badge";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import { AppHeader } from "@/app/_components/AppHeader";
import { ToastListener } from "@/app/_components/ToastListener";
import { db } from "@/server/db";
import { getAppSettings } from "@/server/db/settings";
import { notificationDeliveries } from "@/server/db/schema";

import {
    clearFailedDeliveries,
    runAllNotifications,
    runEmailNotifications,
    runTelegramNotifications,
    runWecomNotifications,
    runWebhookNotifications,
    sendTestEmail,
    sendTestTelegram,
    sendTestWecom,
    sendTestWebhook,
    updateEmailSettings,
    updateTelegramSettings,
    updateWecomSettings,
    updateWebhookSettings,
} from "../../_actions/notifications";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
    params: Record<string, string | string[] | undefined>,
    key: string,
): string | null {
    const value = params[key];
    if (typeof value === "string") return value;
    return null;
}

export default async function NotificationsSettingsPage({ searchParams }: SettingsPageProps) {
    const settings = await getAppSettings();
    const recentDeliveries = await db
        .select()
        .from(notificationDeliveries)
        .orderBy(desc(notificationDeliveries.scheduledAt))
        .limit(12);

    const formatDateTime = (d: Date) =>
        new Intl.DateTimeFormat("zh-CN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: settings.timeZone,
        }).format(d);

    return (
        <div className="min-h-screen bg-base font-sans text-primary">
            <main className="mx-auto max-w-2xl p-6 sm:p-10">
                <div className="mb-6">
                    <Link href="/settings" className="text-xs text-muted hover:text-primary mb-2 inline-block">
                        ← 返回设置
                    </Link>
                    <AppHeader
                        title="通知设置"
                        description="配置消息推送渠道 (Telegram, Webhook, Email, WeCom)。"
                    />
                </div>

                <ToastListener />

                <section className="mt-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
                    <h2 className="text-sm font-medium">通知总览</h2>
                    <p className="mt-1 text-xs text-secondary">
                        渠道按顺序：Telegram → Webhook → 企业微信 → 邮件。执行会回溯 24h。
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <form action={runAllNotifications}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9 active-press"
                            >
                                按顺序执行全部
                            </Button>
                        </form>
                    </div>

                    <div className="mt-3 rounded-lg border border-divider bg-surface p-3 text-xs text-secondary">
                        <div className="font-medium text-primary">定时执行（Cron）</div>
                        <div className="mt-1">
                            可调用 <code className="font-mono">POST /api/cron/notify</code>{" "}
                            触发一次通知；如设置了{" "}
                            <code className="font-mono">NOTIFY_CRON_SECRET</code>，需在请求中带{" "}
                            <code className="font-mono">Authorization: Bearer &lt;secret&gt;</code>{" "}
                            或 <code className="font-mono">?token=&lt;secret&gt;</code>。
                        </div>
                    </div>
                </section>

                <section className="mt-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
                    <h2 className="text-sm font-medium">Telegram</h2>

                    <form action={updateTelegramSettings} className="mt-4 flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm text-primary">
                            <input
                                type="checkbox"
                                name="telegramEnabled"
                                value="1"
                                defaultChecked={settings.telegramEnabled}
                                className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                            />
                            启用 Telegram
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Bot Token{" "}
                            {settings.telegramBotToken ? (
                                <span className="ml-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    （已保存，留空不修改）
                                </span>
                            ) : null}
                            <Input
                                type="password"
                                name="telegramBotToken"
                                placeholder="123456:ABCDEF..."
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Chat ID{" "}
                            {settings.telegramChatId ? (
                                <span className="ml-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    （当前 {settings.telegramChatId}）
                                </span>
                            ) : null}
                            <Input
                                name="telegramChatId"
                                placeholder="-100xxxxxxxxxx"
                            />
                        </label>

                        <Button
                            type="submit"
                            variant="primary"
                            className="self-start active-press"
                        >
                            保存
                        </Button>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <form action={sendTestTelegram}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9 active-press"
                            >
                                发送测试
                            </Button>
                        </form>

                        <form action={runTelegramNotifications}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9 active-press"
                            >
                                执行通知（24h 回溯）
                            </Button>
                        </form>

                        <form action={clearFailedDeliveries}>
                            <input type="hidden" name="channel" value="telegram" />
                            <ConfirmSubmitButton
                                confirmMessage="确定清理 Telegram 的失败通知记录吗？清理后将允许重新发送。"
                                className="h-9 rounded-lg border border-divider px-3 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 active-press"
                            >
                                清理失败记录
                            </ConfirmSubmitButton>
                        </form>
                    </div>
                </section>

                <section className="mt-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
                    <h2 className="text-sm font-medium">Webhook</h2>

                    <form action={updateWebhookSettings} className="mt-4 flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm text-primary">
                            <input
                                type="checkbox"
                                name="webhookEnabled"
                                value="1"
                                defaultChecked={settings.webhookEnabled}
                                className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                            />
                            启用 Webhook
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Webhook URL
                            <Input
                                name="webhookUrl"
                                placeholder="https://example.com/webhook"
                                defaultValue={settings.webhookUrl ?? ""}
                            />
                        </label>

                        <Button
                            type="submit"
                            variant="primary"
                            className="self-start active-press"
                        >
                            保存
                        </Button>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <form action={sendTestWebhook}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9 active-press"
                            >
                                发送测试
                            </Button>
                        </form>

                        <form action={runWebhookNotifications}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9 active-press"
                            >
                                执行通知（24h 回溯）
                            </Button>
                        </form>

                        <form action={clearFailedDeliveries}>
                            <input type="hidden" name="channel" value="webhook" />
                            <ConfirmSubmitButton
                                confirmMessage="确定清理所有失败通知记录吗？清理后将允许重新发送。"
                                className="h-9 rounded-lg border border-divider px-3 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 active-press"
                            >
                                清理失败记录
                            </ConfirmSubmitButton>
                        </form>
                    </div>
                </section>

                <section className="mt-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
                    <h2 className="text-sm font-medium">企业微信</h2>

                    <form action={updateWecomSettings} className="mt-4 flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm text-primary">
                            <input
                                type="checkbox"
                                name="wecomEnabled"
                                value="1"
                                defaultChecked={settings.wecomEnabled}
                                className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                            />
                            启用 企业微信群机器人
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            Webhook URL
                            <Input
                                name="wecomWebhookUrl"
                                placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                                defaultValue={settings.wecomWebhookUrl ?? ""}
                            />
                        </label>

                        <Button
                            type="submit"
                            variant="primary"
                            className="self-start"
                        >
                            保存
                        </Button>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <form action={sendTestWecom}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9"
                            >
                                发送测试
                            </Button>
                        </form>

                        <form action={runWecomNotifications}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9"
                            >
                                执行通知（24h 回溯）
                            </Button>
                        </form>

                        <form action={clearFailedDeliveries}>
                            <input type="hidden" name="channel" value="wecom" />
                            <ConfirmSubmitButton
                                confirmMessage="确定清理企业微信的失败通知记录吗？清理后将允许重新发送。"
                                className="h-9 rounded-lg border border-divider px-3 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 active-press"
                            >
                                清理失败记录
                            </ConfirmSubmitButton>
                        </form>
                    </div>
                </section>

                <section className="mt-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
                    <h2 className="text-sm font-medium">邮件</h2>

                    <form action={updateEmailSettings} className="mt-4 flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm text-primary">
                            <input
                                type="checkbox"
                                name="emailEnabled"
                                value="1"
                                defaultChecked={settings.emailEnabled}
                                className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                            />
                            启用 邮件
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs text-secondary">
                                SMTP Host
                                <Input
                                    name="smtpHost"
                                    placeholder="smtp.example.com"
                                    defaultValue={settings.smtpHost ?? ""}
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-xs text-secondary">
                                SMTP Port
                                <Input
                                    name="smtpPort"
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="587"
                                    defaultValue={settings.smtpPort ?? 587}
                                />
                            </label>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-primary">
                            <input
                                type="checkbox"
                                name="smtpSecure"
                                value="1"
                                defaultChecked={settings.smtpSecure}
                                className="h-4 w-4 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20"
                            />
                            使用 TLS（通常 465）
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs text-secondary">
                                SMTP User（可选）
                                <Input
                                    name="smtpUser"
                                    defaultValue={settings.smtpUser ?? ""}
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-xs text-secondary">
                                SMTP Pass（可选）{" "}
                                {settings.smtpPass ? (
                                    <span className="ml-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        （已保存，留空不修改）
                                    </span>
                                ) : null}
                                <Input
                                    type="password"
                                    name="smtpPass"
                                />
                            </label>
                        </div>

                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            From
                            <Input
                                name="smtpFrom"
                                placeholder="you@example.com"
                                defaultValue={settings.smtpFrom ?? ""}
                            />
                        </label>

                        <label className="flex flex-col gap-1 text-xs text-secondary">
                            To
                            <Input
                                name="smtpTo"
                                placeholder="you@example.com"
                                defaultValue={settings.smtpTo ?? ""}
                            />
                        </label>

                        <Button
                            type="submit"
                            variant="primary"
                            className="self-start"
                        >
                            保存
                        </Button>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <form action={sendTestEmail}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9"
                            >
                                发送测试
                            </Button>
                        </form>

                        <form action={runEmailNotifications}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="h-9"
                            >
                                执行通知（24h 回溯）
                            </Button>
                        </form>

                        <form action={clearFailedDeliveries}>
                            <input type="hidden" name="channel" value="email" />
                            <ConfirmSubmitButton
                                confirmMessage="确定清理邮件的失败通知记录吗？清理后将允许重新发送。"
                                className="h-9 rounded-lg border border-divider px-3 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 active-press"
                            >
                                清理失败记录
                            </ConfirmSubmitButton>
                        </form>
                    </div>
                </section>

                <section className="mt-6 rounded-xl border border-default bg-elevated p-4 shadow-sm">
                    <h2 className="text-sm font-medium">最近通知记录</h2>

                    {recentDeliveries.length > 0 ? (
                        <ul className="mt-3 divide-y divide-divider rounded-lg border border-divider text-sm">
                            {recentDeliveries.map((d) => (
                                <li key={d.id} className="flex flex-col gap-2 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                                {d.channel === "telegram"
                                                    ? "TG"
                                                    : d.channel === "wecom"
                                                        ? "企业微信"
                                                        : d.channel === "email"
                                                            ? "邮件"
                                                            : "Webhook"}
                                            </Badge>
                                            <span className="text-xs text-muted">
                                                计划 {formatDateTime(d.scheduledAt)}
                                            </span>
                                        </div>

                                        <div className="truncate text-sm font-medium">{d.itemTitle}</div>
                                    </div>

                                    {d.error ? (
                                        <div className="mt-1 break-all text-[11px] text-red-600 dark:text-red-400">
                                            {d.error}
                                        </div>
                                    ) : null}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={d.status === "sent" ? "success" : d.status === "failed" ? "danger" : "warning"}>
                                                {d.status === "sent"
                                                    ? "已发送"
                                                    : d.status === "failed"
                                                        ? "失败"
                                                        : "发送中"}
                                            </Badge>
                                        </div>

                                        <Link
                                            href={
                                                d.itemType === "todo"
                                                    ? `/todo/${d.itemId}`
                                                    : d.itemType === "anniversary"
                                                        ? `/anniversaries/${d.itemId}`
                                                        : `/subscriptions/${d.itemId}`
                                            }
                                            className="shrink-0 rounded-lg border border-divider px-3 py-2 text-xs font-medium text-secondary hover:bg-interactive-hover hover-float"
                                        >
                                            查看
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-3 text-xs text-muted">
                            暂无通知记录。
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
