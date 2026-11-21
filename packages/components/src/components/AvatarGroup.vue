<script setup lang="ts">
import { computed } from 'vue'
import UAvatarGroup from '@nuxt/ui/components/AvatarGroup.vue'
import UAvatar from '@nuxt/ui/components/Avatar.vue'
const props = defineProps<{ props: { avatars?: { src?: string; alt?: string; text?: string }[]; max?: number } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const MAX_VISIBLE = 8
const MAX_ITEMS = 100
// The whole list is handed to UAvatarGroup so its "+N" badge reflects the real
// overflow - slicing first would under-report it (UAvatarGroup computes
// hiddenCount from the number of children it receives).
const avatars = computed(() => (Array.isArray(p.value.avatars) ? p.value.avatars : []).slice(0, MAX_ITEMS))
const max = computed(() => {
  const n = typeof p.value.max === 'number' ? Math.floor(p.value.max) : undefined
  if (n === undefined || Number.isNaN(n)) return MAX_VISIBLE
  return Math.min(Math.max(n, 1), MAX_VISIBLE)
})
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}
</script>
<template>
  <UAvatarGroup v-if="avatars.length" :max="max">
    <UAvatar v-for="(a, i) in avatars" :key="i" :src="str(a.src)" :alt="str(a.alt)" :text="str(a.text)" />
  </UAvatarGroup>
</template>
