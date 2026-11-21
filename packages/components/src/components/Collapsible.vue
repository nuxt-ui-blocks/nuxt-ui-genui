<script setup lang="ts">
import { computed } from 'vue'
import UCollapsible from '@nuxt/ui/components/Collapsible.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import { hasAllProps } from '../helpers'
const props = defineProps<{ props: { label?: string; content?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
</script>
<template>
  <UCollapsible v-if="hasAllProps(p, 'label', 'content')">
    <UButton :label="p.label" variant="ghost" size="sm" trailing-icon="lucide:chevron-down" />
    <template #content>
      <p class="text-sm px-2 py-1">{{ p.content }}</p>
    </template>
  </UCollapsible>
</template>
