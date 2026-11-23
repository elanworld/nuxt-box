import { getTaskWithUpdates } from '../../utils/task-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing task id' })
  }
  const result = await getTaskWithUpdates(event, id)
  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }
  return result
})