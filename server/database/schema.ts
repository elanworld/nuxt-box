import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const taskStatuses = ['todo', 'doing', 'done', 'cancelled'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
    status: text('status').notNull().default('todo'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('tasks_status_idx').on(table.status), index('tasks_updated_idx').on(table.updatedAt)],
)

export const taskUpdates = sqliteTable(
  'task_updates',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    status: text('status'),
    message: text('message').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('task_updates_task_idx').on(table.taskId)],
)