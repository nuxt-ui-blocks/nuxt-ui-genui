<script setup lang="ts">
import UListbox from '@nuxt/ui/components/Listbox.vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{ props: { label?: string; items?: string[]; multiple?: boolean } }>()
const p = computed(() => props.props ?? {})
const items = computed(() => (Array.isArray(p.value.items) ? p.value.items : []).slice(0, 100).map((s) => ({ label: String(s), value: String(s) })))
const multiple = computed(() => Boolean(p.value.multiple))
const selected = ref<any>(multiple.value ? [] : undefined)
watch(multiple, (v) => { selected.value = v ? [] : undefined })
</script>

<template>
  <div class="space-y-1">
    <p v-if="p?.label" class="text-sm font-medium">{{ p.label }}</p>
    <UListbox v-if="items.length" v-model="selected" :items="items as never" :multiple="multiple" />
  </div>
</template>
