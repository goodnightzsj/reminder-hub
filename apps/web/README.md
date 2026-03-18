# Web 应用 (Next.js App)

这是「综合提醒管理平台」的 Web 前端（Next.js App Router）。

## 本地开发

在 `apps/web` 目录下执行：

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

## Docker 部署

推荐使用仓库根目录的 `docker-compose.yml` 一键部署：

```bash
docker compose up -d --build
```

更多说明见：`llmdoc/guides/how-to-deploy-with-docker.md`

生产构建（默认使用 Webpack）：

```bash
npm run build
```

质量检查（推荐）：

```bash
npm run check
```

更多说明与开发规范请查看仓库根目录：
- `README.md`
- `DEVELOPMENT.md`
