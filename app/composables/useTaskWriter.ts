export type TaskWriteInput = {
  title: string
  description?: string | null
  status?: string
  tags?: string[]
  message?: string
}

export function useTaskWriter() {
  const requestFetch = useRequestFetch()
  const saving = ref(false)
  const actionError = ref('')

  async function createTask(input: TaskWriteInput) {
    return requestFetch<{ task: { id: string } }>('/api/bot/tasks', {
      method: 'POST',
      body: input,
    })
  }

  async function updateTask(id: string, input: Partial<TaskWriteInput> & { message: string }) {
    return requestFetch(`/api/bot/tasks/${id}`, {
      method: 'PATCH',
      body: input,
    })
  }

  async function removeTask(id: string) {
    return requestFetch(`/api/bot/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  return { createTask, updateTask, removeTask, saving, actionError }
}