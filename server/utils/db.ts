import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { createError, type H3Event } from 'h3'
import * as schema from '../database/schema'
import { getRuntimeD1, useNodeDb } from '#task-node-db'

type AppDb = ReturnType<typeof useNodeDb>

function usesCloudflareDriver() {
  if (process.env.TASK_LIBRARY_RUNTIME === 'cloudflare') {
    return true
  }
  const preset = process.env.NUXT_NITRO_PRESET || ''
  return preset.includes('cloudflare')
}

export function useSqliteDb(event: H3Event): AppDb {
  const d1 = (event.context.cloudflare?.env as { DB?: D1Database } | undefined)?.DB ?? getRuntimeD1()
  if (d1 || usesCloudflareDriver()) {
    if (!d1) {
      throw createError({ statusCode: 503, statusMessage: 'D1 binding DB is not configured' })
    }
    return drizzleD1(d1, { schema }) as unknown as AppDb
  }

  return useNodeDb()
}
