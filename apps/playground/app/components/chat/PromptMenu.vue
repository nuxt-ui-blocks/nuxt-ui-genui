<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'

const props = defineProps<{
  open: () => void
}>()

const { webSearch, reasoning } = useChatSettings()

const items = computed<DropdownMenuItem[][]>(() => [
  [{
    label: 'Add files or photos',
    icon: 'i-lucide-paperclip',
    kbds: ['meta', 'u'],
    onSelect: () => props.open()
  }],
  [{
    label: 'Web search',
    icon: 'i-lucide-globe',
    type: 'checkbox',
    checked: webSearch.value,
    onSelect: (event: Event) => {
      event.preventDefault()
      webSearch.value = !webSearch.value
    }
  }, {
    label: 'Extended thinking',
    icon: 'i-lucide-brain',
    type: 'checkbox',
    checked: reasoning.value,
    onSelect: (event: Event) => {
      event.preventDefault()
      reasoning.value = !reasoning.value
    }
  }]
])

defineShortcuts({
  meta_u: {
    usingInput: true,
    handler: () => props.open()
  }
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ side: 'top', align: 'start', alignOffset: -4 }"
    :ui="{ content: 'w-52' }"
    size="sm"
  >
    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="Open prompt menu"
      class="data-[state=open]:bg-elevated"
    />
  </UDropdownMenu>
</template>
