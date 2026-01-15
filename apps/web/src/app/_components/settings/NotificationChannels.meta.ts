"use client";

import type { ReactElement } from "react";

import { NOTIFICATION_CHANNELS } from "@/lib/notifications";

import {
  EmailForm,
  TelegramForm,
  WeComForm,
  WebhookForm,
} from "./NotificationChannelForms";
import type { ChannelType, NotificationSettings } from "./NotificationSettings.types";

export type NotificationChannelMeta = {
  name: string;
  icon: string;
  color: string;
  statusText: { enabled: string; disabled: string };
  modalTitle: string;
  Form: (props: { settings: NotificationSettings }) => ReactElement;
};

export const NOTIFICATION_CHANNEL_ORDER = NOTIFICATION_CHANNELS;

export const NOTIFICATION_CHANNEL_META: Record<ChannelType, NotificationChannelMeta> = {
  telegram: {
    name: "Telegram",
    icon: "simple-icons:telegram",
    color: "#26A5E4",
    statusText: { enabled: "已绑定", disabled: "未绑定" },
    modalTitle: "Configuration Telegram",
    Form: TelegramForm,
  },
  webhook: {
    name: "Webhook",
    icon: "mdi:webhook",
    color: "#8B5CF6",
    statusText: { enabled: "已启用", disabled: "未启用" },
    modalTitle: "Configuration Webhook",
    Form: WebhookForm,
  },
  wecom: {
    name: "企业微信",
    icon: "simple-icons:wechat",
    color: "#07C160",
    statusText: { enabled: "已启用", disabled: "未启用" },
    modalTitle: "Configuration WeCom",
    Form: WeComForm,
  },
  email: {
    name: "邮箱",
    icon: "ri:mail-line",
    color: "#4A90E2",
    statusText: { enabled: "已启用", disabled: "未启用" },
    modalTitle: "Configuration Email",
    Form: EmailForm,
  },
};

