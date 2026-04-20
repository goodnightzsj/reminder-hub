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
SKIP_DB_MIGRATIONS=0
```

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

```bash
docker build -t todo-list:latest ./apps/web
docker volume create todo_list_data
docker run -d --name todo-list --restart unless-stopped -p 3000:3000 -v todo_list_data:/app/data todo-list:latest
```

如果直接使用 GitHub Actions 产出的镜像，也可以：

```bash
docker pull <你的 Docker Hub 用户名>/<镜像名>:latest
docker volume create todo_list_data
docker run -d --name todo-list --restart unless-stopped -p 3000:3000 -v todo_list_data:/app/data <你的 Docker Hub 用户名>/<镜像名>:latest
```

更完整说明见 `llmdoc/guides/how-to-deploy-with-docker.md`。

## systemd 直装部署（不经 Docker）

如果希望在已有 Linux 主机上以原生进程方式运行（少一层容器、日志走 journald、反代用主机自带的 Nginx / Caddy），参考：

- 指南：`llmdoc/guides/how-to-deploy-systemd.md`
- 覆盖：专用 `reminder-hub` 系统用户、`/etc/systemd/system/reminder-hub.service` 沙箱、环境变量外置到 `/etc/reminder-hub.env`、Nginx 子域与 Cloudflare Authenticated Origin Pulls 对接、外部 cron 触发与升级流程。

## 目录结构

- `apps/web`：Web 应用
- `apps/web/src/app`：页面、路由、Server Actions
- `apps/web/src/server`：数据库、通知、摘要、调度器等服务端逻辑
- `apps/web/drizzle`：数据库迁移
- `llmdoc`：面向协作与维护的文档

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
