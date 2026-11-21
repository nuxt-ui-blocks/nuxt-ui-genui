<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import { BuiltinActionType, useTriggerAction } from '@openuidev/vue-lang'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'

interface MenuItem { label: string; icon?: string; url?: string; message?: string; disabled?: boolean }

const props = defineProps<{ props: { triggerLabel?: string; items?: MenuItem[] } }>()
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
  <UDropdownMenu v-if="hasAllProps(p, 'triggerLabel')" :items="items as never">
    <UButton color="neutral" variant="outline" icon="i-lucide-chevron-down">{{ p?.triggerLabel }}</UButton>
  </UDropdownMenu>
</template>
