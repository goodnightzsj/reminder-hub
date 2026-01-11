"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@/app/_components/Button";
import { Input } from "@/app/_components/Input";
import { Badge } from "@/app/_components/Badge";
import { ConfirmSubmitButton } from "@/app/_components/ConfirmSubmitButton";
import type { appSettings } from "@/server/db/schema";
import {
    updateTelegramSettings,
    updateWebhookSettings,
    updateWecomSettings,
    updateEmailSettings,
    sendTestTelegram,
    sendTestWebhook,
    sendTestWecom,
    sendTestEmail,
    runTelegramNotifications,
    runWebhookNotifications,
    runWecomNotifications,
    runEmailNotifications,
    clearFailedDeliveries,
} from "@/app/_actions/notifications";

type AppSettingsPromise = typeof appSettings.$inferSelect;
// Since we pass the awaited settings object
type AppSettings = AppSettingsPromise;

type ChannelType = "telegram" | "webhook" | "wecom" | "email";

export type NotificationChannelModalProps = {
    isOpen: boolean;
    onClose: () => void;
    channel: ChannelType | null;
    settings: AppSettings;
};

// 传送门容器
const Portal = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
};

export function NotificationChannelModal({
    isOpen,
    onClose,
    channel,
    settings,
}: NotificationChannelModalProps) {
    // 关闭快捷键
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!channel) return null;

    const renderContent = () => {
        switch (channel) {
            case "telegram":
                return <TelegramForm settings={settings} />;
            case "webhook":
                return <WebhookForm settings={settings} />;
            case "wecom":
                return <WeComForm settings={settings} />;
            case "email":
                return <EmailForm settings={settings} />;
            default:
                return null;
        }
    };

    const getChannelTitle = (ch: ChannelType) => {
        switch (ch) {
            case "telegram": return "Configuration Telegram";
            case "webhook": return "Configuration Webhook";
            case "wecom": return "Configuration WeCom";
            case "email": return "Configuration Email";
        }
    };

    const getChannelIcon = (ch: ChannelType) => {
        switch (ch) {
            case "telegram": return { icon: "simple-icons:telegram", color: "#26A5E4" };
            case "webhook": return { icon: "mdi:webhook", color: "#8B5CF6" };
            case "wecom": return { icon: "simple-icons:wechat", color: "#07C160" };
            case "email": return { icon: "ri:mail-line", color: "#4A90E2" };
        }
    };

    const { icon, color } = getChannelIcon(channel);

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        />
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                        >
                            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-default bg-elevated shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-divider px-6 py-4 bg-surface/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-divider" style={{ color }}>
                                            <Icon icon={icon} className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-lg font-semibold">{getChannelTitle(channel)}</h2>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-1 text-muted hover:bg-muted/10 transition-colors"
                                    >
                                        <Icon icon="ri:close-line" className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                    {renderContent()}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}

// --- Sub Forms ---

function TelegramForm({ settings }: { settings: AppSettings }) {
    return (
        <div className="space-y-6">
            <form action={updateTelegramSettings} className="flex flex-col gap-4">
                <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors cursor-pointer border border-transparent hover:border-divider">
                    <input
                        type="checkbox"
                        name="telegramEnabled"
                        value="1"
                        defaultChecked={settings.telegramEnabled}
                        className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
                    />
                    <span className="text-sm font-medium">启用 Telegram 通知</span>
                </label>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-secondary">Bot Token</span>
                        {settings.telegramBotToken && <span className="text-[10px] text-success">已保存</span>}
                    </div>
                    <Input type="password" name="telegramBotToken" placeholder="123456:ABCDEF..." />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-secondary">Chat ID</span>
                        {settings.telegramChatId && <span className="text-[10px] text-muted">当前: {settings.telegramChatId}</span>}
                    </div>
                    <Input name="telegramChatId" placeholder="-100xxxxxxxxxx" />
                </div>

                <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full active-press">
                        保存配置
                    </Button>
                </div>
            </form>

            <ActionButtons
                channel="telegram"
                onTest={sendTestTelegram}
                onRun={runTelegramNotifications}
            />
        </div>
    );
}

