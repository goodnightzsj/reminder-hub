"use client";

import { useState } from "react";
import { NotificationChannelCard } from "./NotificationChannelCard";
import { NotificationChannelModal } from "./NotificationChannelModal";
import type { NotificationChannelModalProps } from "./NotificationChannelModal";
import type { AppSettings } from "./NotificationChannelForms";
import { NOTIFICATION_CHANNEL_META, NOTIFICATION_CHANNEL_ORDER } from "./NotificationChannels.meta";

interface NotificationSettingsSectionProps {
    settings: AppSettings;
}

export function NotificationSettingsSection({ settings }: NotificationSettingsSectionProps) {
    const [activeChannel, setActiveChannel] = useState<NotificationChannelModalProps["channel"]>(null);

    type ChannelId = NonNullable<NotificationChannelModalProps["channel"]>;

    const enabledByChannel: Record<ChannelId, boolean> = {
        telegram: settings.telegramEnabled,
        webhook: settings.webhookEnabled,
        wecom: settings.wecomEnabled,
        email: settings.emailEnabled,
    };

    return (
        <>
            <section className="grid gap-4 sm:grid-cols-2">
                {NOTIFICATION_CHANNEL_ORDER.map((id) => {
                    const meta = NOTIFICATION_CHANNEL_META[id];
                    const enabled = enabledByChannel[id];
                    const statusText = enabled ? meta.statusText.enabled : meta.statusText.disabled;

                    return (
                        <NotificationChannelCard
                            key={id}
                            name={meta.name}
                            icon={meta.icon}
                            brandColor={meta.color}
                            status={enabled ? "bound" : "unbound"}
                            statusText={statusText}
                            actionLabel={enabled ? "配置" : "绑定"}
                            onAction={() => setActiveChannel(id)}
                        />
                    );
                })}
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
