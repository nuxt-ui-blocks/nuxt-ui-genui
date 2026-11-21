<script setup lang="ts">
import { ref } from 'vue'
import type { Component } from 'vue'
import { Renderer, type ActionEvent, type Library, type McpClientLike, type OpenUIError, type ParseResult } from '@openuidev/vue-lang'
import { provideGenUIContainerChildren } from '@nuxt-ui-genui/components'
import { useRendererBridge, cleanDiagnosticNames } from './renderer-bridge'

const props = withDefaults(defineProps<{
  response?: string | null
  isStreaming?: boolean
  library: Library
  onAction?: (e: ActionEvent) => void
  onError?: (errors: OpenUIError[]) => void
  onParseResult?: (result: ParseResult | null) => void
  /**
   * Resolve `Query("name", args)` / `Mutation("name", args)` tool calls in the
   * program. A plain record of async functions, or an `McpClientLike`. The host
   * supplies it - the framework never calls a tool it was not given.
   */
  toolProvider?: Record<string, (args: Record<string, unknown>) => Promise<unknown>> | McpClientLike | null
  /** Vue component rendered in place while a Query() is resolving. */
  queryLoader?: Component
  /** Called with the renderer's $state snapshot on every change. */
  onStateUpdate?: (state: Record<string, any>) => void
  /** Seed value for the renderer's $state. */
  initialState?: Record<string, any>
  /**
   * Called with the names of references used in the program but never defined
   * (they resolve to null). This is the "broken reference" list.
   */
  onUnresolved?: (names: string[]) => void
  /**
   * Called with the names of value statements the model defined but never
   * used (they are dropped from the render tree).
   */
  onOrphaned?: (names: string[]) => void
  /**
   * Extra component names Card may render. Pass the list registered through
   * `createNuxtUILibrary({ extraCardChildren })`. Defaults to `CARD_CHILD_NAMES`.
   */
  cardChildren?: readonly string[]
}>(), { response: null, isStreaming: false })

if (props.cardChildren?.length) {
  provideGenUIContainerChildren({ Card: props.cardChildren })
}

const devErrors = ref<OpenUIError[]>([])
const devUnresolved = ref<string[]>([])
const devOrphaned = ref<string[]>([])
const isDev = import.meta.dev

const { handleError: forwardError, handleParseResult: forwardParseResult, handleAction } = useRendererBridge(() => props)

function handleError(errors: OpenUIError[]) {
  if (isDev) devErrors.value = errors
  forwardError(errors)
}

function handleParseResult(result: ParseResult | null) {
  if (isDev) {
    devUnresolved.value = cleanDiagnosticNames(result?.meta?.unresolved)
    devOrphaned.value = cleanDiagnosticNames(result?.meta?.orphaned)
  }
  forwardParseResult(result)
}
</script>
<template>
  <ClientOnly>
    <Renderer :response="response ?? null" :library="library" :is-streaming="isStreaming" :on-action="handleAction" :on-error="handleError" :on-parse-result="handleParseResult" :tool-provider="toolProvider" :query-loader="queryLoader" :on-state-update="onStateUpdate" :initial-state="initialState" />
    <div v-if="isDev && (devErrors.length || devUnresolved.length || devOrphaned.length)" class="fixed bottom-2 right-2 z-50 max-h-40 max-w-md overflow-auto rounded border border-error/50 bg-error/10 p-2 text-[10px]">
      <p v-if="devErrors.length" class="font-bold">OpenUI parse errors ({{ devErrors.length }})</p>
      <ul><li v-for="(e, i) in devErrors" :key="'e' + i"><code>{{ e.code ?? 'error' }}</code>: {{ e.message }}</li></ul>
      <p v-if="devUnresolved.length" class="font-bold">Unresolved references ({{ devUnresolved.length }})</p>
      <ul><li v-for="(name, i) in devUnresolved" :key="'u' + i"><code>{{ name }}</code> is used but never defined</li></ul>
      <p v-if="devOrphaned.length" class="font-bold">Unused statements ({{ devOrphaned.length }})</p>
      <ul><li v-for="(name, i) in devOrphaned" :key="'o' + i"><code>{{ name }}</code> is defined but never used</li></ul>
    </div>
  </ClientOnly>
</template>
