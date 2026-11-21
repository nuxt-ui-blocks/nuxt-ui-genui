<script setup lang="ts">
import UBreadcrumb from '@nuxt/ui/components/Breadcrumb.vue'
import { computed } from 'vue'

const props = defineProps<{ props: { items?: { label: string; url?: string }[] } }>()
// Reactive on purpose: containers are patched in place while the program streams.
const p = computed(() => props.props ?? {})
// https-only guard: a model-supplied http/javascript/etc. url never becomes a link.
const isHttps = (url?: string) => typeof url === 'string' && url.startsWith('https://')
const items = computed(() => (Array.isArray(p.value.items) ? p.value.items : []).map((item) => ({
  label: item.label,
  ...(isHttps(item.url) ? { to: item.url } : {})
})))
</script>
<template>
  <UBreadcrumb v-if="items.length" :items="items" />
</template>
