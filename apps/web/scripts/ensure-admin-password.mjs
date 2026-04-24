import { randomBytes, scryptSync } from "node:crypto";
import Database from "better-sqlite3";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

function resolveDbPath() {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("file:")) return resolve(projectRoot, url.slice("file:".length));
  const filePath = process.env.DATABASE_FILE_PATH;
  if (filePath) return resolve(projectRoot, filePath);
  return resolve(projectRoot, "data/app.db");
}

const dbPath = resolveDbPath();
const migrationsFolder = resolve(projectRoot, "drizzle");
const SETTINGS_ID = "singleton";
const SCRYPT_KEYLEN = 64;

function log(msg) {
  process.stderr.write(msg + "\n");
}

function hashPw(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

const db = new Database(dbPath);

// Ensure schema is present. Drizzle's migrator is a no-op for already-applied
// migrations, so running it here is safe even though src/server/db/index.ts
// also runs it on Next.js startup. On a fresh Docker volume this is the only
// way to guarantee the app_settings table exists before we touch it.
if (existsSync(migrationsFolder) && process.env.SKIP_DB_MIGRATIONS !== "1") {
  try {
    migrate(drizzle(db), { migrationsFolder });
  } catch (e) {
    log(`[auth] 迁移失败，跳过密码初始化（Next.js 启动时将重试）：${e.message}`);
    db.close();
    process.exit(0);
  }
}

let existing;
try {
  existing = db.prepare("SELECT admin_password_hash FROM app_settings WHERE id = ?").get(SETTINGS_ID);
} catch (e) {
  log(`[auth] 无法读取 app_settings，跳过密码初始化: ${e.message}`);
  db.close();
  process.exit(0);
}

if (existing?.admin_password_hash) {
  db.close();
  process.exit(0);
}

const envPassword = process.env.ADMIN_PASSWORD;
const password = envPassword || randomBytes(24).toString("base64url").slice(0, 32);
const hash = hashPw(password);
const now = Date.now();

// Atomic check-and-set: only writes if hash is still NULL.
const updated = db
  .prepare(
    "UPDATE app_settings SET admin_password_hash = ?, updated_at = ? WHERE id = ? AND admin_password_hash IS NULL",
  )
  .run(hash, now, SETTINGS_ID);

if (updated.changes === 0 && !existing) {
  try {
    db
      .prepare("INSERT INTO app_settings (id, admin_password_hash, updated_at) VALUES (?, ?, ?)")
      .run(SETTINGS_ID, hash, now);
  } catch {
    // Another process won the race.
    db.close();
    process.exit(0);
  }
} else if (updated.changes === 0) {
  // Another process set a hash between our SELECT and UPDATE.
  db.close();
  process.exit(0);
}

if (envPassword) {
  log("[auth] 已使用环境变量 ADMIN_PASSWORD 初始化管理密码");
} else {
  log("══════════════════════════════════════════");
  log("[auth] 已自动生成管理密码：");
  log(`[auth]   ${password}`);
  log("[auth] 请妥善保存，可在 设置 → 访问密码 中修改");
  log("══════════════════════════════════════════");
}

db.close();
