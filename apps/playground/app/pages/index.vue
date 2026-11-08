<script setup lang="ts">
import type { OpenUIError } from '@openuidev/vue-lang'

const { messages, isStreaming, error, sendMessage, handleAction } = useGenUIChat()
const draft = ref('Create a sales dashboard with revenue, orders, conversion rate, and recent orders.')
const renderError = ref<string | null>(null)

function onRenderError(errors: OpenUIError[]) {
  renderError.value = errors[0]?.message ?? 'Render failed.'
}

async function submit() {
  const prompt = draft.value
  draft.value = ''
  renderError.value = null
  await sendMessage(prompt)
}
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6">
    <header class="mb-8 flex items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <div class="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <UIcon name="i-lucide-sparkles" class="size-5" />
          </div>
          <h1 class="text-xl font-semibold tracking-tight">Nuxt UI GenUI</h1>
          <UBadge color="warning" variant="subtle">MVP</UBadge>
        </div>
        <p class="mt-2 text-sm text-muted">OpenUI Lang × Nuxt UI 4</p>
      </div>
      <UColorModeButton />
    </header>

    <section class="flex-1 space-y-6">
      <div v-for="message in messages" :key="message.id" class="space-y-3">
        <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
          <div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm" :class="message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-elevated text-default'">
            {{ message.text }}
          </div>
        </div>
        <div v-if="message.ui !== undefined && message.ui !== ''" class="w-full">
          <GenuiGenUIRenderer :response="message.ui" :is-streaming="false" @action="handleAction" @error="onRenderError" />
        </div>
      </div>

      <UAlert v-if="error" color="error" variant="subtle" title="Generation error" :description="error" />
      <UAlert v-if="renderError" color="error" variant="subtle" title="Render error" :description="renderError" />
    </section>

    <form class="mt-8 rounded-2xl border border-default bg-default p-3 shadow-sm" @submit.prevent="submit">
      <UTextarea v-model="draft" autoresize :rows="2" :maxrows="5" variant="none" placeholder="Describe the interface you want..." class="w-full" />
      <div class="mt-3 flex items-center justify-between gap-3 border-t border-default pt-3">
        <p class="text-xs text-muted">Model-backed · OpenUI Lang renderer · offline demo at /api/genui/demo</p>
        <UButton type="submit" :loading="isStreaming" :disabled="!draft.trim() || isStreaming" trailing-icon="i-lucide-arrow-up">
          Generate UI
        </UButton>
      </div>
    </form>
    <p class="mt-3 text-center text-xs text-muted">Do not use generated UI as authorization to perform privileged actions.</p>
  </main>
</template>
