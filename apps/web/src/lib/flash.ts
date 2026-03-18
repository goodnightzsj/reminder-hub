export const FLASH_ACTION_MESSAGES = {
  created: "创建成功",
  updated: "保存成功",
  deleted: "已删除",
  restored: "已撤销删除",
} as const;

export const FLASH_STATUS_MESSAGES = {
  SETTINGS_SAVED: "设置已保存",
  SETTINGS_DATA_CLEARED: "数据已清空",
  NOTIFY_CLEARED: "失败记录已清理",
} as const;

export const FLASH_TOAST_MESSAGES = {
  backupImported: (stats: string) => `备份导入成功 (覆盖): ${stats}`,
  backupMerged: (stats: string) => `备份导入成功 (合并): ${stats}`,
  notifyFinished: (channel: string | null, stats: string) =>
    `通知执行完毕${channel ? ` (${channel})` : ""}: ${stats}`,
  notifyAllFinished: (summary: string) => `通知执行完毕 (all): ${summary}`,
  testSent: (channel: string) => `测试通知已发送 (${channel})`,
  testFailed: (channel: string) => `测试通知发送失败 (${channel})`,
} as const;

export type FlashAction = keyof typeof FLASH_ACTION_MESSAGES;

export function isFlashAction(value: string): value is FlashAction {
  return Object.prototype.hasOwnProperty.call(FLASH_ACTION_MESSAGES, value);
}

export const FLASH_ERROR_MESSAGES = {
  "missing-timezone": "请填写时区",
  "invalid-timezone": "时区无效，请使用 IANA 名称",
  "missing-date-reminder-time": "请填写日期类默认提醒时刻",
  "invalid-date-reminder-time": "日期类默认提醒时刻无效",
  "backup-missing-file": "请选择一个备份文件",
  "backup-invalid-json": "备份文件不是合法 JSON",
  "backup-invalid-format": "备份格式不正确",
  "backup-invalid-timezone": "备份内的时区无效",
  "backup-invalid-date-reminder-time": "备份内的默认提醒时刻无效",
  "backup-import-failed": "导入失败",
  "missing-webhook-url": "Webhook 已开启，但未填写 URL",
  "invalid-webhook-url": "Webhook URL 无效",
  "webhook-disabled": "Webhook 未开启",
  "telegram-disabled": "Telegram 未开启",
  "missing-telegram-token": "Telegram Bot Token 未填写",
  "missing-telegram-chat-id": "Telegram Chat ID 未填写",
  "wecom-disabled": "企业微信未开启",
  "missing-wecom-webhook-url": "企业微信 Webhook URL 未填写",
  "invalid-wecom-webhook-url": "企业微信 Webhook URL 无效",
  "feishu-disabled": "飞书未开启",
  "missing-feishu-webhook-url": "飞书 Webhook URL 未填写",
  "invalid-feishu-webhook-url": "飞书 Webhook URL 无效",
  "email-disabled": "邮件未开启",
  "missing-smtp-host": "SMTP Host 未填写",
  "missing-smtp-from": "SMTP 发件人未填写",
  "missing-smtp-to": "SMTP 收件人未填写",
  "missing-smtp-auth": "SMTP 账号/密码不完整",
  "invalid-smtp-port": "SMTP Port 无效",
  "invalid-internal-notify-interval": "通知扫描间隔无效",
  "invalid-internal-digest-time": "汇总发送时间无效",
  "validation-failed": "请检查填写内容",
} as const;

export type FlashErrorCode = keyof typeof FLASH_ERROR_MESSAGES;

export function isFlashErrorCode(value: string): value is FlashErrorCode {
  return Object.prototype.hasOwnProperty.call(FLASH_ERROR_MESSAGES, value);
}

export function getFlashErrorMessage(code: string): string {
  return isFlashErrorCode(code) ? FLASH_ERROR_MESSAGES[code] : `发生错误: ${code}`;
}

export const FLASH_TOAST_QUERY_KEY = {
  // Global actions
  ACTION: "action",

  // Settings
  SAVED: "saved",
  ERROR: "error",
  DATA_CLEARED: "dataCleared",

  // Backup
  BACKUP_IMPORTED: "backupImported",
  BACKUP_MERGED: "backupMerged",
  BACKUP_MESSAGE: "backupMessage",
  BACKUP_SETTINGS: "backupSettings",
  BACKUP_TODOS: "backupTodos",
  BACKUP_SUBTASKS: "backupSubtasks",
  BACKUP_ANNIVERSARIES: "backupAnniversaries",
  BACKUP_SUBSCRIPTIONS: "backupSubscriptions",
  BACKUP_ITEMS: "backupItems",
  BACKUP_DELIVERIES: "backupDeliveries",
  BACKUP_DIGEST_DELIVERIES: "backupDigestDeliveries",

  // Notifications
  NOTIFY_SENT: "notifySent",
  NOTIFY_FAILED: "notifyFailed",
  NOTIFY_SKIPPED: "notifySkipped",
  NOTIFY_CHANNEL: "notifyChannel",
  NOTIFY_CLEARED: "notifyCleared",
  NOTIFY_SUMMARY: "notifySummary",

  // Test notifications
  TEST_CHANNEL: "testChannel",
  TEST: "test",
  TEST_MESSAGE: "testMessage",
  MESSAGE: "message",
} as const;

export type FlashToastQueryKey =
  (typeof FLASH_TOAST_QUERY_KEY)[keyof typeof FLASH_TOAST_QUERY_KEY];

export const FLASH_TOAST_QUERY_KEYS = Object.values(
  FLASH_TOAST_QUERY_KEY,
) as readonly FlashToastQueryKey[];

export const FLASH_FLAG_VALUE_TRUE = "1" as const;
export const FLASH_FLAG_VALUE_FALSE = "0" as const;
