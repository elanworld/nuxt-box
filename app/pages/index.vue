<script setup lang="ts">
import { statusLabel, formatTaskTime, taskStatusOptions } from '../composables/useTaskLabels'
import { useTaskWriter } from '../composables/useTaskWriter'

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

const showCreate = ref(false)
const createTitle = ref('')
const createDescription = ref('')
const createStatus = ref('todo')
const createMessage = ref('任务已创建')

const { createTask, saving, actionError } = useTaskWriter()
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
      createdAt: formatTaskTime(row.createdAt),
      updatedAt: formatTaskTime(row.updatedAt),
    }))
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  actionError.value = ''
  const title = createTitle.value.trim()
  if (!title) {
    actionError.value = '请填写标题'
    return
  }
  saving.value = true
  try {
    const result = await createTask({
      title,
      description: createDescription.value.trim() || null,
      status: createStatus.value,
      message: createMessage.value.trim() || '任务已创建',
    })
    createTitle.value = ''
    createDescription.value = ''
    createStatus.value = 'todo'
    createMessage.value = '任务已创建'
    showCreate.value = false
    await navigateTo(`/tasks/${result.task.id}`)
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '创建失败'
  } finally {
    saving.value = false
  }
}

watch(activeTab, () => loadTasks(), { immediate: true })
</script>

<template>
  <section class="panel">
    <div class="toolbar">
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
      <button type="button" class="primary-btn" @click="showCreate = !showCreate">
        {{ showCreate ? '收起' : '新建任务' }}
      </button>
    </div>

    <form v-if="showCreate" class="create-form" @submit.prevent="submitCreate">
      <h2 class="form-title">新建任务</h2>
      <label class="field">
        <span>标题</span>
        <input v-model="createTitle" type="text" required maxlength="500" placeholder="任务标题" />
      </label>
      <label class="field">
        <span>说明（选填）</span>
        <textarea v-model="createDescription" rows="3" placeholder="任务说明" />
      </label>
      <label class="field">
        <span>状态</span>
        <select v-model="createStatus">
          <option v-for="opt in taskStatusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>首条进展说明</span>
        <input v-model="createMessage" type="text" placeholder="默认：任务已创建" />
      </label>
      <p v-if="actionError" class="state error" role="alert">{{ actionError }}</p>
      <button type="submit" class="primary-btn" :disabled="saving">
        {{ saving ? '提交中…' : '创建' }}
      </button>
    </form>

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

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
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

.primary-btn {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.create-form {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: grid;
  gap: 0.75rem;
}

.form-title {
  margin: 0;
  font-size: 1.05rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
  background: transparent;
  color: var(--text);
  font: inherit;
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