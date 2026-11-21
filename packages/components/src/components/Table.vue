<script setup lang="ts">
import UTable from '@nuxt/ui/components/Table.vue'
import { computed } from 'vue'
import type { z } from 'zod/v4'
import type { TableDef } from '../defs'

type Props = z.infer<typeof TableDef.props>
const props = defineProps<{ props: Props }>()
const p = computed(() => props.props ?? {})
const columns = computed(() => (Array.isArray(p.value.columns) ? p.value.columns : []).map((c) => ({ accessorKey: c.accessorKey, header: c.header })))
const rows = computed(() => (Array.isArray(p.value.rows) ? p.value.rows : []))
</script>

<template>
  <UTable
    v-if="columns.length && rows.length"
    :data="rows"
    :columns="columns as never"
    :class="['text-sm', { 'genui-striped-table': p?.striped }]"
  />
</template>

<style>
.genui-striped-table tbody tr:nth-child(even) {
  background-color: color-mix(in srgb, var(--ui-bg-elevated) 50%, transparent);
}
</style>
