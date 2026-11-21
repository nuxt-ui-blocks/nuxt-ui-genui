<script setup lang="ts">
import UScrollArea from '@nuxt/ui/components/ScrollArea.vue'
import { useRenderNode } from '@openuidev/vue-lang'
import { computed, defineComponent } from 'vue'
import { CHAT_CHILD_NAMES, FORM_FIELD_NAMES } from '../unions'
const props = defineProps<{ props: { children?: unknown; orientation?: 'horizontal' | 'vertical'; shadow?: boolean } }>()
const renderNode = useRenderNode()
// Keep reactive: the renderer patches this instance in place while the program streams.
const data = computed(() => props.props ?? {})
// vue-lang 0.4.x does not enforce union membership at parse/render time; drop
// chat-root and bare field children that are never legal inside a ScrollArea.
const children = computed(() => {
  const kids = data.value?.children
  if (!Array.isArray(kids)) return []
  const banned = [...CHAT_CHILD_NAMES, ...FORM_FIELD_NAMES] as readonly string[]
  return kids.filter((n) => {
    if (!n || typeof n !== 'object') return false
    const node = n as { type?: unknown; typeName?: unknown }
    if (node.type !== 'element' || typeof node.typeName !== 'string') return false
    return !banned.includes(node.typeName)
  })
})
// Stable identity: an inline arrow in the slot would unmount/remount the subtree
// on every parent render.
const Children = defineComponent({ setup: () => () => renderNode(children.value) })
</script>
<template>
  <UScrollArea
    :orientation="data?.orientation ?? 'vertical'"
    :shadow="data?.shadow"
    :class="data?.orientation === 'horizontal' ? 'w-full overflow-x-auto' : 'h-64 w-full'"
  >
    <div class="space-y-3"><Children /></div>
  </UScrollArea>
</template>
