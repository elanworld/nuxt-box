# nuxt-box

Nuxt 4 + SQLite + Drizzle 任务库（从 `dolphins-web/task-library` 迁出）。站点路径仍为 **`/task-library/`**，镜像与仓库名改为 **nuxt-box**。

## 三套构建目标

| 目标 | 命令 | 镜像 |
| --- | --- | --- |
| **Node SQLite（生产）** | `npm run build:node` + `Dockerfile.node` | `alanwoods/nuxt-box-node:latest` |
| **Worker D1** | `npm run build:cloudflare-d1` + `wrangler deploy`（本地仅迁移/构建） | 见 `wrangler.toml.example` |
| **Worker SQLite** | `Dockerfile.worker-sqlite` | `alanwoods/nuxt-box-worker-sqlite:latest` |

## 鉴权

- **无应用内固定 Bot Token**。写接口 `POST/PATCH /api/bot/tasks/*` 依赖站点 **Gin/Quarkus 网关 admin** 下发的 `Authorization` 头或 `Authorization` Cookie（与登录一致）。
- 生产由 nginx `auth_request` 保护整段 `/task-library/`（含 bot API）；勿再单独放开 `/task-library/api/bot/`。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `SQLITE_PATH` | Node 运行时 DB 路径（生产 `/data/tasks.db`） |
| `NUXT_APP_BASE_URL` | 子路径，默认 `/task-library/` |
| `PORT` / `HOST` | Node 监听（容器内 3000） |

## API（相对 `NUXT_APP_BASE_URL`）

- `GET /api/tasks?status=active|done|all|…`
- `GET /api/tasks/:id`
- `POST /api/bot/tasks` · `PATCH /api/bot/tasks/:id` · `DELETE /api/bot/tasks/:id`（需网关 admin 身份；页面同域请求会带上网关 Cookie）

## 本地开发与测试

```bash
npm ci
npm run build:node
npm run test:api
npm run test:worker-sqlite   # 需 Docker
```

## 镜像构建（Cursor / CI）

```bash
docker build -f Dockerfile.node -t alanwoods/nuxt-box-node:latest -t alanwoods/nuxt-box:latest .
docker build -f Dockerfile.worker-sqlite -t alanwoods/nuxt-box-worker-sqlite:latest .
```

运维替换说明见 [`deploy/OPS-MIGRATION.md`](deploy/OPS-MIGRATION.md)。