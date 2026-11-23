# Ops: migrate from `task-library` image to `nuxt-box` (bc068 / pull-restart only)

## Unchanged on production (do not wipe)

| Item | Keep as-is |
| --- | --- |
| Host path | `/data/task-library` → container `/data` |
| SQLite file | `/data/tasks.db` via `SQLITE_PATH=/data/tasks.db` |
| Listen | `127.0.0.1:8083` → container `3000` |
| URL base | `NUXT_APP_BASE_URL=/task-library/` (site path, not repo name) |
| Container name | `task-library` (optional; image only must change) |

## Image replacement

| Before | After |
| --- | --- |
| `alanwoods/task-library-node:latest` (or pinned digest) | `alanwoods/nuxt-box-node:latest` |
| `alanwoods/task-library:latest` (alias) | `alanwoods/nuxt-box:latest` (alias of node build) |
| `alanwoods/task-library-worker-sqlite:latest` | `alanwoods/nuxt-box-worker-sqlite:latest` |

In `/root/box/shell-tool/config/.git-action/docker-compose.yml`, change only the `image:` line for `task-library` to `alanwoods/nuxt-box-node@<digest>` after pull.

Remove `env_file: ./config/task-library.env` if it only held `TASK_LIBRARY_BOT_TOKEN` — the app no longer reads a fixed bot secret.

## Nginx

- Use a **single** `location /task-library/` block (see `deploy/nginx.location.snippet.conf`).
- **Delete** the old `location /task-library/api/bot/` bypass that skipped gateway auth.
- Writes use the same admin session as the UI: `Authorization` header or `Authorization` cookie from Quarkus/Gin login.

## Commands (production)

```bash
docker pull alanwoods/nuxt-box-node:latest
# update compose image digest or tag
docker-compose up -d task-library
nginx -t && nginx -s reload   # after nginx snippet change, if any
```

No rebuild on the server. Existing SQLite data is reused automatically via the same volume mount.