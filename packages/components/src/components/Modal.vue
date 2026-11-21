<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
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
  <div v-if="hasAllProps(p, 'triggerLabel')">
    <UButton color="neutral" variant="outline" @click="open = true">{{ p?.triggerLabel }}</UButton>
    <UModal v-model:open="open" :title="p?.title">
      <div class="p-4" v-html="html" />
    </UModal>
  </div>
</template>
