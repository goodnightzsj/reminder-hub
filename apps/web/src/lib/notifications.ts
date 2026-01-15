export const notificationChannelValues = [
  "telegram",
  "webhook",
  "wecom",
  "email",
] as const;
export type NotificationChannel = (typeof notificationChannelValues)[number];

export const NOTIFICATION_CHANNEL = {
  TELEGRAM: "telegram",
  WEBHOOK: "webhook",
  WECOM: "wecom",
  EMAIL: "email",
} as const satisfies Record<string, NotificationChannel>;

export const DEFAULT_NOTIFICATION_CHANNEL: NotificationChannel = NOTIFICATION_CHANNEL.WEBHOOK;

export const NOTIFICATION_CHANNELS = notificationChannelValues;

export function isNotificationChannel(value: string): value is NotificationChannel {
  return (notificationChannelValues as readonly string[]).includes(value);
}

export const notificationItemTypeValues = [
  "todo",
  "anniversary",
  "subscription",
] as const;
export type NotificationItemType = (typeof notificationItemTypeValues)[number];

export const NOTIFICATION_ITEM_TYPE = {
  TODO: "todo",
  ANNIVERSARY: "anniversary",
  SUBSCRIPTION: "subscription",
} as const satisfies Record<string, NotificationItemType>;

export function isNotificationItemType(value: string): value is NotificationItemType {
  return (notificationItemTypeValues as readonly string[]).includes(value);
}

export const notificationDeliveryStatusValues = ["sending", "sent", "failed"] as const;
export type NotificationDeliveryStatus =
  (typeof notificationDeliveryStatusValues)[number];

export function isNotificationDeliveryStatus(
  value: string,
): value is NotificationDeliveryStatus {
  return (notificationDeliveryStatusValues as readonly string[]).includes(value);
}

export const NOTIFICATION_DELIVERY_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  FAILED: "failed",
} as const satisfies Record<string, NotificationDeliveryStatus>;
