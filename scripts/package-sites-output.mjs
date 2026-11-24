import { copyFileSync, cpSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
mkdirSync('dist/.openai', { recursive: true })
cpSync('.output/server', 'dist/server', { recursive: true })
cpSync('.output/public', 'dist/client', { recursive: true })
renameSync('dist/server/index.mjs', 'dist/server/index.js')
copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json')
writeFileSync('dist/server/wrangler.json', JSON.stringify({
  name: 'nuxt-box',
  main: 'index.js',
  compatibility_date: '2025-07-15',
  compatibility_flags: ['nodejs_compat'],
  assets: { directory: '../client', binding: 'ASSETS' },
}, null, 2))
