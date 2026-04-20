# 作为 systemd 系统服务部署

适合已有 Linux 主机（VPS / 家用服务器 / NAS 宿主），希望**不经过 Docker** 直接以原生进程跑 reminder-hub。相比 Docker 部署，少一层隔离，日志走 journald、重启走 systemctl，依赖系统已装的 Node.js。

本指南对应的实际部署也已跑通：**`reminder.9962510.xyz`**（Cloudflare 代理 + Nginx 反代 + systemd）。

---

## 适用前提

- Linux 发行版（Ubuntu 22.04+ / Debian 12+ / 任意启用 systemd 的发行版）
- Node.js 20 或更高（**推荐 22 / 24**，与 GitHub Actions 中的 `node 20+` 兼容）
- 有 root 或 sudo 权限
- 已装 `git`、`rsync`、`curl`

可选（推荐生产必备）：

- Nginx 或 Caddy 作反向代理并提供 TLS
- fail2ban 监控登录爆破
- UFW / nftables 只开放 80/443

---

## 步骤 A · 准备账户与目录

创建专用系统用户 + 代码目录 + 持久数据目录：

```bash
sudo useradd --system --home-dir /opt/reminder-hub --shell /usr/sbin/nologin reminder-hub
sudo mkdir -p /opt/reminder-hub /var/lib/reminder-hub
```

把仓库代码放到 `/opt/reminder-hub`（后续升级也从这里 `git pull`）：

```bash
# 方式 1：直接 clone
sudo -u reminder-hub git clone https://github.com/goodnightzsj/reminder-hub.git /opt/reminder-hub

# 方式 2：从已有克隆同步过去（排除 node_modules 与已有数据库）
sudo rsync -a --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='apps/web/data' \
  --exclude='apps/web/.env' \
  /path/to/reminder-hub/ /opt/reminder-hub/
sudo chown -R reminder-hub:reminder-hub /opt/reminder-hub /var/lib/reminder-hub
```

---

## 步骤 B · 环境变量

单独放在 `/etc/reminder-hub.env`，权限收紧到 `640`，组属主是服务用户，保证密钥不会随仓库入库：

```bash
SECRET=$(openssl rand -hex 32)
sudo tee /etc/reminder-hub.env > /dev/null <<EOF
NODE_ENV=production
PORT=3001
HOSTNAME=127.0.0.1
DATABASE_FILE_PATH=/var/lib/reminder-hub/app.db
DATABASE_URL=file:/var/lib/reminder-hub/app.db
SKIP_DB_MIGRATIONS=0
NOTIFY_CRON_SECRET=$SECRET
EOF
sudo chmod 640 /etc/reminder-hub.env
sudo chown root:reminder-hub /etc/reminder-hub.env
```

> **端口挑选**：该主机已用了 `8090`（cc-observer）、`8080`（中台服务），这里选 **3001**。端口号本身不敏感——只要反代能转到即可。

---

## 步骤 C · 安装依赖 + 迁移 + 构建

```bash
cd /opt/reminder-hub/apps/web
sudo -u reminder-hub -H env HOME=/opt/reminder-hub npm ci

# 首次部署（或升级包含新迁移）必跑
sudo -u reminder-hub -H env \
  HOME=/opt/reminder-hub \
  DATABASE_FILE_PATH=/var/lib/reminder-hub/app.db \
  DATABASE_URL=file:/var/lib/reminder-hub/app.db \
  npm run db:migrate

# 生成生产构建
sudo -u reminder-hub -H env \
  HOME=/opt/reminder-hub \
  DATABASE_FILE_PATH=/var/lib/reminder-hub/app.db \
  DATABASE_URL=file:/var/lib/reminder-hub/app.db \
  npm run build
```

> 关于 `better-sqlite3`：它是 Node 原生模块。Ubuntu/Debian/Alpine 上有预编译二进制，`npm ci` 会自动拉取匹配的版本；**不需要 `build-essential` / `python3-dev`**，除非你的平台恰好没有 prebuild。

---

## 步骤 D · systemd unit

`/etc/systemd/system/reminder-hub.service`：

