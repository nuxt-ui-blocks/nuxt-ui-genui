<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { computed, ref } from 'vue'
import { hasAllProps } from '../helpers'
import { renderMarkdown } from '../markdown'

const props = defineProps<{ props: { title?: string; triggerLabel?: string; content?: string } }>()
const p = computed(() => props.props ?? {})
const open = ref(false)
const html = computed(() => renderMarkdown(p.value.content ?? ''))
</script>

<template>
  <UPopover v-if="hasAllProps(p, 'triggerLabel')" v-model:open="open">
    <UButton color="neutral" variant="outline">{{ p?.triggerLabel }}</UButton>
    <template #content>
      <div class="max-w-xs p-4">
        <h4 v-if="p?.title" class="mb-2 text-sm font-semibold">{{ p.title }}</h4>
        <div class="text-sm" v-html="html" />
      </div>
    </template>
  </UPopover>
</template>
