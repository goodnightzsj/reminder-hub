import { randomBytes, scryptSync } from "node:crypto";
import Database from "better-sqlite3";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_FILE_PATH || resolve(__dirname, "../data/app.db");
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

let db;
try {
  db = new Database(dbPath);
} catch {
  log(`[auth] 数据库不存在，跳过密码初始化: ${dbPath}`);
  process.exit(0);
}

const existing = db
  .prepare("SELECT admin_password_hash FROM app_settings WHERE id = ?")
  .get(SETTINGS_ID);

if (existing?.admin_password_hash) {
  db.close();
  process.exit(0);
}

const envPassword = process.env.ADMIN_PASSWORD;
const password = envPassword || randomBytes(24).toString("base64url").slice(0, 32);
const hash = hashPw(password);
const now = Date.now();

// Atomic check-and-set: only writes if hash is still NULL.
// If another process wrote a hash between our SELECT and UPDATE, the WHERE
// fails and we trust that winning value instead.
const result = db
  .prepare(
    "UPDATE app_settings SET admin_password_hash = ?, updated_at = ? WHERE id = ? AND admin_password_hash IS NULL",
  )
  .run(hash, now, SETTINGS_ID);

if (result.changes === 0 && !existing) {
  // Row didn't exist when we checked. Try to insert it.
  try {
    db
      .prepare(
        "INSERT INTO app_settings (id, admin_password_hash, updated_at) VALUES (?, ?, ?)",
      )
      .run(SETTINGS_ID, hash, now);
  } catch {
    // Another process inserted first — their password wins, don't log ours.
    db.close();
    process.exit(0);
  }
} else if (result.changes === 0) {
  // Another process already set a hash between our check and update.
  db.close();
  process.exit(0);
}

if (envPassword) {
  // Don't echo env-var passwords to logs.
  log("[auth] 已使用环境变量 ADMIN_PASSWORD 初始化管理密码");
} else {
  log("══════════════════════════════════════════");
  log("[auth] 已自动生成管理密码：");
  log(`[auth]   ${password}`);
  log("[auth] 请妥善保存，可在 设置 → 访问密码 中修改");
  log("══════════════════════════════════════════");
}

db.close();
