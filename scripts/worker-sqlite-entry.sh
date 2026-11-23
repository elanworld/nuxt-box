#!/bin/sh
set -e
mkdir -p "${WRANGLER_PERSIST_DIR}"
cd /app
wrangler d1 migrations apply nuxt-box --local --persist-to "${WRANGLER_PERSIST_DIR}"
exec wrangler dev .output/server/index.mjs \
  --config /app/wrangler.toml \
  --assets .output/public/task-library \
  --ip 0.0.0.0 \
  --port 8787 \
  --persist-to "${WRANGLER_PERSIST_DIR}" \
  --local