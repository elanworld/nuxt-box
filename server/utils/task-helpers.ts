import { createError } from 'h3'
import { eq, desc, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { tasks, taskUpdates, taskStatuses, type TaskStatus } from '../database/schema'
import { useSqliteDb } from './db'

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (taskStatuses as readonly string[]).includes(value)
}

export async function listTasks(statusFilter?: TaskStatus | 'active' | 'all') {
  const db = useSqliteDb()
  let statusClause
  if (statusFilter === 'active' || statusFilter === undefined) {
    statusClause = inArray(tasks.status, ['todo', 'doing'])
  } else if (statusFilter === 'all') {
    statusClause = undefined
  } else {
    statusClause = eq(tasks.status, statusFilter)
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(statusClause)
    .orderBy(desc(tasks.updatedAt))

  return rows
}

export async function getTaskWithUpdates(taskId: string) {
  const db = useSqliteDb()
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  if (!task) {
    return null
  }
  const updates = await db
    .select()
    .from(taskUpdates)
    .where(eq(taskUpdates.taskId, taskId))
    .orderBy(desc(taskUpdates.createdAt))
  return { task, updates }
}

export async function createTask(input: {
  title: string
  description?: string | null
  status?: TaskStatus
  message?: string
}) {
  const db = useSqliteDb()
  const now = new Date()
  const id = nanoid()
  const status = input.status ?? 'todo'
  const title = input.title.trim()
  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'title is required' })
  }

  await db.insert(tasks).values({
    id,
    title,
    description: input.description?.trim() || null,
    status,
    createdAt: now,
    updatedAt: now,
  })

  const updateMessage = input.message?.trim() || '任务已创建'
  await db.insert(taskUpdates).values({
    id: nanoid(),
    taskId: id,
    status,
    message: updateMessage,
    createdAt: now,
  })

  return getTaskWithUpdates(id)
}

export async function updateTask(
  taskId: string,
  input: { status?: TaskStatus; message: string; title?: string; description?: string | null },
) {
  const db = useSqliteDb()
  const now = new Date()
  const message = input.message.trim()
  if (!message) {
    throw createError({ statusCode: 400, statusMessage: 'message is required' })
  }

  const existing = await getTaskWithUpdates(taskId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  const patch: Partial<typeof tasks.$inferInsert> = { updatedAt: now }
  if (input.title !== undefined) {
    const title = input.title.trim()
    if (!title) {
      throw createError({ statusCode: 400, statusMessage: 'title cannot be empty' })
    }
    patch.title = title
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null
  }
  if (input.status !== undefined) {
    patch.status = input.status
  }

  await db.update(tasks).set(patch).where(eq(tasks.id, taskId))
  await db.insert(taskUpdates).values({
    id: nanoid(),
    taskId,
    status: input.status ?? existing.task.status,
    message,
    createdAt: now,
  })

  return getTaskWithUpdates(taskId)
}