import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const dbPath = './data/smoke-tasks.db'
const port = 3765
const base = `http://127.0.0.1:${port}`

rmSync('./data', { recursive: true, force: true })
mkdirSync('./data', { recursive: true })

const child = spawn('node', ['.output/server/index.mjs'], {
  cwd: new URL('..', import.meta.url).pathname,
  env: {
    ...process.env,
    PORT: String(port),
    HOST: '127.0.0.1',
    SQLITE_PATH: dbPath,
    NUXT_APP_BASE_URL: '/',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

const writeHeaders = { 'Content-Type': 'application/json' }
if (process.env.SMOKE_AUTHORIZATION) {
  writeHeaders.Authorization = process.env.SMOKE_AUTHORIZATION
}

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${base}/api/tasks`)
      if (res.ok) return
    } catch {
      // retry
    }
    await sleep(250)
  }
  throw new Error('Server did not become ready')
}

async function run() {
  try {
    await waitReady()

    const createRes = await fetch(`${base}/api/bot/tasks`, {
      method: 'POST',
      headers: writeHeaders,
      body: JSON.stringify({
        title: 'Smoke task',
        description: 'API smoke',
        status: 'doing',
        message: '创建冒烟任务',
      }),
    })
    if (!createRes.ok) {
      throw new Error(`create failed: ${createRes.status} ${await createRes.text()}`)
    }
    const created = await createRes.json()
    const id = created.task.id

    const patchRes = await fetch(`${base}/api/bot/tasks/${id}`, {
      method: 'PATCH',
      headers: writeHeaders,
      body: JSON.stringify({ status: 'done', message: '冒烟完成' }),
    })
    if (!patchRes.ok) {
      throw new Error(`patch failed: ${patchRes.status} ${await patchRes.text()}`)
    }

    const listRes = await fetch(`${base}/api/tasks?status=done`)
    const list = await listRes.json()
    if (!list.tasks.some((t) => t.id === id)) {
      throw new Error('done list missing created task')
    }

    const detailRes = await fetch(`${base}/api/tasks/${id}`)
    const detail = await detailRes.json()
    if (detail.updates.length < 2) {
      throw new Error('expected at least 2 updates in history')
    }

    const deleteRes = await fetch(`${base}/api/bot/tasks/${id}`, {
      method: 'DELETE',
      headers: writeHeaders,
    })
    if (!deleteRes.ok) {
      throw new Error(`delete failed: ${deleteRes.status} ${await deleteRes.text()}`)
    }
    const goneRes = await fetch(`${base}/api/tasks/${id}`)
    if (goneRes.status !== 404) {
      throw new Error('expected 404 after delete')
    }

    console.log('smoke-api: ok')
  } finally {
    child.kill('SIGTERM')
  }
}

child.on('exit', (code) => {
  if (code && code !== 0 && code !== null) {
    console.error('server exited', code)
  }
})

run().catch((err) => {
  child.kill('SIGTERM')
  console.error(err)
  process.exit(1)
})