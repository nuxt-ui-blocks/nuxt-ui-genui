<script setup lang="ts">
import UTabs from '@nuxt/ui/components/Tabs.vue'
import { computed, ref, watch } from 'vue'
import { renderMarkdown } from '../markdown'
import type { z } from 'zod/v4'
import type { TabsDef } from '../defs'

type Props = z.infer<typeof TabsDef.props>
const props = defineProps<{ props: Props }>()
// Reactive on purpose: containers are patched in place while the program streams.
const p = computed(() => props.props ?? {})
const items = computed(() => (Array.isArray(p.value.items) ? p.value.items : []))
const clampIndex = (i: number) => Math.max(0, Math.min(i, Math.max(items.value.length - 1, 0)))
const active = ref(String(clampIndex(p.value.defaultIndex ?? 0)))
watch(() => p.value.defaultIndex, (i) => { active.value = String(clampIndex(i ?? 0)) })
watch(items, () => { active.value = String(clampIndex(Number(active.value))) })
// Wire items have no `value`; UTabs needs one, so index-stringify. defaultValue is
// initial-only in UTabs, so a controlled v-model is required for streaming patches.
const tabs = computed(() => items.value.map((item, i) => ({
  label: item.label,
  value: String(i),
  content: item.content
})))
const markdown = (item: { content?: string }) => renderMarkdown(item.content ?? '')
</script>
<template>
  <UTabs v-if="items.length" v-model="active" :items="tabs">
    <template #content="{ item }">
      <div v-html="markdown(item)" />
    </template>
  </UTabs>
</template>
