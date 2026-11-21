<script setup lang="ts">
import UInputDate from '@nuxt/ui/components/InputDate.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { parseDate } from '@internationalized/date'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'

const props = defineProps<{ props: { name?: string; label?: string; min?: string; max?: string; defaultValue?: string; rules?: import('../rules').Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)

const toDate = (iso?: unknown) => {
  if (typeof iso !== 'string' || !iso) return undefined
  try {
    return parseDate(iso)
  } catch {
    return undefined
  }
}
const modelValue = computed(() => toDate(fieldValue.value))
const min = computed(() => toDate(p.value.min))
const max = computed(() => toDate(p.value.max))
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <UInputDate :disabled="!inForm" :model-value="modelValue" :min-value="min" :max-value="max" @update:model-value="(v: unknown) => update(v ? String(v) : undefined)" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