```ini
[Unit]
Description=Reminder Hub (Next.js + SQLite)
Documentation=https://github.com/goodnightzsj/reminder-hub
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=reminder-hub
Group=reminder-hub
WorkingDirectory=/opt/reminder-hub/apps/web
EnvironmentFile=/etc/reminder-hub.env
ExecStart=/usr/bin/npm run start -- --port 3001 --hostname 127.0.0.1
Restart=on-failure
RestartSec=5s
TimeoutStopSec=30s
KillMode=mixed
StandardOutput=journal
StandardError=journal
SyslogIdentifier=reminder-hub

# --- 安全加固（systemd sandbox） ---
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectControlGroups=yes
ProtectClock=yes
ProtectHostname=yes
RestrictSUIDSGID=yes
RestrictNamespaces=yes
RestrictRealtime=yes
LockPersonality=yes

ReadWritePaths=/var/lib/reminder-hub /opt/reminder-hub/apps/web/.next
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
CapabilityBoundingSet=
AmbientCapabilities=
SystemCallArchitectures=native
SystemCallFilter=@system-service
SystemCallFilter=~@privileged @resources @obsolete

LimitNOFILE=4096
TasksMax=256

[Install]
WantedBy=multi-user.target
```

> **ReadWritePaths** 里为什么同时列 `.next`？Next.js 启动时会写 trace/缓存到 `.next/cache`。如果你禁用缓存（生产不建议），可以只保留 `/var/lib/reminder-hub`。

启用与启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now reminder-hub.service
sudo systemctl status reminder-hub.service
```

实时看日志：

```bash
journalctl -u reminder-hub -f
```

---

## 步骤 E · 反代 & 子域（Nginx + Cloudflare 模式）

本仓库项目跑在已经有一套「Cloudflare 代理 + Authenticated Origin Pulls + Nginx」策略的主机上。下述配置已按该策略对齐。

### 前置（一次性建立）

假设已有：

- Cloudflare 为 `*.9962510.xyz` 签发的 **Origin CA 证书** → `/etc/nginx/ssl/cert.pem` + `key.pem`
- CF 的 **Authenticated Origin Pulls CA** → `/etc/nginx/cloudflare-origin-pull-ca.pem`
- UFW 仅放行 Cloudflare IP 段到 80/443
- `/etc/nginx/conf.d/00-default-reject.conf` 拒绝所有无 SNI / 未知 SNI 的 TLS 握手（`ssl_reject_handshake on;`）
- `nginx.conf` 中已定义 `rl_api`、`rl_admin`、`conn_limit_per_ip`、`$bad_ua`、`cf_main` 日志格式

如果你是新主机，可以从 [`how-to-deploy-with-docker.md`](how-to-deploy-with-docker.md) 的"对接 Cloudflare"章节开始建立这一整套；然后再回到这里。

### 子域选择

`reminder.9962510.xyz`。在 Cloudflare DNS 里加一条 `A` / `AAAA` 记录指向源站 IP，**开启橙云**（强制走 CF），并在 SSL/TLS 设置里把该子域的 **Authenticated Origin Pulls** 打开。

### Nginx 站点配置

`/etc/nginx/sites/reminder.9962510.xyz.conf`：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name reminder.9962510.xyz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name reminder.9962510.xyz;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    ssl_client_certificate /etc/nginx/cloudflare-origin-pull-ca.pem;
    ssl_verify_client on;

    access_log /var/log/nginx/reminder.9962510.access.log cf_main;
    error_log  /var/log/nginx/reminder.9962510.error.log warn;

    client_max_body_size     16m;
    client_body_buffer_size  512k;
    client_body_timeout      60s;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;

    if ($bad_ua) { return 403; }
    location ~ /\.(?!well-known) { return 403; }
    location ~* ^/(\.git|\.svn|\.hg|\.env|\.DS_Store|composer\.(json|lock)|package(-lock)?\.json|yarn\.lock)$ { return 403; }
    location ~* \.(bak|old|backup|conf|config|sql|sqlite|log|gz|zip|tar|tgz|7z)$ { return 403; }
    location ~* ^/(wp-admin|wp-login\.php|xmlrpc\.php|phpmyadmin|pma|adminer)$ { return 403; }

    # cron 触发专用通道：更严格的 rate limit（应用内也有 Bearer 验签）
    location ^~ /api/cron/ {
        limit_req  zone=rl_admin  burst=3 nodelay;
        limit_conn conn_limit_per_ip 5;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout    70s;  # 略大于应用内 withCronTimeout(55s)
        proxy_send_timeout    30s;
    }

    location ^~ /settings {
        limit_req  zone=rl_admin  burst=5 nodelay;
        limit_conn conn_limit_per_ip 10;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout    30s;
        proxy_send_timeout    30s;
    }

    location / {
        limit_req  zone=rl_api  burst=40 nodelay;
        limit_conn conn_limit_per_ip 30;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_connect_timeout 10s;
        proxy_read_timeout    60s;
        proxy_send_timeout    60s;
    }
}
```

