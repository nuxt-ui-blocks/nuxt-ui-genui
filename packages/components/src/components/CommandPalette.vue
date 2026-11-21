<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UCommandPalette from '@nuxt/ui/components/CommandPalette.vue'
import UPopover from '@nuxt/ui/components/Popover.vue'
import { BuiltinActionType, useTriggerAction } from '@openuidev/vue-lang'
import { computed, ref } from 'vue'
interface PaletteItem { label: string; icon?: string; url?: string; message?: string }
const props = defineProps<{ props: { items?: PaletteItem[] } }>()
// Reactive on purpose: containers are patched in place while the program streams.
const p = computed(() => props.props ?? {})
const items = computed(() => (Array.isArray(p.value.items) ? p.value.items : []))
const open = ref(false)
const triggerAction = useTriggerAction()
const isHttps = (url?: string) => typeof url === 'string' && url.startsWith('https://')
function pick(item: PaletteItem) {
  open.value = false
  if (isHttps(item.url)) window.open(item.url, '_blank', 'noopener,noreferrer')
  if (item.message) {
    triggerAction(item.message, undefined, { type: BuiltinActionType.ContinueConversation, params: { message: item.message } })
  }
}
// UCommandPalette is triggerless and owns its own search/Fuse filtering. Map the
// flat wire items into one named group and keep the action wiring in onSelect so
// both message items and https-only url items behave exactly as before.
const groups = computed(() => [{
  id: 'commands',
  items: items.value.map((item) => ({
    label: item.label,
    icon: item.icon,
    onSelect: () => pick(item)
  }))
}])
</script>
<template>
  <UPopover v-if="items.length" v-model:open="open">
    <UButton color="neutral" variant="outline" icon="i-lucide-terminal">Commands</UButton>
    <template #content>
      <UCommandPalette
        :groups="groups"
        placeholder="Filter commands…"
        autofocus
        class="w-80"
        @update:open="open = false"
      />
    </template>
  </UPopover>
</template>
