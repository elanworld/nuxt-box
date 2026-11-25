<script setup lang="ts">
const tags = defineModel<string[]>({ required: true })
const draft = defineModel<string>('draft', { required: true })

function addTag() {
  const tag = draft.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value = [...tags.value, tag]
  }
  draft.value = ''
}

function onEnter(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  addTag()
}
</script>

<template>
  <fieldset class="tag-field">
    <legend>标签（选填）</legend>
    <ul v-if="tags.length" class="chips" aria-label="已添加的标签">
      <li v-for="tag in tags" :key="tag">
        <span>{{ tag }}</span>
        <button type="button" :aria-label="`移除标签 ${tag}`" @click="tags = tags.filter((item) => item !== tag)">
          ×
        </button>
      </li>
    </ul>
    <div class="input-row">
      <input v-model="draft" type="text" aria-label="输入标签" placeholder="输入标签后按回车" @keydown.enter="onEnter" />
      <button type="button" :disabled="!draft.trim()" @click="addTag">添加标签</button>
    </div>
  </fieldset>
</template>

<style scoped>
.tag-field {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

legend {
  padding: 0;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

.chips, .input-row {
  display: flex;
  gap: 0.4rem;
}

.chips {
  flex-wrap: wrap;
  padding: 0;
  margin: 0 0 0.4rem;
  list-style: none;
}

.chips li {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  overflow-wrap: anywhere;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.1rem 0.4rem 0.1rem 0.55rem;
}

.input-row input, button {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.4rem 0.55rem;
  background: transparent;
  color: var(--text);
  font: inherit;
}

.input-row input {
  flex: 1;
  min-width: 0;
}

button {
  cursor: pointer;
  white-space: nowrap;
}

button:disabled {
  opacity: 0.55;
}

.chips button {
  border: 0;
  padding: 0.1rem 0.3rem;
}
</style>