function WebhookForm({ settings }: { settings: AppSettings }) {
    return (
        <div className="space-y-6">
            <form action={updateWebhookSettings} className="flex flex-col gap-4">
                <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors cursor-pointer border border-transparent hover:border-divider">
                    <input
                        type="checkbox"
                        name="webhookEnabled"
                        value="1"
                        defaultChecked={settings.webhookEnabled}
                        className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
                    />
                    <span className="text-sm font-medium">启用 Webhook 通知</span>
                </label>

                <div className="space-y-1.5">
                    <span className="text-xs font-medium text-secondary">Webhook URL</span>
                    <Input
                        name="webhookUrl"
                        placeholder="https://example.com/webhook"
                        defaultValue={settings.webhookUrl ?? ""}
                    />
                </div>

                <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full active-press">
                        保存配置
                    </Button>
                </div>
            </form>

            <ActionButtons
                channel="webhook"
                onTest={sendTestWebhook}
                onRun={runWebhookNotifications}
            />
        </div>
    );
}

function WeComForm({ settings }: { settings: AppSettings }) {
    return (
        <div className="space-y-6">
            <form action={updateWecomSettings} className="flex flex-col gap-4">
                <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors cursor-pointer border border-transparent hover:border-divider">
                    <input
                        type="checkbox"
                        name="wecomEnabled"
                        value="1"
                        defaultChecked={settings.wecomEnabled}
                        className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
                    />
                    <span className="text-sm font-medium">启用企业微信群机器人</span>
                </label>

                <div className="space-y-1.5">
                    <span className="text-xs font-medium text-secondary">Webhook URL</span>
                    <Input
                        name="wecomWebhookUrl"
                        placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                        defaultValue={settings.wecomWebhookUrl ?? ""}
                    />
                </div>

                <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full active-press">
                        保存配置
                    </Button>
                </div>
            </form>

            <ActionButtons
                channel="wecom"
                onTest={sendTestWecom}
                onRun={runWecomNotifications}
            />
        </div>
    );
}

function EmailForm({ settings }: { settings: AppSettings }) {
    return (
        <div className="space-y-6">
            <form action={updateEmailSettings} className="flex flex-col gap-4">
                <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors cursor-pointer border border-transparent hover:border-divider">
                    <input
                        type="checkbox"
                        name="emailEnabled"
                        value="1"
                        defaultChecked={settings.emailEnabled}
                        className="h-5 w-5 rounded border-emphasis text-brand-primary focus:ring-brand-primary/20 aspect-square"
                    />
                    <span className="text-sm font-medium">启用邮件通知</span>
                </label>

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
                        <Input type="password" name="smtpPass" placeholder={settings.smtpPass ? "已保存" : ""} />
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

                <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full active-press">
                        保存配置
                    </Button>
                </div>
            </form>

            <ActionButtons
                channel="email"
                onTest={sendTestEmail}
                onRun={runEmailNotifications}
            />
        </div>
    );
}

function ActionButtons({
    channel,
    onTest,
    onRun,
}: {
    channel: ChannelType;
    onTest: () => Promise<void>;
    onRun: () => Promise<void>;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-xl bg-surface p-4 border border-divider">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Actions</h3>
            <div className="grid grid-cols-3 gap-2">
                <form action={onTest} className="contents">
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-[11px] active-press">
                        发送测试
                    </Button>
                </form>
                <form action={onRun} className="contents">
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-[11px] active-press">
                        执行通知
                    </Button>
                </form>
                <form action={clearFailedDeliveries} className="contents">
                    <input type="hidden" name="channel" value={channel} />
                    <ConfirmSubmitButton
                        confirmMessage="确定清理失败记录吗？"
                        className="h-8 rounded-lg border border-divider px-2 text-[11px] font-medium text-danger hover:bg-danger/10 active-press transition-colors"
                    >
                        清理失败
                    </ConfirmSubmitButton>
                </form>
            </div>
        </div>
    );
}
