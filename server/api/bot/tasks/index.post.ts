import { readBody } from 'h3'
import { createTask, isTaskStatus } from '../../../utils/task-helpers'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    title?: string
    description?: string | null
    status?: string
    message?: string
  }>(event)

  if (!body?.title) {
    throw createError({ statusCode: 400, statusMessage: 'title is required' })
  }
  if (body.status !== undefined && !isTaskStatus(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid status' })
  }

  return createTask(event, {
    title: body.title,
    description: body.description,
    status: body.status,
    message: body.message,
  })
})