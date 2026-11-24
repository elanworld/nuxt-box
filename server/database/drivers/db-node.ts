import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import * as schema from '../schema'
import { runSqliteMigrations } from '../../utils/migrate'
import { getSqlitePath } from '../../utils/config'

let db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function useNodeDb() {
  if (db) {
    return db
  }

  const path = getSqlitePath()
  mkdirSync(dirname(path), { recursive: true })

  const sqlite = new Database(path)
  sqlite.pragma('journal_mode = WAL')
  runSqliteMigrations(sqlite)
  db = drizzle(sqlite, { schema })
  return db
}

export function getRuntimeD1(): D1Database | undefined {
  return undefined
}
