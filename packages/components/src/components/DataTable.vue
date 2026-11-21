<script setup lang="ts">
import { computed } from 'vue'
import type { z } from 'zod/v4'
import type { DataTableDef } from '../defs'

type Props = z.infer<typeof DataTableDef.props>
const props = defineProps<{ props: Props }>()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
const columns = computed(() => p.value.columns ?? [])
const rows = computed(() => p.value.rows ?? [])
const ready = computed(() => {
  const cols = p.value.columns
  return Array.isArray(cols) && cols.length > 0 && Array.isArray(p.value.rows)
})

function alignClass(align?: 'left' | 'center' | 'right') {
  return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
}
</script>
<template>
  <table v-if="ready" class="w-full text-sm">
    <thead>
      <tr>
        <th v-for="c in columns" :key="c.key" class="font-medium border-b pb-2" :class="alignClass(c.align)">{{ c.label }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in rows" :key="i" class="border-b last:border-0" :class="p.striped && i % 2 === 1 ? 'bg-elevated/50' : ''">
        <td v-for="(c, ci) in columns" :key="c.key" class="py-2" :class="alignClass(c.align)">{{ row[ci] }}</td>
      </tr>
    </tbody>
  </table>
</template>
