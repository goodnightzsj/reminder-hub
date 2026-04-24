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

const row = db.prepare("SELECT admin_password_hash FROM app_settings WHERE id = ?").get(SETTINGS_ID);

if (row?.admin_password_hash) {
  db.close();
  process.exit(0);
}

const envPassword = process.env.ADMIN_PASSWORD;
let password;

if (envPassword) {
  password = envPassword;
  log("[auth] 使用环境变量 ADMIN_PASSWORD 作为管理密码");
} else {
  password = randomBytes(24).toString("base64url").slice(0, 32);
  log("══════════════════════════════════════════");
  log("[auth] 已自动生成管理密码：");
  log(`[auth]   ${password}`);
  log("[auth] 请妥善保存，可在 设置 → 访问密码 中修改");
  log("══════════════════════════════════════════");
}

const hash = hashPw(password);

if (row) {
  db.prepare("UPDATE app_settings SET admin_password_hash = ?, updated_at = ? WHERE id = ?")
    .run(hash, Date.now(), SETTINGS_ID);
} else {
  db.prepare("INSERT OR REPLACE INTO app_settings (id, admin_password_hash, updated_at) VALUES (?, ?, ?)")
    .run(SETTINGS_ID, hash, Date.now());
}

db.close();
