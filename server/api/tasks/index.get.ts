import { getQuery } from 'h3'
import { isTaskStatus, listTasks } from '../../utils/task-helpers'
import type { TaskStatus } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filter = query.status
  let statusFilter: TaskStatus | 'active' | 'all' | undefined = 'active'
  if (filter === 'all') {
    statusFilter = 'all'
  } else if (filter === 'active') {
    statusFilter = 'active'
  } else if (typeof filter === 'string' && isTaskStatus(filter)) {
    statusFilter = filter
  }

  if (query.tag !== undefined && (typeof query.tag !== 'string' || !query.tag.trim())) {
    throw createError({ statusCode: 400, statusMessage: 'tag must be a non-empty string' })
  }
  const tasks = await listTasks(event, statusFilter, query.tag?.trim())
  return { tasks }
})