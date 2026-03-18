"use client";

import type { ReactElement, ReactNode } from "react";

import { NOTIFICATION_CHANNELS } from "@/lib/notifications";

import {
  EmailForm,
  FeishuForm,
  TelegramForm,
  WeComForm,
  WebhookForm,
} from "./NotificationChannelForms";
import type { ChannelType, NotificationSettings } from "./NotificationSettings.types";

export type NotificationChannelMeta = {
  name: string;
  icon: string | ReactNode;
  color: string;
  statusText: { enabled: string; disabled: string };
  modalTitle: string;
  Form: (props: { settings: NotificationSettings }) => ReactElement;
};

export const NOTIFICATION_CHANNEL_ORDER = NOTIFICATION_CHANNELS;

function FeishuIcon(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      viewBox="0 0 48 48"
      className={props.className}
    >
      <mask id="todo-list-feishu-icon-mask">
        <g fill="none">
          <g clipPath="url(#todo-list-feishu-icon-clip)">
            <path
              stroke="#fff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              d="M3.494 17.72L41.678 6.321L30.364 44.59l-8.88-8.88l.041-9.234l-9.546-.27l-8.485-8.486Z"
            />
            <path
              fill="#fff"
              fillRule="evenodd"
              d="M27.535 14.89a4 4 0 1 0 5.657 5.658a4 4 0 0 0-5.657-5.657Z"
              clipRule="evenodd"
            />
            <path
              stroke="#fff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              d="M41.678 6.406L30.364 17.719"
            />
          </g>
          <defs>
            <clipPath id="todo-list-feishu-icon-clip">
              <path fill="#000" d="M0 0h48v48H0z" />
            </clipPath>
          </defs>
        </g>
      </mask>
      <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#todo-list-feishu-icon-mask)" />
    </svg>
  );
}

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
  feishu: {
    name: "飞书",
    icon: <FeishuIcon className="h-6 w-6" />,
    color: "#00D6B9",
    statusText: { enabled: "已启用", disabled: "未启用" },
    modalTitle: "Configuration Feishu",
    Form: FeishuForm,
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
