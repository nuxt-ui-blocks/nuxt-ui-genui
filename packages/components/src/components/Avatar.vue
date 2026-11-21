<script setup lang="ts">
import { computed } from 'vue'
import UAvatar from '@nuxt/ui/components/Avatar.vue'
const props = defineProps<{ props: { src?: string; alt?: string; text?: string; size?: string; icon?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}
const AVATAR_SIZES = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
type AvatarSize = (typeof AVATAR_SIZES)[number]
function pickSize(v: unknown): AvatarSize | undefined {
  const s = str(v)
  return s && (AVATAR_SIZES as readonly string[]).includes(s) ? (s as AvatarSize) : undefined
}
const src = computed(() => str(p.value.src))
const alt = computed(() => str(p.value.alt))
const text = computed(() => str(p.value.text))
const icon = computed(() => str(p.value.icon))
const size = computed(() => pickSize(p.value.size))
</script>
<template>
  <UAvatar v-if="src || alt || text || icon" :src="src" :alt="alt" :text="text" :icon="icon" :size="size" />
</template>
