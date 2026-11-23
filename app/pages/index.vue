<script setup lang="ts">
type TaskRow = {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
}

const tabs = [
  { key: 'active', label: '待办' },
  { key: 'done', label: '已办' },
  { key: 'all', label: '全部' },
] as const

const activeTab = ref<(typeof tabs)[number]['key']>('active')
const tasks = ref<TaskRow[]>([])
const loading = ref(false)
const error = ref('')

const requestFetch = useRequestFetch()

async function loadTasks() {
  loading.value = true
  error.value = ''
  try {
    const { tasks: rows } = await requestFetch<{ tasks: TaskRow[] }>('/api/tasks', {
      query: { status: activeTab.value },
    })
    tasks.value = rows.map((row) => ({
      ...row,
      createdAt: formatTime(row.createdAt),
      updatedAt: formatTime(row.updatedAt),
    }))
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function formatTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN')
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    todo: '待办',
    doing: '进行中',
    done: '已完成',
    cancelled: '已取消',
  }
  return map[status] ?? status
}

watch(activeTab, () => loadTasks(), { immediate: true })
</script>

<template>
  <section class="panel">
    <nav class="tabs" aria-label="任务筛选">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <p v-if="loading" class="state">加载中…</p>
    <p v-else-if="error" class="state error">{{ error }}</p>
    <p v-else-if="tasks.length === 0" class="state">暂无任务</p>

    <ul v-else class="task-list">
      <li v-for="task in tasks" :key="task.id">
        <NuxtLink :to="`/tasks/${task.id}`" class="task-card">
          <div class="row">
            <h2>{{ task.title }}</h2>
            <span class="badge" :data-status="task.status">{{ statusLabel(task.status) }}</span>
          </div>
          <p v-if="task.description" class="desc">{{ task.description }}</p>
          <p class="meta">更新于 {{ task.updatedAt }}</p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
}

.tab.active {
  border-color: var(--accent);
  color: var(--accent);
}

.state {
  color: var(--muted);
  margin: 0.5rem 0;
}

.state.error {
  color: #f86a6a;
}

.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.task-card {
  display: block;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  color: inherit;
}

.task-card:hover {
  border-color: var(--accent);
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: start;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  white-space: nowrap;
}

.badge[data-status='todo'] {
  color: var(--todo);
}
.badge[data-status='doing'] {
  color: var(--doing);
}
.badge[data-status='done'] {
  color: var(--done);
}
.badge[data-status='cancelled'] {
  color: var(--cancelled);
}

.desc {
  margin: 0.4rem 0 0;
  color: var(--muted);
}

.meta {
  margin: 0.5rem 0 0;
  font-size: 0.82rem;
  color: var(--muted);
}
</style>