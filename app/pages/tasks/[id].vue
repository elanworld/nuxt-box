<script setup lang="ts">
const route = useRoute()
const taskId = computed(() => String(route.params.id))

type TaskDetail = {
  task: {
    id: string
    title: string
    description: string | null
    status: string
    createdAt: string
    updatedAt: string
  }
  updates: Array<{
    id: string
    status: string | null
    message: string
    createdAt: string
  }>
}

const { data, error, pending, refresh } = await useAsyncData(
  () => `task-${taskId.value}`,
  () => useRequestFetch()<TaskDetail>(`/api/tasks/${taskId.value}`),
  { watch: [taskId] },
)

function statusLabel(status: string | null) {
  if (!status) return ''
  const map: Record<string, string> = {
    todo: '待办',
    doing: '进行中',
    done: '已完成',
    cancelled: '已取消',
  }
  return map[status] ?? status
}

function formatTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('zh-CN')
}
</script>

<template>
  <section class="panel">
    <p class="back">
      <NuxtLink to="/">← 返回列表</NuxtLink>
    </p>

    <p v-if="pending" class="state">加载中…</p>
    <p v-else-if="error" class="state error">加载失败</p>
    <template v-else-if="data">
      <header class="head">
        <h1>{{ data.task.title }}</h1>
        <span class="badge" :data-status="data.task.status">{{ statusLabel(data.task.status) }}</span>
      </header>
      <p v-if="data.task.description" class="desc">{{ data.task.description }}</p>
      <p class="meta">
        创建于 {{ formatTime(data.task.createdAt) }} · 更新于 {{ formatTime(data.task.updatedAt) }}
      </p>

      <h2 class="section-title">进展历史</h2>
      <ol class="timeline">
        <li v-for="item in data.updates" :key="item.id">
          <time>{{ formatTime(item.createdAt) }}</time>
          <p class="msg">{{ item.message }}</p>
          <p v-if="item.status" class="status-note">状态：{{ statusLabel(item.status) }}</p>
        </li>
      </ol>
    </template>
    <button type="button" class="refresh" @click="refresh()">刷新</button>
  </section>
</template>

<style scoped>
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
}

.back {
  margin: 0 0 0.75rem;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: start;
}

h1 {
  margin: 0;
  font-size: 1.25rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--border);
}

.desc {
  margin: 0.75rem 0 0;
}

.meta {
  color: var(--muted);
  font-size: 0.85rem;
}

.section-title {
  margin: 1.25rem 0 0.75rem;
  font-size: 1rem;
}

.timeline {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.85rem;
}

time {
  font-size: 0.8rem;
  color: var(--muted);
}

.msg {
  margin: 0.2rem 0 0;
}

.status-note {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--muted);
}

.state {
  color: var(--muted);
}

.state.error {
  color: #f86a6a;
}

.refresh {
  margin-top: 1rem;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}
</style>