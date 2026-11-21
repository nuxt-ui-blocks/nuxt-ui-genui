<script setup lang="ts">
import { createGenUIChat, collectAssistantText, isAssistantActive, type GenUIMessage } from '@nuxt-ui-genui/chat'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BuiltinActionType, type ActionEvent, type Library } from '@openuidev/vue-lang'
import { createPlaygroundLibrary } from '~/lib/library'
import { useRoute, useRouter } from '#imports'
import * as sfc from '@nuxt-ui-genui/components/sfc'
import WeatherCard from '~/components/WeatherCard.vue'
import Prompt from '~/components/chat/Prompt.vue'

const library = createPlaygroundLibrary({ ...sfc, WeatherCard }) as unknown as Library

/* ── tools (host-supplied; the model never invents these) ────────────────── */

const toolProvider = {
  get_server_health: async ({ server_id }: Record<string, unknown>) => {
    const id = typeof server_id === 'string' ? server_id : 'prod-eu-west-1'
    return { status: 'operational', uptime: 42, latency_ms: 120, region: id.includes('us') ? 'us-east-1' : 'eu-west-1' }
  }
}

/* ── conversation ─────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'genui-ops-messages-v4'
const savedMessages = (() => {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
})()

const chat = createGenUIChat(savedMessages ? { api: '/api/chat', messages: savedMessages as GenUIMessage[] } : { api: '/api/chat' })

const input = ref('')
const messages = computed(() => chat.messages.value)
const status = computed(() => chat.status.value)
const error = computed(() => chat.error.value)
const isWorking = computed(() => isAssistantActive(status.value))

/**
 * Nuxt UI types its chat slots against the AI SDK's `UIMessage`. `GenUIMessage`
 * is structurally identical, so this crosses that one boundary without pulling
 * the AI SDK into the host app.
 */
const asMessage = (message: unknown) => message as GenUIMessage

function persist(value: GenUIMessage[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* quota failures never break the session */
  }
}

// The transcript changes on every streamed chunk. Writing it to localStorage
// on each chunk would serialise the whole conversation per token, so the
// write is debounced and the last state wins.
let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(messages, (value) => {
  if (typeof window === 'undefined') return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = undefined
    persist(value)
  }, 300)
}, { deep: true })

onBeforeUnmount(() => {
  if (!saveTimer) return
  clearTimeout(saveTimer)
  saveTimer = undefined
  persist(messages.value)
})

/* ── attachments ──────────────────────────────────────────────────────────── */

const { dropzoneRef, dragging, open, files, uploading, uploadedFiles, removeFile, clearFiles } = useFileUploadWithStatus()

/* ── votes (client-side, persisted) ───────────────────────────────────────── */

const VOTES_KEY = 'genui-ops-votes-v1'
const votes = ref<Record<string, boolean>>((() => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(VOTES_KEY) ?? '{}')
  } catch {
    return {}
  }
})())

function vote(message: GenUIMessage, isUpvoted: boolean) {
  votes.value = { ...votes.value, [message.id]: isUpvoted }
  try {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(votes.value))
  } catch {
    /* ignore */
  }
}

/* ── editing ──────────────────────────────────────────────────────────────── */

const editingMessageId = ref<string | null>(null)

function startEdit(message: GenUIMessage) {
  editingMessageId.value = message.id
}

function saveEdit(_message: GenUIMessage, text: string) {
  editingMessageId.value = null
  send(text)
}

/* ── send / stop / regenerate ─────────────────────────────────────────────── */

function send(text?: string) {
  const content = (text ?? input.value).trim()
  if (!content || isWorking.value) return

  // Only attachments whose bytes could be read travel with the message: a
  // provider cannot fetch a `blob:` URL and an empty data URL is not a file.
  const attachments = uploadedFiles.value
    .filter(entry => !!entry.dataUrl)
    .map(entry => ({
      type: 'file' as const,
      mediaType: entry.file.type,
      filename: entry.file.name,
      url: entry.dataUrl
    }))

  chat.sendMessage(attachments.length ? { text: content, files: attachments } : { text: content })
  input.value = ''
  clearFiles()
}

function onSubmit(event: Event) {
  event.preventDefault()
  send()
}

function regenerate() {
  chat.regenerate()
}

/* ── quick prompts from the sidebar (?q=...) ─────────────────────────────── */

const route = useRoute()
const router = useRouter()
watch(() => route.query.q, (q) => {
  if (typeof q !== 'string' || !q.trim()) return
  send(q)
  router.replace({ query: {} })
}, { immediate: true })

/* ── audit log + provider ────────────────────────────────────────────────── */

interface AuditEvent { ts: number; formId: string; values: Record<string, unknown> }
const auditEvents = ref<AuditEvent[]>([])
const auditNote = ref('')
const provider = ref<{ live: boolean; mock: boolean; model?: string }>({ live: false, mock: false })

async function refreshAudit() {
  try {
    const res = await $fetch<{ ok: boolean; events?: AuditEvent[] }>('/api/operations')
    auditEvents.value = res.events ?? []
  } catch {
    auditNote.value = 'Audit log unavailable'
  }
}

onMounted(() => {
  refreshAudit()
  $fetch<{ live: boolean; mock: boolean; model?: string }>('/api/provider').then((r) => { provider.value = r }).catch(() => {})
})

