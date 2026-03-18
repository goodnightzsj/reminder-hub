# Backup System Architecture

## Overview
备份系统用于在不同部署之间迁移完整业务数据，并保留系统内通知/汇总相关状态。

## Export
- 路由：`apps/web/src/app/api/backup/export/route.ts:1`
- 当前导出格式：`schemaVersion = 2`
- 导出内容分两层：
  - `app`：`timeZone`、`dateReminderTime`、完整 `app_settings` 快照
  - `data`：`todos`、`todo_subtasks`、`anniversaries`、`subscriptions`、`items`、`notification_deliveries`、`digest_deliveries`、`service_icons`、`brand_metadata`

## Import
- Server Actions：`apps/web/src/app/_actions/backup.ts:1`
- 解析与校验：`apps/web/src/app/_actions/backup.import.utils.ts:1`
- 结构解析器：`apps/web/src/server/backup/backup-parser.ts:1`

## Import Modes

### 覆盖导入
- 删除备份覆盖范围内的现有数据后再插入
- 当备份为 `schemaVersion = 2` 时，同时恢复完整 `app_settings`
- 恢复完整设置后会调用 `apps/web/src/server/internal-scheduler.ts:149` 重新同步系统内定时任务

### 合并导入
- 仅插入当前不存在的记录，主键冲突时跳过
- 不覆盖当前部署的 `app_settings`
- 会合并 `notification_deliveries`、`digest_deliveries`、`service_icons`、`brand_metadata`

## Compatibility
- 仍兼容导入旧的 `schemaVersion = 1` 备份
- `schemaVersion = 1` 仅包含基础业务数据与时间设置，因此无法完整恢复通知渠道配置、系统内定时任务配置和摘要发送状态

## Data Fidelity
- 主键会被保留，不会重建 UUID
- 软删除字段 `deletedAt` 会随备份一起迁移
- 订阅的 `category`、`icon`、`color` 也会保留
- 周报/月报去重依赖的 `digest_deliveries` 会随备份迁移

## Non-Goals
- 不负责迁移部署级环境变量，如 `DATABASE_FILE_PATH`、`NOTIFY_CRON_SECRET`
- `brand_metadata` 虽然会被导出导入，但它本质上仍是可重建缓存，不影响核心业务正确性
