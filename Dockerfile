# Default production image = Node SQLite runtime (see Dockerfile.node).
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NUXT_APP_BASE_URL=/task-library/
ENV NUXT_NITRO_PRESET=node-server
RUN npm run build:node

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libsqlite3-0 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NUXT_APP_BASE_URL=/task-library/
ENV TASK_LIBRARY_RUNTIME=node
ENV SQLITE_PATH=/data/tasks.db
COPY --from=build /app/.output ./
COPY --from=build /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=build /app/node_modules/bindings ./node_modules/bindings
COPY --from=build /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "server/index.mjs"]