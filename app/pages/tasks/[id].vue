<script setup lang="ts">
import { statusLabel, formatTaskTime, taskStatusOptions } from '../../composables/useTaskLabels'
import { useTaskWriter } from '../../composables/useTaskWriter'

const route = useRoute()
const taskId = computed(() => String(route.params.id))

type TaskDetail = {
  task: {
    id: string
    title: string
    description: string | null
    tags: string[]
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

const editing = ref(false)
const editTitle = ref('')
const editDescription = ref('')
const editTags = ref<string[]>([])
const editTagDraft = ref('')
const editStatus = ref('todo')
const editMessage = ref('')

const { updateTask, removeTask, saving, actionError } = useTaskWriter()

watch(
  data,
  (value) => {
    if (!value?.task) return
    editTitle.value = value.task.title
    editDescription.value = value.task.description ?? ''
    editTags.value = [...value.task.tags]
    editTagDraft.value = ''
    editStatus.value = value.task.status
    editMessage.value = ''
  },
  { immediate: true },
)

function startEdit() {
  editing.value = true
  actionError.value = ''
  if (data.value?.task) {
    editTitle.value = data.value.task.title
    editDescription.value = data.value.task.description ?? ''
    editTags.value = [...data.value.task.tags]
    editTagDraft.value = ''
    editStatus.value = data.value.task.status
    editMessage.value = ''
  }
}

async function submitEdit() {
  actionError.value = ''
  const title = editTitle.value.trim()
  const message = editMessage.value.trim()
  if (!title) {
    actionError.value = '请填写标题'
    return
  }
  if (!message) {
    actionError.value = '请填写本次进展说明'
    return
  }
  saving.value = true
  try {
    await updateTask(taskId.value, {
      title,
      description: editDescription.value.trim() || null,
      status: editStatus.value,
      tags: [...editTags.value, editTagDraft.value.trim()].filter(Boolean),
      message,
    })
    editing.value = false
    await refresh()
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function changeStatus(event: Event) {
  const select = event.target as HTMLSelectElement
  const task = data.value?.task
  const status = select.value
  if (!task || saving.value || status === task.status) return

  actionError.value = ''
  saving.value = true
  try {
    await updateTask(task.id, {
      status,
      message: `状态更新为：${statusLabel(status)}`,
    })
    await refresh()
  } catch (e) {
    select.value = task.status
    actionError.value = e instanceof Error ? e.message : '状态保存失败'
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!import.meta.client) return
  if (!window.confirm('确定删除该任务？删除后无法恢复（含进展历史）。')) return
  actionError.value = ''
  saving.value = true
  try {
    await removeTask(taskId.value)
    await navigateTo('/')
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : '删除失败'
  } finally {
    saving.value = false
  }
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
      <p v-if="data.task.tags.length" class="tags">
        <span v-for="tag in data.task.tags" :key="tag" class="badge">{{ tag }}</span>
      </p>
      <p class="meta">
        创建于 {{ formatTaskTime(data.task.createdAt) }} · 更新于 {{ formatTaskTime(data.task.updatedAt) }}
      </p>

      <div class="actions">
        <button v-if="!editing" type="button" class="btn" :disabled="saving" @click="startEdit">编辑</button>
        <label v-if="!editing" class="quick-status">
          <span>状态</span>
          <select class="btn" :value="data.task.status" :disabled="saving" @change="changeStatus">
            <option v-for="opt in taskStatusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <button type="button" class="btn danger" :disabled="saving" @click="confirmDelete">删除</button>
      </div>

      <form v-if="editing" class="edit-form" @submit.prevent="submitEdit">
        <h2 class="form-title">编辑任务</h2>
        <label class="field">
          <span>标题</span>
          <input v-model="editTitle" type="text" required maxlength="500" />
        </label>
        <label class="field">
          <span>说明</span>
          <textarea v-model="editDescription" rows="3" />
        </label>
        <TaskTagInput v-model="editTags" v-model:draft="editTagDraft" />
        <label class="field">
          <span>状态</span>
          <select v-model="editStatus">
            <option v-for="opt in taskStatusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>本次进展说明（必填）</span>
          <input v-model="editMessage" type="text" placeholder="记录本次修改原因或进展" required />
        </label>
        <div class="form-actions">
          <button type="submit" class="primary-btn" :disabled="saving">
            {{ saving ? '保存中…' : '保存' }}
          </button>
          <button type="button" class="btn" :disabled="saving" @click="editing = false">取消</button>
        </div>
      </form>

      <p v-if="actionError" class="state error" role="alert">{{ actionError }}</p>

      <h2 class="section-title">进展历史</h2>
      <ol class="timeline">
        <li v-for="item in data.updates" :key="item.id">
          <time>{{ formatTaskTime(item.createdAt) }}</time>
          <p class="msg">{{ item.message }}</p>
          <p v-if="item.status" class="status-note">状态：{{ statusLabel(item.status) }}</p>
        </li>
      </ol>
    </template>
    <button type="button" class="btn refresh" @click="refresh()">刷新</button>
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

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.meta {
  color: var(--muted);
  font-size: 0.85rem;
}

.quick-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.btn {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}

.btn.danger {
  border-color: #c92a2a;
  color: #f86a6a;
}

.primary-btn {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.6;
}

.edit-form {
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

.form-actions {
  display: flex;
  gap: 0.5rem;
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
}
</style>