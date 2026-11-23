import { deleteTask } from '../../../utils/task-helpers'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing task id' })
  }

  return deleteTask(event, id)
})