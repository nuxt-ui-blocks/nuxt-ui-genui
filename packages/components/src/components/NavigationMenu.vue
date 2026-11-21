<script setup lang="ts">
import UNavigationMenu from '@nuxt/ui/components/NavigationMenu.vue'
import { computed } from 'vue'

const props = defineProps<{ props: { items?: { label: string; url?: string; icon?: string }[] } }>()
const p = computed(() => props.props ?? {})
const items = computed(() =>
  (Array.isArray(p.value.items) ? p.value.items : []).map((item) => ({
    label: item.label,
    ...(item.icon ? { icon: item.icon } : {}),
    ...(typeof item.url === 'string' && item.url.startsWith('https://')
      ? { to: item.url, target: '_blank', rel: 'noopener noreferrer' }
      : {})
  }))
)
</script>

<template>
  <UNavigationMenu v-if="items.length" :items="items as never" orientation="horizontal" class="border-b border-default pb-2" />
</template>
