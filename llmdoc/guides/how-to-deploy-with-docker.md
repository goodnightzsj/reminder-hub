# How to Deploy with Docker

This project is a long-running Node.js server (SQLite + internal scheduler). Docker deployment must persist `/app/data` and keep the container running.

## Option A: Docker Compose (recommended)

1) From repo root, build and start:
- `docker compose up -d --build`

2) Open:
- `http://localhost:3000`

3) (Optional) Set secrets in a repo-root `.env` file (auto-loaded by Docker Compose):
- `NOTIFY_CRON_SECRET=...`
- `SKIP_DB_MIGRATIONS=0`

### Data persistence
- `docker-compose.yml` mounts a named volume `todo_list_data` → `/app/data`
- SQLite file path in container: `/app/data/app.db`
- If you prefer a host folder (easier backup), replace the volume with `./apps/web/data:/app/data`

## Option B: `docker run`

1) Build image:
- `docker build -t todo-list:latest ./apps/web`

2) Create volume (one-time):
- `docker volume create todo_list_data`

3) Run container:
- `docker run -d --name todo-list --restart unless-stopped -p 3000:3000 -v todo_list_data:/app/data todo-list:latest`
- Or use a host folder: replace `-v todo_list_data:/app/data` with `-v "$PWD/apps/web/data:/app/data"`

4) (Optional) Protect external cron endpoint:
- Add `-e NOTIFY_CRON_SECRET=...` if `POST /api/cron/notify` is exposed

## Migrations

- By default, DB migrations are applied automatically on server start (`apps/web/src/server/db/index.ts`).
- To disable auto-migrate, set `SKIP_DB_MIGRATIONS=1` (then run migrations manually during upgrades).

## Internal scheduler (in-app)

- The internal scheduler runs only while the server is running.
- Configure it in the app: Settings → 系统内定时任务.

## Upgrade / restart

- Compose: `docker compose up -d --build`
- `docker run`: rebuild image, then recreate container (keep the same `todo_list_data` volume).

## Security notes (public deployment)

- Put it behind a reverse proxy (HTTPS + access control).
- Set `NOTIFY_CRON_SECRET` if you keep `/api/cron/*` routes reachable from the internet.
