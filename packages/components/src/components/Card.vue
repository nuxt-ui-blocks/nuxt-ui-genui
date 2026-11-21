<script setup lang="ts">
import UCard from '@nuxt/ui/components/Card.vue'
import { useRenderNode } from '@openuidev/vue-lang'
import { computed, defineComponent } from 'vue'
import { CARD_CHILD_NAMES } from '../unions'
import { useGenUIContainerChildren } from '../container-context'
const props = defineProps<{ props: { title?: string; children?: unknown } }>()
const renderNode = useRenderNode()
// Must stay reactive: the renderer patches this instance in place while the
// program streams, so a snapshot of props.props would freeze the first (often
// empty) children array and never render the final nodes.
const data = computed(() => props.props ?? {})
// vue-lang 0.4.x does not enforce union membership for element refs, so drop
// element children that are not legal under Card. The host may extend the list
// (e.g. a custom component registered as a Card child) through the renderer.
const allowed = useGenUIContainerChildren('Card', CARD_CHILD_NAMES)
const children = computed(() => {
  const kids = data.value?.children
  if (!Array.isArray(kids)) return kids
  return kids.filter((n) => {
    if (!n || typeof n !== 'object') return true
    const node = n as { type?: unknown; typeName?: unknown }
    if (node.type !== 'element' || typeof node.typeName !== 'string') return true
    return allowed.includes(node.typeName)
  })
})
// Stable identity: an inline arrow passed to :is would unmount/remount the
// subtree on every parent render and destroy focus.
const Children = defineComponent({ setup: () => () => renderNode(children.value) })
</script>
<template>
  <UCard>
    <template v-if="data?.title" #header><div class="font-semibold">{{ data.title }}</div></template>
    <div class="space-y-3"><Children /></div>
  </UCard>
</template>
