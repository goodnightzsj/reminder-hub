import { randomBytes, scryptSync } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { appSettings } from "./db/schema";
import { SETTINGS_ID } from "./db/app-settings.constants";

const SCRYPT_KEYLEN = 64;

function hashPw(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

export async function ensureAdminPassword(): Promise<void> {
  const row = await db
    .select({ adminPasswordHash: appSettings.adminPasswordHash })
    .from(appSettings)
    .where(eq(appSettings.id, SETTINGS_ID))
    .get();

  if (row?.adminPasswordHash) return;

  const envPassword = process.env.ADMIN_PASSWORD;
  let password: string;

  if (envPassword) {
    password = envPassword;
    console.log("[auth] 使用环境变量 ADMIN_PASSWORD 作为管理密码");
  } else {
    password = randomBytes(24).toString("base64url").slice(0, 32);
    console.log("══════════════════════════════════════════");
    console.log("[auth] 已自动生成管理密码：");
    console.log(`[auth]   ${password}`);
    console.log("[auth] 请妥善保存，可在 设置 → 访问密码 中修改");
    console.log("══════════════════════════════════════════");
  }

  const hash = hashPw(password);

  if (row) {
    await db
      .update(appSettings)
      .set({ adminPasswordHash: hash, updatedAt: new Date() })
      .where(eq(appSettings.id, SETTINGS_ID));
  } else {
    await db
      .insert(appSettings)
      .values({ id: SETTINGS_ID, adminPasswordHash: hash, updatedAt: new Date() })
      .onConflictDoUpdate({ target: appSettings.id, set: { adminPasswordHash: hash, updatedAt: new Date() } });
  }
}
