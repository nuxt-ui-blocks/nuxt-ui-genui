<script setup lang="ts">
import UContextMenu from '@nuxt/ui/components/ContextMenu.vue'
import { BuiltinActionType, useTriggerAction } from '@openuidev/vue-lang'
import { computed } from 'vue'

interface MenuItem { label: string; icon?: string; url?: string; message?: string; disabled?: boolean }

const props = defineProps<{ props: { items?: MenuItem[] } }>()
const p = computed(() => props.props ?? {})
const isHttps = (url?: string) => typeof url === 'string' && url.startsWith('https://')
const triggerAction = useTriggerAction()

function pick(item: MenuItem) {
  if (isHttps(item.url)) window.open(item.url, '_blank', 'noopener,noreferrer')
  if (item.message) {
    triggerAction(item.message, undefined, { type: BuiltinActionType.ContinueConversation, params: { message: item.message } })
  }
}
const items = computed(() =>
  (Array.isArray(p.value.items) ? p.value.items : []).map((item) => ({
    label: item.label,
    ...(item.icon ? { icon: item.icon } : {}),
    disabled: item.disabled,
    ...(isHttps(item.url) ? { to: item.url, target: '_blank', rel: 'noopener noreferrer' } : {}),
    ...(item.message ? { onSelect: () => pick(item) } : {})
  }))
)
</script>

<template>
  <UContextMenu v-if="items.length" :items="items as never">
    <div class="cursor-context-menu select-none rounded-lg border border-dashed border-default px-6 py-8 text-center text-sm text-muted">Right-click for actions</div>
  </UContextMenu>
</template>
