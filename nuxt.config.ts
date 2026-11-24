import { fileURLToPath } from 'node:url'

const sitesBuild = process.env.NUXT_SITES_BUILD === '1'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  future: { compatibilityVersion: 4 },
  srcDir: 'app',
  alias: {
    '#task-node-db': fileURLToPath(new URL(sitesBuild ? './server/database/drivers/db-sites.ts' : './server/database/drivers/db-node.ts', import.meta.url)),
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/task-library/',
    head: {
      title: '任务库',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  runtimeConfig: {
    sqlitePath: './data/tasks.db',
    public: {},
  },
  nitro: {
    experimental: {
      asyncContext: true,
    },
    preset: process.env.NUXT_NITRO_PRESET || 'node-server',
    externals: {
      inline: ['drizzle-orm'],
      external: ['better-sqlite3'],
    },
    moduleSideEffects: sitesBuild ? [] : ['better-sqlite3'],
  },
  vite: {
    optimizeDeps: {
      exclude: ['better-sqlite3'],
    },
  },
})