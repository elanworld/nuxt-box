export const taskStatusOptions = [
  { value: 'todo', label: '待办' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
] as const

export function statusLabel(status: string | null) {
  if (!status) return ''
  const found = taskStatusOptions.find((o) => o.value === status)
  return found?.label ?? status
}

export function formatTaskTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN')
}