启用：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 步骤 F · 触发通知 cron

应用自带进程内调度器（settings 页可开关），它会在 Node 进程内定时执行。如果你用外部 cron 触发更保险，加一条系统 crontab（用 root 或任何能读 `/etc/reminder-hub.env` 的用户）：

```cron
*/5 * * * * . /etc/reminder-hub.env && curl -fsS -H "Authorization: Bearer $NOTIFY_CRON_SECRET" https://reminder.9962510.xyz/api/cron/notify >/dev/null
5 9 * * 1  . /etc/reminder-hub.env && curl -fsS -H "Authorization: Bearer $NOTIFY_CRON_SECRET" https://reminder.9962510.xyz/api/cron/digest/weekly >/dev/null
5 9 1 * *  . /etc/reminder-hub.env && curl -fsS -H "Authorization: Bearer $NOTIFY_CRON_SECRET" https://reminder.9962510.xyz/api/cron/digest/monthly >/dev/null
```

> 应用内部 `withCronTimeout(55s)` 会在长任务时返回 `504`，不会拖住 systemd 主进程。

---

## 步骤 G · 升级流程

```bash
# 拉最新代码
sudo -u reminder-hub git -C /opt/reminder-hub pull

# 装依赖 / 跑迁移 / 重建
cd /opt/reminder-hub/apps/web
sudo -u reminder-hub -H env HOME=/opt/reminder-hub npm ci
sudo -u reminder-hub -H env \
  HOME=/opt/reminder-hub \
  DATABASE_FILE_PATH=/var/lib/reminder-hub/app.db \
  DATABASE_URL=file:/var/lib/reminder-hub/app.db \
  npm run db:migrate
sudo -u reminder-hub -H env \
  HOME=/opt/reminder-hub \
  DATABASE_FILE_PATH=/var/lib/reminder-hub/app.db \
  DATABASE_URL=file:/var/lib/reminder-hub/app.db \
  npm run build

# 优雅重启
sudo systemctl restart reminder-hub
```

重启期间旧进程直到收到 SIGTERM 之后才退出，整体中断约 1 秒。

---

## 步骤 H · 常见问题

### `EACCES: permission denied, open '/opt/reminder-hub/apps/web/.next/trace'`

`ReadWritePaths` 未包含 `.next`，或 `.next` 目录属主不是 `reminder-hub`。修复：

```bash
sudo chown -R reminder-hub:reminder-hub /opt/reminder-hub/apps/web/.next
```

### better-sqlite3 `ENOENT: better_sqlite3.node`

prebuild 未匹配当前 Node 版本。解决：

```bash
cd /opt/reminder-hub/apps/web
sudo -u reminder-hub -H env HOME=/opt/reminder-hub npm rebuild better-sqlite3
sudo systemctl restart reminder-hub
```

### 页面能开，但 `/api/cron/notify` 回 401

`NOTIFY_CRON_SECRET` 为空或不一致。应用侧空值等于放行所有请求，生产一定要填。

### 源站直连 IP 能看到证书

确认 `00-default-reject.conf`（`ssl_reject_handshake on;`）已加载，且 UFW 只放 CF IP 段。本仓库根目录 `DEVELOPMENT.md` 也记录了这个模式。

---

## 数据与备份

- SQLite 文件：`/var/lib/reminder-hub/app.db`。
- 备份建议：`systemd timer` 每日 `sqlite3 app.db '.backup' /backup/...`，或用 `restic` / `borg` 增量备份 `/var/lib/reminder-hub/`。
- 如果从 Docker 部署迁过来，直接把 `app.db` 复制到 `/var/lib/reminder-hub/` 即可；迁移步骤见 [`how-to-migrate-between-deployments.md`](how-to-migrate-between-deployments.md)。

---

## 卸载

```bash
sudo systemctl disable --now reminder-hub.service
sudo rm /etc/systemd/system/reminder-hub.service /etc/reminder-hub.env
sudo systemctl daemon-reload
sudo rm /etc/nginx/sites/reminder.9962510.xyz.conf
sudo nginx -t && sudo systemctl reload nginx
# 保留数据以便恢复：
# sudo rm -rf /opt/reminder-hub /var/lib/reminder-hub
sudo userdel reminder-hub
```
