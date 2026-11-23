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

  const tasks = await listTasks(statusFilter)
  return { tasks }
})