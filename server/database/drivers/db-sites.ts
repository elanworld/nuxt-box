import { env } from "cloudflare:workers"
import { createError } from 'h3'
import type { useNodeDb as nodeDriver } from './db-node'

export function useNodeDb(): ReturnType<typeof nodeDriver> {
  throw createError({ statusCode: 503, statusMessage: 'D1 binding DB is not configured' })
}

export function getRuntimeD1(): D1Database | undefined {
  return (env as { DB?: D1Database }).DB
}
