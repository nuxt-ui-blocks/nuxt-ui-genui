<script setup lang="ts">
import UAccordion from '@nuxt/ui/components/Accordion.vue'
import { computed } from 'vue'
import { asArray } from '../helpers'
const props = defineProps<{ props: { items?: Array<{ label?: string; content?: string }>; type?: 'single' | 'multiple' } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const items = computed(() =>
  asArray(p.value.items)
    .filter((item): item is { label?: string; content?: string } => !!item && typeof item === 'object')
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label.trim() : '',
      content: typeof item.content === 'string' ? item.content : ''
    }))
    .filter((item) => item.label.length > 0)
)
const type = computed(() => (p.value.type === 'single' || p.value.type === 'multiple' ? p.value.type : undefined))
</script>
<template>
  <UAccordion v-if="items.length > 0" :items="items" :type="type" />
</template>
