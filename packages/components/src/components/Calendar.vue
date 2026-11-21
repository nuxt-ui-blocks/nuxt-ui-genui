<script setup lang="ts">
import UCalendar from '@nuxt/ui/components/Calendar.vue'
import { parseDate } from '@internationalized/date'
import { computed, ref, watch } from 'vue'
import type { z } from 'zod/v4'
import type { CalendarDef } from '../defs'

type Props = z.infer<typeof CalendarDef.props>
const props = defineProps<{ props: Props }>()
const p = computed(() => props.props ?? {})

const toDate = (iso?: string) => {
  if (!iso) return undefined
  try {
    return parseDate(iso)
  } catch {
    return undefined
  }
}
const selected = ref<any>(toDate(p.value.defaultValue))
const min = computed(() => toDate(p.value.min))
const max = computed(() => toDate(p.value.max))
watch(() => p.value.defaultValue, (v) => { selected.value = toDate(v) })
</script>

<template>
  <div class="space-y-1">
    <p v-if="p?.label" class="text-sm font-medium">{{ p.label }}</p>
    <UCalendar v-model="selected" :min-value="min" :max-value="max" />
    <p v-if="selected" class="text-xs text-muted">Selected: <span class="font-mono">{{ String(selected) }}</span></p>
  </div>
</template>
