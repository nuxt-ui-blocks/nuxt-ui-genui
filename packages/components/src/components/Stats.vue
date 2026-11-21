<script setup lang="ts">
import { useRenderNode } from '@openuidev/vue-lang'
import { computed, defineComponent } from 'vue'
import type { z } from 'zod/v4'
import type { StatsDef } from '../defs'

type Props = z.infer<typeof StatsDef.props>
const props = defineProps<{ props: Props }>()
const renderNode = useRenderNode()
// Reactive on purpose: containers are patched in place while the program streams.
const data = computed(() => props.props ?? {})
// vue-lang 0.4.x does not enforce union membership, so keep only the card
// children this container accepts (StatsCard) and drop anything else - a node
// that is not a component (plain text) has no place in a card grid.
const children = computed(() => {
  const kids = data.value?.children
  if (!Array.isArray(kids)) return kids
  return kids.filter((n) => {
    if (!n || typeof n !== 'object') return false
    const node = n as { type?: unknown; typeName?: unknown }
    if (node.type !== 'element' || typeof node.typeName !== 'string') return false
    return node.typeName === 'StatsCard'
  })
})
const Children = defineComponent({ setup: () => () => renderNode(children.value) })
</script>
<template>
  <!-- Container query so the grid responds to the card width, not the viewport. -->
  <div class="@container">
    <div class="grid grid-cols-2 gap-3 @lg:grid-cols-4">
      <Children />
    </div>
  </div>
</template>
