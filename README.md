# Todo List / 综合提醒管理平台

一个面向长期自托管的个人提醒与记录平台，统一管理待办、纪念日、订阅和物品信息，并通过多渠道通知、周期摘要和年度回顾把“记录”变成“可执行的提醒系统”。

## 项目定位

- 适合个人或小团队自托管，优先考虑长期运行、低维护成本和本地数据持久化。
- 以 SQLite 为默认存储，部署门槛低，适合 NAS、VPS、家庭服务器和开发机。
- 除日常管理外，已经内置通知、周报/月报、年度回顾等复盘能力。

## 核心能力

### 1. Todo 待办管理

- 优先级、分类、标签
- 截止时间与多重提醒
- 子任务拆分
- 循环任务
- 完成、归档、软删除

### 2. 纪念日管理

- 公历 / 农历
- 每年自动重复
- 提前提醒
- 即将到来统计

### 3. 订阅管理

- 月付 / 年付周期
- 到期提醒
- 手动续期记录
- 自动续费信息整理

### 4. 物品与清单管理

- 物品记录与状态追踪
- 清单视图
- 年度回顾中的分类展示

### 5. 通知与摘要

- 通知渠道：飞书、企业微信、Telegram、Webhook、Email
- 启用渠道统一发送
- 支持系统内置定时任务
- 支持外部 cron 触发
- 周报、月报、年度回顾

### 6. 年度回顾

- `/review` 年份入口页
- `/review/[year]` 年度独立回顾页
- 年度概览、完成统计、分类汇总、完成详情、清单预览

### 7. 访问密码保护

- 首次启动自动生成 32 位随机管理密码（写入数据库并打印到日志）
- 支持通过 `ADMIN_PASSWORD` 环境变量预设初始密码
- 设置密码后，所有页面与备份导出 API 都需要登录才能访问
- 进入 设置 → 访问密码 可随时修改或移除密码、退出登录
- 会话使用 HttpOnly + SameSite=Lax Cookie，修改密码会立刻失效所有旧会话

## 技术栈

