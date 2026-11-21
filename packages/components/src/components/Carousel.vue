<script setup lang="ts">
import UCarousel from '@nuxt/ui/components/Carousel.vue'
import { useRenderNode } from '@openuidev/vue-lang'
import { computed, defineComponent, type PropType } from 'vue'
import { CHAT_CHILD_NAMES, FORM_FIELD_NAMES } from '../unions'
const props = defineProps<{ props: { children?: unknown; arrows?: boolean; dots?: boolean; loop?: boolean; orientation?: string; slidesToScroll?: number } }>()
const renderNode = useRenderNode()
// Keep reactive: the renderer patches this instance in place while the program
// streams, so a setup-time snapshot freezes an empty children array.
const data = computed(() => props.props ?? {})
// vue-lang 0.4.x does not enforce union membership at parse/render time; drop
// chat-root and bare field children that are never legal under Carousel.
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
// Carousel requires one item per slide; slide content is the element itself, so
// items carry no data — only an empty object to satisfy item.ui/class reads.
const items = computed(() => children.value.map(() => ({})))
const arrows = computed(() => data.value?.arrows !== false)
const dots = computed(() => data.value?.dots !== false)
// Stable identity: an inline arrow in the slot would unmount/remount the
// subtree on every parent render and destroy focus.
const Slide = defineComponent({
  props: { index: { type: Number, required: true } },
  setup(slideProps) {
    const child = computed(() => children.value[slideProps.index])
    return () => (child.value ? renderNode(child.value) : null)
  }
})
</script>
<template>
  <UCarousel
    :items="items"
    :orientation="data?.orientation ?? 'horizontal'"
    :loop="data?.loop"
    :slides-to-scroll="data?.slidesToScroll"
    :arrows="arrows"
    :dots="dots"
    class="w-full"
  >
    <template #default="{ index }">
      <div class="px-1 py-1"><Slide :index="index" /></div>
    </template>
  </UCarousel>
</template>
