# 综合提醒管理平台 (Todo List + Reminders)

一个现代化的个人综合提醒管理平台，集成待办事项、纪念日、订阅管理与物品追踪。

## 🌟 核心功能 (Features)

- **Todo 待办管理**: 
    - 优先级/分类/标签过滤
    - 截止时间与多重提醒
    - 子任务拆分 (Subtasks)
    - 循环任务 (Recurrence)
- **纪念日 (Anniversaries)**:
    - 公历/农历支持
    - 每年自动重复与提醒
- **订阅管理 (Subscriptions)**:
    - 月付/年付周期追踪
    - 到期提醒与手动续期模式
- **仪表盘 (Dashboard)**:
    - 聚合今日任务、即将到期订阅、纪念日
- **现代化 UI**:
    - 全面语义化配色 (Supports Dark Mode)
    - 响应式布局 (Mobile/Desktop)
    - 微交互与平滑动效

## 🛠️ 技术栈 (Tech Stack)

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router；build 默认使用 Webpack 以保证稳定性)
- **Database**: SQLite（运行时 `better-sqlite3`）
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit` 迁移
- **UI**: Tailwind CSS v4 + 语义化配色 (Semantic Tokens)
- **Language**: TypeScript + React 19

## 🚀 快速开始 (Getting Started)

### 1. 依赖安装

```bash
npm -C apps/web install
```

### 2. 环境变量配置

复制示例环境变量文件：

```bash
cp apps/web/.env.example apps/web/.env
```

配置 `apps/web/.env` 中的数据库路径（默认使用本地 SQLite 文件）：

```env
# SQLite database file path (app runtime)
DATABASE_FILE_PATH=./data/app.db

# SQLite database URL (drizzle-kit)
DATABASE_URL=file:./data/app.db
```

### 3. 数据库迁移

初始化数据库表结构：

```bash
npm -C apps/web run db:migrate
```

### 4. 启动开发服务器

```bash
npm -C apps/web run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

## 📂 项目结构

- `apps/web`: Next.js 应用程序源码
    - `src/app`: 页面路由与组件
    - `src/server`: 后端逻辑、数据库 Schema、Actions
    - `drizzle`: 数据库迁移文件

## 📄 设计文档

- [PRD & 设计规划 (Plan.md)](./Plan.md)
- [开发规范（3M / 敏捷 / 低耦合）(DEVELOPMENT.md)](./DEVELOPMENT.md)

## ✅ 质量检查（推荐）

```bash
npm -C apps/web run check
```

## 🤝 贡献

本项目处于早期开发阶段 (v0.1 MVP)。
