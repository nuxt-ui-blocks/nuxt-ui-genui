<script setup lang="ts">
import { useRenderNode } from '@openuidev/vue-lang'
import { computed, defineComponent } from 'vue'
const props = defineProps<{ props: { children?: unknown } }>()
const renderNode = useRenderNode()
// Reactive on purpose: containers are patched in place while the program streams.
const data = computed(() => props.props ?? {})
// vue-lang 0.4.x does not enforce union membership, so keep only the button
// children this container accepts (Button) and drop anything else - a node that
// is not a component (plain text) has no place in a button row.
const children = computed(() => {
  const kids = data.value?.children
  if (!Array.isArray(kids)) return kids
  return kids.filter((n) => {
    if (!n || typeof n !== 'object') return false
    const node = n as { type?: unknown; typeName?: unknown }
    if (node.type !== 'element' || typeof node.typeName !== 'string') return false
    return node.typeName === 'Button'
  })
})
const Children = defineComponent({ setup: () => () => renderNode(children.value) })
</script>
<template>
  <div class="flex flex-wrap items-center gap-2">
    <Children />
  </div>
</template>
