<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDrawer from '@nuxt/ui/components/Drawer.vue'
import { computed, ref, watch } from 'vue'
import { hasAllProps } from '../helpers'
import { renderMarkdown } from '../markdown'

const props = defineProps<{ props: { title?: string; triggerLabel?: string; content?: string; defaultOpen?: boolean } }>()
const p = computed(() => props.props ?? {})
const open = ref(Boolean(p.value.defaultOpen))
// Watch the prop: the renderer patches it while the program streams.
watch(() => p.value.defaultOpen, (value) => {
  open.value = Boolean(value)
})
const html = computed(() => renderMarkdown(p.value.content ?? ''))
</script>

<template>
  <UDrawer v-if="hasAllProps(p, 'triggerLabel')" v-model:open="open">
    <UButton color="neutral" variant="outline">{{ p?.triggerLabel }}</UButton>
    <template #content>
      <div class="space-y-3 p-6 pb-8">
        <h3 v-if="p?.title" class="text-base font-semibold">{{ p.title }}</h3>
        <div class="text-sm" v-html="html" />
      </div>
    </template>
  </UDrawer>
</template>
