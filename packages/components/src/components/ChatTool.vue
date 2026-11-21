<script setup lang="ts">
import UChatTool from '@nuxt/ui/components/ChatTool.vue'
import { computed } from 'vue'
const props = defineProps<{ props: { name?: string; text?: string; suffix?: string; icon?: string; loading?: boolean } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
// The installed UChatTool has no `name` prop; the model's `name` maps to its `text` prop.
// An optional non-empty model `text` acts as the display override, falling back to `name`.
const text = computed(() => {
  const override = typeof p.value.text === 'string' && p.value.text.trim() ? p.value.text.trim() : undefined
  const name = typeof p.value.name === 'string' && p.value.name.trim() ? p.value.name.trim() : undefined
  return override ?? name
})
const suffix = computed(() => (typeof p.value.suffix === 'string' && p.value.suffix.trim() ? p.value.suffix.trim() : undefined))
const icon = computed(() => (typeof p.value.icon === 'string' && p.value.icon.trim() ? p.value.icon.trim() : undefined))
</script>
<template>
  <UChatTool v-if="text" :text="text" :suffix="suffix" :icon="icon" :loading="p.loading === true" />
</template>
