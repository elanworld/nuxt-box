#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const base = process.env.NUXT_BOX_BASE || process.env.TASK_LIBRARY_BASE || 'https://www.xianneng.top/task-library'
const authPath = process.env.NUXT_BOX_AUTHORIZATION_FILE || process.env.TASK_LIBRARY_TOKEN_FILE
if (!authPath) {
  console.error('Set NUXT_BOX_AUTHORIZATION_FILE (admin Authorization header value, no app bot token)')
  process.exit(1)
}
const authorization = readFileSync(authPath, 'utf8').trim()

async function api(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

const demoPatterns = [
  'WORKER_SQLITE_SMOKE',
  'Smoke task',
  'Docker镜像验证',
  '本机8083验证',
  '公网Bot写库',
  'Cloud Agent 同步测试',
  'Demo任务',
]

const realTasks = [
  {
    title: '网站任务库',
    status: 'doing',
    description: 'Nuxt+SQLite 任务库与 Bot 同步',
    message: '当前节点：补齐 Worker SQLite 独立运行时及最终验收',
  },
  {
    title: '首页AI会话上下文',
    status: 'doing',
    description: 'Chat 前后端与会话记忆',
    message:
      '前后端已部署；同 session 真实记忆通过、新 session 隔离通过；登录 API 508 导致公网登录后 UI 未完成',
  },
  {
    title: 'GoAdmin网页生成验收',
    status: 'todo',
    description: 'Scaffold 与 CRUD 网页生成',
    message: 'person 专用表热切换/CRUD 通过；纯网页生成、chat_history 和 detail 模板仍未完成',
  },
  {
    title: 'WordPress原插件和镜像调查',
    status: 'done',
    description: 'WP 生产调查',
    message:
      '整站 bind 和 PG4WP 仍在，仅默认插件主题；已查备份无其他文件；未改生产',
  },
  {
    title: '网站接手说明复制本地',
    status: 'todo',
    description: '运维接手文档',
    message: '文档已整理；V 盘权限拒绝尚未复制',
  },
]

async function main() {
  const listRes = await fetch(`${base}/api/tasks?status=all`)
  if (listRes.ok) {
    const { tasks } = await listRes.json()
    for (const t of tasks) {
      if (demoPatterns.some((p) => t.title.includes(p) || t.title === p)) {
        await api('PATCH', `/api/bot/tasks/${t.id}`, {
          status: 'cancelled',
          message: '清理：自动化测试记录（WORKER_SQLITE_SMOKE / smoke 等标识）',
        })
      }
    }
  }

  for (const spec of realTasks) {
    await api('POST', '/api/bot/tasks', spec)
  }
  console.log('seed-production-tasks: ok')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})