async function handleAction(event: ActionEvent) {
  if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
    chat.sendMessage({ text: event.humanFriendlyMessage })
    return
  }
  if (event.type === 'submit_form') {
    const params = event.params as { formId?: string; values?: Record<string, unknown> } | undefined
    if (!params?.formId) return
    try {
      await $fetch('/api/operations', { method: 'POST', body: { formId: params.formId, values: params.values ?? {} } })
      auditNote.value = `Recorded operation: ${params.formId}`
      await refreshAudit()
    } catch {
      auditNote.value = 'Failed to record the operation'
    }
  }
}

const textOf = collectAssistantText
const formatTime = (ts: number) => new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const reset = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(VOTES_KEY)
  } catch {
    /* nothing to clear */
  }
  window.location.reload()
}
</script>

<template>
  <!-- Chat panel — same shape as nuxt-ui-templates/chat's chat view -->
  <UDashboardPanel id="chat" class="relative min-h-0" :ui="{ body: 'p-0 sm:p-0 overscroll-none' }">
    <template #header>
      <Navbar>
        <template #title>
          <h1 class="min-w-0 truncate text-sm font-semibold text-highlighted">
            Operations Center
          </h1>
        </template>

        <UBadge
          :color="provider.live ? 'success' : provider.mock ? 'neutral' : 'warning'"
          variant="soft"
          :label="provider.live ? `live · ${provider.model ?? 'model'}` : provider.mock ? 'mock · deterministic' : 'not configured'"
        />
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          size="sm"
          title="New conversation"
          aria-label="New conversation"
          @click="reset"
        />
      </Navbar>
    </template>

    <template #body>
      <div ref="dropzoneRef" class="flex flex-1 min-h-0">
        <DragDropOverlay :show="dragging" />

        <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6 min-h-0">
          <UChatMessages
            :messages="messages"
            :status="status"
            should-auto-scroll
            :spacing-offset="200"
            class="flex-1 pt-4 sm:pt-6 pb-4 sm:pb-6"
          >
            <template #indicator>
              <div class="flex items-center gap-1.5">
                <ChatIndicator class="text-muted" />
                <UChatShimmer text="Thinking..." class="text-sm" />
              </div>
            </template>

            <template #files="{ parts }">
              <ChatFilePreview
                v-for="(part, index) in parts"
                :key="index"
                :name="part.filename ?? 'attachment'"
                :type="part.mediaType"
                :preview-url="part.url"
                size="3xl"
              />
            </template>

            <template #content="{ message }">
              <ChatMessageContent
                :message="asMessage(message)"
                :editing="editingMessageId === message.id"
                :library="library"
                :is-working="isWorking"
                :on-action="handleAction"
                :tool-provider="toolProvider"
                @save="saveEdit"
                @cancel-edit="editingMessageId = null"
              />
            </template>

            <template #actions="{ message }">
              <ChatMessageActions
                :message="asMessage(message)"
                :streaming="status === 'streaming' && message.id === messages[messages.length - 1]?.id"
                :editing="editingMessageId === message.id"
                :vote="votes[message.id] ?? null"
                @vote="(m, up) => vote(asMessage(m), up)"
                @edit="startEdit(asMessage(message))"
                @regenerate="regenerate"
              />
            </template>
          </UChatMessages>

          <Prompt
            v-model="input"
            :status="status"
            :error="error ?? undefined"
            :files="files"
            :uploading="uploading"
            :open="open"
            class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
            @submit="onSubmit"
            @stop="chat.stop()"
            @reload="regenerate"
            @remove="removeFile"
          />
        </UContainer>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Audit log panel -->
  <UDashboardPanel id="audit" resizable :min-size="14" :default-size="17" :max-size="22" class="hidden h-full min-h-0 border-l border-default md:flex" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <UDashboardNavbar toggle-side="right">
        <template #left>
          <h2 class="min-w-0 truncate text-sm font-semibold text-highlighted">Audit log</h2>
        </template>
        <template #right>
          <button type="button" class="text-sm font-medium text-primary hover:underline" @click="refreshAudit">Refresh</button>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full flex-col gap-2 overflow-y-auto p-4">
        <p v-if="auditNote" class="rounded-md bg-success/10 px-3 py-2 text-xs text-success">{{ auditNote }}</p>

        <ul v-if="auditEvents.length" class="flex flex-col gap-2">
          <li v-for="event in auditEvents" :key="event.ts" class="rounded-lg border border-default bg-default p-2.5">
            <div class="mb-1 flex items-center justify-between gap-2">
              <UBadge color="primary" variant="soft" class="max-w-full truncate">{{ event.formId }}</UBadge>
              <span class="shrink-0 text-[10px] text-muted">{{ formatTime(event.ts) }}</span>
            </div>
            <pre class="overflow-x-auto whitespace-pre-wrap text-[10px] leading-snug text-muted">{{ JSON.stringify(event.values, null, 2) }}</pre>
          </li>
        </ul>
        <div v-else class="rounded-lg border border-dashed border-default p-5 text-center text-xs leading-relaxed text-muted">
          <p class="font-medium text-default">No operations recorded yet</p>
          <p class="mt-1">Run an approval turn and it lands here.</p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
