<script setup lang="ts">
useHead({ title: '任务库' })
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <NuxtLink to="/" class="brand">任务库</NuxtLink>
      <p class="subtitle">待办 / 已办 · 新建、编辑与进展历史</p>
    </header>
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style>
:root {
  color-scheme: light dark;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  line-height: 1.5;
  --bg: #0f1419;
  --card: #171d26;
  --border: #2a3441;
  --text: #e8eef4;
  --muted: #97a6b5;
  --accent: #3b9eff;
  --todo: #f0b429;
  --doing: #3b9eff;
  --done: #3dd68c;
  --cancelled: #9aa5b1;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #f4f6f8;
    --card: #fff;
    --border: #d9e2ec;
    --text: #102a43;
    --muted: #627d98;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
}

a {
  color: var(--accent);
  text-decoration: none;
}

.app-shell {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem 1.25rem 2rem;
}

.app-header {
  margin-bottom: 1rem;
}

.brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.subtitle {
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}
</style>