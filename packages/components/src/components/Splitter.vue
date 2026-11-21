<script setup lang="ts">
import USplitter from '@nuxt/ui/components/Splitter.vue'
import { useRenderNode } from '@openuidev/vue-lang'
import { computed, defineComponent } from 'vue'
import { CHAT_CHILD_NAMES, FORM_FIELD_NAMES } from '../unions'
const props = defineProps<{ props: { children?: unknown; orientation?: 'horizontal' | 'vertical'; autoSaveId?: string; disabled?: boolean } }>()
const renderNode = useRenderNode()
// Keep reactive: the renderer patches this instance in place while the program streams.
const data = computed(() => props.props ?? {})
// vue-lang 0.4.x does not enforce union membership at parse/render time; drop
// chat-root and bare field children that are never legal inside a Splitter panel.
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
const items = computed(() => children.value.map(() => ({})))
// Stable identity per panel: an inline arrow in a slot would unmount/remount the
// subtree on every parent render and destroy focus/drag state.
const Panel = defineComponent({
  props: { index: { type: Number, required: true } },
  setup(panelProps) {
    const child = computed(() => children.value[panelProps.index])
    return () => (child.value ? renderNode(child.value) : null)
  }
})
</script>
<template>
  <USplitter
    :items="items"
    :orientation="data?.orientation ?? 'horizontal'"
    :auto-save-id="data?.autoSaveId"
    :disabled="data?.disabled"
    class="h-64 w-full"
  >
    <template v-for="(_, index) in items" #[`panel-${index}`] :key="index">
      <div class="p-2"><Panel :index="index" /></div>
    </template>
  </USplitter>
</template>
