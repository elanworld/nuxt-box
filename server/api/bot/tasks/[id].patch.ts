import { readBody } from 'h3'
import { isTaskStatus, updateTask } from '../../../utils/task-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing task id' })
  }

  const body = await readBody<{
    status?: string
    message?: string
    title?: string
    description?: string | null
  }>(event)

  if (!body?.message) {
    throw createError({ statusCode: 400, statusMessage: 'message is required' })
  }
  if (body.status !== undefined && !isTaskStatus(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid status' })
  }

  return updateTask(event, id, {
    status: body.status,
    message: body.message,
    title: body.title,
    description: body.description,
  })
})