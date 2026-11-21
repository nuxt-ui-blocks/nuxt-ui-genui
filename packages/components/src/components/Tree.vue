<script setup lang="ts">
import UTree from '@nuxt/ui/components/Tree.vue'
import { computed, ref } from 'vue'

/** Mirrors the recursive tree shape from the def (children can nest further). */
interface TreeItemShape {
  label: string
  icon?: string
  children?: TreeItemShape[]
}

const props = defineProps<{ props: { items?: TreeItemShape[] } }>()
const p = computed(() => props.props ?? {})
const items = computed(() => (Array.isArray(p.value.items) ? p.value.items : []))
const selected = ref<any>(undefined)
</script>

<template>
  <UTree v-if="items.length" v-model="selected" :items="items as never" class="max-h-72 text-sm" />
</template>
