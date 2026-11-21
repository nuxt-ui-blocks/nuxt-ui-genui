<script setup lang="ts">
import UKbd from '@nuxt/ui/components/Kbd.vue'
import { computed } from 'vue'
import { asArray } from '../helpers'
const props = defineProps<{ props: { keys?: string[] } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const keys = computed(() =>
  asArray(p.value.keys)
    .filter((k): k is string => typeof k === 'string')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
    .slice(0, 12)
)
</script>
<template>
  <span v-if="keys.length > 0" class="inline-flex items-center gap-1">
    <template v-for="(key, i) in keys" :key="i">
      <UKbd :value="key" />
      <span v-if="i < keys.length - 1" aria-hidden="true">+</span>
    </template>
  </span>
</template>
