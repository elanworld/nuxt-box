import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createError, type H3Event } from 'h3'
import * as schema from '../database/schema'
import { runSqliteMigrations } from './migrate'
import { getSqlitePath } from './config'

type AppDb = ReturnType<typeof drizzleSqlite<typeof schema>>

let sqlite: Database.Database | undefined
let db: AppDb | undefined

function usesCloudflareDriver() {
  if (process.env.TASK_LIBRARY_RUNTIME === 'cloudflare') {
    return true
  }
  const preset = process.env.NUXT_NITRO_PRESET || ''
  return preset.includes('cloudflare')
}

export function useSqliteDb(event: H3Event): AppDb {
  const d1 = (event.context.cloudflare?.env as { DB?: D1Database } | undefined)?.DB
  if (d1 || usesCloudflareDriver()) {
    if (!d1) {
      throw createError({ statusCode: 503, statusMessage: 'D1 binding DB is not configured' })
    }
    return drizzleD1(d1, { schema }) as unknown as AppDb
  }

  if (db) {
    return db
  }

  const path = getSqlitePath()
  mkdirSync(dirname(path), { recursive: true })

  sqlite = new Database(path)
  sqlite.pragma('journal_mode = WAL')
  runSqliteMigrations(sqlite)
  db = drizzleSqlite(sqlite, { schema })
  return db
}