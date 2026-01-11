"use client";

import { useState } from "react";
import { NotificationChannelCard } from "./NotificationChannelCard";
import { NotificationChannelModal } from "./NotificationChannelModal";
import type { appSettings } from "@/server/db/schema";
import type { NotificationChannelModalProps } from "./NotificationChannelModal";

type AppSettings = typeof appSettings.$inferSelect;

interface NotificationSettingsSectionProps {
    settings: AppSettings;
}

export function NotificationSettingsSection({ settings }: NotificationSettingsSectionProps) {
    const [activeChannel, setActiveChannel] = useState<NotificationChannelModalProps["channel"]>(null);

    const notificationChannels = [
        {
            id: "telegram",
            name: "Telegram",
            icon: "simple-icons:telegram",
            brandColor: "#26A5E4",
            enabled: settings.telegramEnabled,
            statusText: settings.telegramEnabled ? "已绑定" : "未绑定",
        },
        {
            id: "webhook",
            name: "Webhook",
            icon: "mdi:webhook", // Fix: use valid icon
            brandColor: "#8B5CF6",
            enabled: settings.webhookEnabled,
            statusText: settings.webhookEnabled ? "已启用" : "未启用",
        },
        {
            id: "wecom",
            name: "企业微信",
            icon: "simple-icons:wechat",
            brandColor: "#07C160",
            enabled: settings.wecomEnabled,
            statusText: settings.wecomEnabled ? "已启用" : "未启用",
        },
        {
            id: "email",
            name: "邮箱",
            icon: "ri:mail-line",
            brandColor: "#4A90E2",
            enabled: settings.emailEnabled,
            statusText: settings.emailEnabled ? "已启用" : "未启用",
        },
    ] as const;

    return (
        <>
            <section className="grid gap-4 sm:grid-cols-2">
                {notificationChannels.map((channel) => (
                    <NotificationChannelCard
                        key={channel.id}
                        name={channel.name}
                        icon={channel.icon}
                        brandColor={channel.brandColor}
                        status={channel.enabled ? "bound" : "unbound"}
                        statusText={channel.statusText}
                        actionLabel={channel.enabled ? "配置" : "绑定"}
                        actionHref="#" // Not used because we provide onAction
                        onAction={() => setActiveChannel(channel.id as any)}
                    />
                ))}
            </section>

            <NotificationChannelModal
                isOpen={!!activeChannel}
                onClose={() => setActiveChannel(null)}
                channel={activeChannel}
                settings={settings}
            />
        </>
    );
}