- Framework: [Next.js 16](https://nextjs.org/) + App Router
- Language: TypeScript + React 19
- Database: SQLite + `better-sqlite3`
- ORM: [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit`
- UI: Tailwind CSS v4

## 本地开发

### 1. 安装依赖

```bash
npm -C apps/web install
```

### 2. 配置环境变量

```bash
cp apps/web/.env.example apps/web/.env
```

默认配置如下：

```env
DATABASE_FILE_PATH=./data/app.db
DATABASE_URL=file:./data/app.db
NOTIFY_CRON_SECRET=
ADMIN_PASSWORD=
SKIP_DB_MIGRATIONS=0
```

- `ADMIN_PASSWORD`：可选。首次启动且数据库尚未存在密码时使用该值作为管理密码；留空则自动生成 32 位随机密码并打印到启动日志。已存在的密码永远不会被环境变量覆盖。

### 3. 初始化数据库

```bash
npm -C apps/web run db:migrate
```

### 4. 启动开发环境

```bash
npm -C apps/web run dev
```

访问 `http://localhost:3000`。

## Docker 部署

适合 NAS / VPS / 长期运行服务器。容器内 SQLite 默认持久化到 `/app/data`。

### 自动构建多架构镜像

- 已配置 GitHub Actions：推送到 `main`、打 `v*` 标签或手动触发时自动构建 Docker 镜像
- 默认发布到 Docker Hub：`<DOCKERHUB_USERNAME>/<DOCKERHUB_IMAGE_NAME 或 GitHub 仓库名>`
- 当前构建平台：`linux/amd64`、`linux/arm64`
- Pull Request 只校验构建，不推送镜像
- 推荐在 GitHub 仓库 Variables 中配置 `DOCKERHUB_USERNAME`
- 需要在 GitHub 仓库 Secrets 中配置 `DOCKERHUB_TOKEN`
- 可选在 GitHub 仓库 Variables 中配置 `DOCKERHUB_IMAGE_NAME`；未配置时默认使用当前 GitHub 仓库名
- 为兼容旧配置，workflow 也接受 `DOCKERHUB_USERNAME` 放在 Secrets 中，但优先读取 Variables

### 方式 A：Docker Compose（推荐）

在仓库根目录执行：

```bash
docker compose up -d --build
```

### 方式 B：docker run

**最小启动（自动生成随机管理密码）：**

```bash
docker run -d \
  --name reminder-hub \
  --restart always \
  -p 3088:3000 \
  -v /mnt/usb1-1/reminder-hub/data:/app/data \
  -e TZ=Asia/Shanghai \
  helloworldz1024/reminder-hub:latest
```

启动后查看自动生成的管理密码：

```bash
docker logs reminder-hub 2>&1 | grep -A 1 "已自动生成管理密码"
```

**推荐：预设初始密码 + 完整环境变量：**

```bash
docker run -d \
  --name reminder-hub \
  --restart always \
  -p 3088:3000 \
  -v /mnt/usb1-1/reminder-hub/data:/app/data \
  -e TZ=Asia/Shanghai \
  -e ADMIN_PASSWORD='your-strong-password-here' \
  -e NOTIFY_CRON_SECRET='optional-cron-bearer-token' \
  helloworldz1024/reminder-hub:latest
```

环境变量说明：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `TZ` | 推荐 | 容器时区，影响通知提醒的本地时间判断。建议 `Asia/Shanghai` |
| `ADMIN_PASSWORD` | 可选 | 首次启动时的初始管理密码；留空则自动生成并打印到日志；已存在的密码不会被覆盖 |
| `NOTIFY_CRON_SECRET` | 可选 | 给 `/api/cron/*` 端点加 Bearer 认证，防止被外部调用 |
| `DATABASE_FILE_PATH` | 可选 | SQLite 文件路径，容器内默认 `/app/data/app.db`，配合 `-v /host/path:/app/data` 持久化即可 |
| `SKIP_DB_MIGRATIONS` | 可选 | 设为 `1` 跳过启动时自动迁移（需手动执行 `drizzle-kit migrate`） |

后续修改密码请在 应用内 设置 → 访问密码 中操作。重启容器不会重置已有密码；只有清空数据卷后，`ADMIN_PASSWORD` 才会在下次启动时生效。

**本地构建镜像：**

```bash
docker build -t reminder-hub:latest ./apps/web
docker volume create reminder_hub_data
docker run -d --name reminder-hub --restart unless-stopped \
  -p 3000:3000 \
  -v reminder_hub_data:/app/data \
  -e TZ=Asia/Shanghai \
  reminder-hub:latest
```

更完整说明见 `llmdoc/guides/how-to-deploy-with-docker.md`。

## systemd 直装部署（不经 Docker）

如果希望在已有 Linux 主机上以原生进程方式运行（少一层容器、日志走 journald、反代用主机自带的 Nginx / Caddy），参考：

- 指南：`llmdoc/guides/how-to-deploy-systemd.md`
- 覆盖：专用 `reminder-hub` 系统用户、`/etc/systemd/system/reminder-hub.service` 沙箱、环境变量外置到 `/etc/reminder-hub.env`、Nginx 子域与 Cloudflare Authenticated Origin Pulls 对接、外部 cron 触发与升级流程。

## 目录结构（Monorepo）

```
reminder-hub/
├── apps/
│   ├── web/          Next.js 16 Web 应用（PWA + REST API v1）
│   ├── desktop/      Tauri 2 桌面客户端（Win / macOS / Linux）
│   └── mobile/       Capacitor 7 移动客户端（Android / iOS）
├── packages/
│   └── datastore/    跨端共享的数据访问层（DataStore 接口 + Remote/Local 实现 + LWW SyncEngine）
├── llmdoc/           协作与维护文档
└── package.json      根级 npm workspaces 配置
```

常用命令（从仓库根目录）：

```bash
npm run web:dev          # 启动 Web 开发服务器
npm run web:build        # 构建 Web 生产版本
npm run desktop:dev      # 启动 Tauri 桌面（需要 Rust 工具链）
npm run desktop:build    # 打包桌面安装包
npm run mobile:sync      # 同步前端到原生工程
npm run mobile:android   # 在 Android 设备/模拟器运行
npm run mobile:ios       # 在 iOS 设备/模拟器运行（仅 macOS）
```

更多说明：
- `BUILDING.md` — 所有端的 GitHub Actions 自动打包流程（桌面 / Android / iOS）
- `apps/desktop/README.md` — Tauri 桌面端本地开发与手动打包
- `apps/mobile/README.md` — Capacitor 移动端本地开发与手动打包

## 质量检查

```bash
npm -C apps/web run check
```

## 文档

- `llmdoc/index.md`
- `llmdoc/overview/project-overview.md`
- `llmdoc/guides/how-to-deploy-with-docker.md`
- `DEVELOPMENT.md`

## 发布到公开仓库前的默认约定

- 本地数据库文件不应提交到仓库
- `.env` 仅保留 `.env.example`
- 机器人 token、Webhook、邮箱密码等配置必须通过环境变量或系统设置注入

## 当前状态

当前仓库已经具备公开发布的基础条件，适合作为一个可运行、可自托管、功能完整的个人提醒管理项目继续演进。
