<script setup lang="ts">
import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import { computed } from 'vue'

const props = defineProps<{ props: { text?: string; tooltip?: string } }>()
const p = computed(() => props.props ?? {})
const show = computed(() => Boolean(p.value.text && p.value.tooltip))
</script>

<template>
  <UTooltip v-if="show" :text="p.tooltip">
    <span class="cursor-help underline decoration-dotted underline-offset-2" role="note" tabindex="0">{{ p.text }}</span>
  </UTooltip>
</template>
