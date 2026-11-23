import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const port = 8788
const base = `http://127.0.0.1:${port}/task-library`

const dockerCmd = process.env.DOCKER_CMD || 'sudo docker'
const child = spawn(dockerCmd.split(' ')[0], [
  ...dockerCmd.split(' ').slice(1),
  'run',
  '--rm',
  '-p',
  `${port}:8787`,
  '-e',
  'TASK_LIBRARY_RUNTIME=cloudflare',
  process.env.WORKER_SQLITE_IMAGE || 'nuxt-box-worker-sqlite:verify',
], {
  stdio: ['ignore', 'pipe', 'pipe'],
})

const writeHeaders = { 'Content-Type': 'application/json' }
if (process.env.SMOKE_AUTHORIZATION) {
  writeHeaders.Authorization = process.env.SMOKE_AUTHORIZATION
}

async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${base}/api/tasks`)
      if (res.ok) return
    } catch {
      // workerd boot
    }
    await sleep(500)
  }
  throw new Error('Worker SQLite runtime did not become ready')
}

async function run() {
  try {
    await waitReady()
    const createRes = await fetch(`${base}/api/bot/tasks`, {
      method: 'POST',
      headers: writeHeaders,
      body: JSON.stringify({
        title: 'WORKER_SQLITE_SMOKE',
        status: 'doing',
        message: 'Worker+持久化SQLite CRUD验收',
      }),
    })
    if (!createRes.ok) {
      throw new Error(`create failed: ${createRes.status} ${await createRes.text()}`)
    }
    const { task } = await createRes.json()
    const patchRes = await fetch(`${base}/api/bot/tasks/${task.id}`, {
      method: 'PATCH',
      headers: writeHeaders,
      body: JSON.stringify({ status: 'done', message: 'Worker SQLite 历史写入' }),
    })
    if (!patchRes.ok) {
      throw new Error(`patch failed: ${patchRes.status} ${await patchRes.text()}`)
    }
    const detailRes = await fetch(`${base}/api/tasks/${task.id}`)
    const detail = await detailRes.json()
    if (detail.updates.length < 2) {
      throw new Error('expected update history on worker sqlite runtime')
    }
    const deleteRes = await fetch(`${base}/api/bot/tasks/${task.id}`, {
      method: 'DELETE',
      headers: writeHeaders,
    })
    if (!deleteRes.ok) {
      throw new Error(`delete failed: ${deleteRes.status} ${await deleteRes.text()}`)
    }
    console.log('smoke-worker-sqlite: ok')
  } finally {
    child.kill('SIGTERM')
    await sleep(1500)
  }
}

child.stderr?.on('data', (d) => process.stderr.write(d))

run().catch((err) => {
  child.kill('SIGKILL')
  console.error(err)
  process.exit(1)
})