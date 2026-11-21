<script setup lang="ts">
import UInputTime from '@nuxt/ui/components/InputTime.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { parseTime } from '@internationalized/date'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'

const props = defineProps<{ props: { name?: string; label?: string; defaultValue?: string; rules?: import('../rules').Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)

const toTime = (raw?: unknown) => {
  if (typeof raw !== 'string' || !raw) return undefined
  try {
    return parseTime(raw)
  } catch {
    return undefined
  }
}
const modelValue = computed(() => toTime(fieldValue.value))
const pad = (n: number) => String(n).padStart(2, '0')

function onTimeUpdate(value: unknown) {
  const v = value as { hour?: number; minute?: number } | null | undefined
  if (!v || typeof v.hour !== 'number' || typeof v.minute !== 'number') {
    update(undefined)
    return
  }
  update(`${pad(v.hour)}:${pad(v.minute)}`)
}
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <UInputTime :disabled="!inForm" :model-value="modelValue" @update:model-value="onTimeUpdate" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
