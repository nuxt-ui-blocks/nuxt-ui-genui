<script setup lang="ts">
import UChatPalette from '@nuxt/ui/components/ChatPalette.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useRenderNode } from '@openuidev/vue-lang'
import { computed, defineComponent } from 'vue'
import { CHAT_CHILD_NAMES } from '../unions'
const props = defineProps<{ props: { children?: unknown; title?: string; icon?: string } }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const renderNode = useRenderNode()
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}
const title = computed(() => str(p.value.title))
const icon = computed(() => str(p.value.icon))
// vue-lang 0.4.x does not enforce union membership for element refs, so drop
// any child that is not a ChatChildUnion member (e.g. Phase A widgets under
// ChatPalette) and any node that is not a component at all.
const children = computed(() => {
  const kids = p.value.children
  if (!Array.isArray(kids)) return kids
  return kids.filter((n) => {
    if (!n || typeof n !== 'object') return false
    const node = n as { type?: unknown; typeName?: unknown }
    if (node.type !== 'element' || typeof node.typeName !== 'string') return false
    return (CHAT_CHILD_NAMES as readonly string[]).includes(node.typeName)
  })
})
const Children = defineComponent({ setup: () => () => renderNode(children.value) })
</script>
<template>
  <UChatPalette>
    <div v-if="title || icon" class="flex items-center gap-2 px-2 py-1 border-b border-muted">
      <UIcon v-if="icon" :name="icon" />
      <span v-if="title" class="text-sm font-semibold">{{ title }}</span>
    </div>
    <Children />
  </UChatPalette>
</template>
