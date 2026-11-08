<script setup lang="ts">
import type { OpenUIError } from '@openuidev/vue-lang'

type GenUIPart = { type: 'data-genui'; data: { ui: string } }

const {
  messages,
  status,
  error,
  renderError,
  isStreaming,
  sendMessage,
  handleAction,
  setRenderError
} = useGenUIChat()

const draft = ref('Create a sales dashboard with revenue, orders, conversion rate, and recent orders.')

function isInFlight(message: { id: string }): boolean {
  // Only the last (in-flight) assistant message streams; completed
  // dashboards render in final mode and surface terminal errors.
  return isStreaming.value && messages.value[messages.value.length - 1]?.id === message.id
}

function onRendererError(errors: OpenUIError[], messageId: string) {
  // Suppress transient render errors only while THIS message is the in-flight one;
  // only the terminal verdict is surfaced.
  if (isStreaming.value && messages.value[messages.value.length - 1]?.id === messageId) return
  const joined = errors
    .map((e) => (e as { message?: string })?.message ?? String(e))
    .filter(Boolean)
    .join('\n')
    .trim()
  // errors cleared signal (renderer reports onError([])) → empty → banner cleared.
  setRenderError(joined || null)
}

async function submit() {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  await sendMessage(text)
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

    <UChatMessages
      :messages="messages"
      :status="status"
      :user="{ icon: 'i-lucide-user' }"
      :assistant="{ icon: 'i-lucide-bot' }"
      class="flex-1"
    >
      <template #content="{ message }">
        <template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}`">
          <div v-if="part.type === 'data-genui'" class="w-full">
            <GenuiGenUIRenderer
              :response="(part as GenUIPart).data.ui"
              :is-streaming="isInFlight(message)"
              @action="handleAction"
              @error="(errors) => onRendererError(errors, message.id)"
            />
          </div>
          <p v-else-if="part.type === 'text'" class="text-sm">{{ part.text }}</p>
        </template>
      </template>
    </UChatMessages>

    <UChatPrompt
      v-model="draft"
      placeholder="Ask me to create a dashboard…"
      @submit="submit()"
    >
      <template #footer>
        <UChatPromptSubmit :status="status" />
      </template>
    </UChatPrompt>

    <UAlert
      v-if="renderError"
      class="mt-4 whitespace-pre-wrap"
      color="error"
      variant="subtle"
      title="Render error"
      :description="renderError"
    />
    <UAlert
      v-if="error"
      class="mt-4 whitespace-pre-wrap"
      color="error"
      variant="subtle"
      title="Generation error"
      :description="error"
    />

    <p class="mt-3 text-center text-xs text-muted">
      Model-backed · OpenUI Lang renderer · offline demo at /api/genui/demo · Do not use generated UI as authorization to perform privileged actions.
    </p>
  </main>
</template>
