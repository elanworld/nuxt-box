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
    tags?: unknown
  }>(event)

  if (!body?.message) {
    throw createError({ statusCode: 400, statusMessage: 'message is required' })
  }
  if (body.status !== undefined && !isTaskStatus(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid status' })
  }

  let tags: string[] | undefined
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || /[\r\n]/.test(tag))) {
      throw createError({ statusCode: 400, statusMessage: 'tags must be an array of non-empty single-line strings' })
    }
    tags = [...new Set(body.tags.map((tag: string) => tag.trim()))]
  }

  return updateTask(event, id, {
    tags,
    status: body.status,
    message: body.message,
    title: body.title,
    description: body.description,
  })
})