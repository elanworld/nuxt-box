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

In `/root/box/shell-tool/config/.git-action/docker-compose.yml`, change only the `image:` line for `task-library` to the pinned node digest below (or `latest` after verifying pull).

**Pinned digests (built in Cursor, 2026-11-23):**

| Image | Pull reference |
| --- | --- |
| Production Node | `alanwoods/nuxt-box-node@sha256:b1124ebdaa92e831e7e0889411759d9418ab677565a59685f1c41c0372a498f1` |
| Alias (same layers as node) | `alanwoods/nuxt-box@sha256:b1124ebdaa92e831e7e0889411759d9418ab677565a59685f1c41c0372a498f1` |
| Worker SQLite (optional) | `alanwoods/nuxt-box-worker-sqlite@sha256:a31094c1ae63b63c8a8f9491d1c5cd5d930c6dd471e7a40887b42f9c47271a07` |

Remove `env_file: ./config/task-library.env` if it only held `TASK_LIBRARY_BOT_TOKEN` — the app no longer reads a fixed bot secret.

## Nginx

- Use a **single** `location /task-library/` block (see `deploy/nginx.location.snippet.conf`).
- **If** an old `location /task-library/api/bot/` bypass still exists on a host (skipped gateway auth), remove it. Current production already uses one admin-protected `/task-library/` location only.
- Writes use the same admin session as the UI: `Authorization` header or `Authorization` cookie from Quarkus/Gin login.

## Commands (production)

```bash
docker pull alanwoods/nuxt-box-node:latest
# update compose image digest or tag
docker-compose up -d task-library
nginx -t && nginx -s reload   # after nginx snippet change, if any
```

No rebuild on the server. Existing SQLite data is reused automatically via the same volume mount.