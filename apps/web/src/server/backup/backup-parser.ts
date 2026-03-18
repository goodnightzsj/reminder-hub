import "server-only";

export { isRecord } from "./backup-parser.utils";

export { parseBackupV1 } from "./backup-parser.v1";
export type { BackupV1 } from "./backup-parser.v1";
export { parseBackupV2 } from "./backup-parser.v2";
export type { BackupV2 } from "./backup-parser.v2";

import { parseBackupV1 } from "./backup-parser.v1";
import { parseBackupV2 } from "./backup-parser.v2";

export { parseTodoRow, parseTodoSubtaskRow } from "./backup-parser.todos";
export { parseAnniversaryRow } from "./backup-parser.anniversaries";
export { parseSubscriptionRow } from "./backup-parser.subscriptions";
export { parseItemRow } from "./backup-parser.items";
export { parseNotificationDeliveryRow } from "./backup-parser.notification-deliveries";
export { parseDigestDeliveryRow } from "./backup-parser.digest-deliveries";
export { parseServiceIconRow, parseBrandMetadataRow } from "./backup-parser.service-icons";
export { parseAppSettingsRow } from "./backup-parser.app-settings";

export type BackupFile = import("./backup-parser.v1").BackupV1 | import("./backup-parser.v2").BackupV2;

export function parseBackup(value: unknown): BackupFile | null {
  return parseBackupV2(value) ?? parseBackupV1(value);
}
