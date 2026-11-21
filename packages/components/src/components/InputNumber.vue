<script setup lang="ts">
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'
import type { Rules } from '../rules'

const props = defineProps<{ props: { name?: string; label?: string; placeholder?: string; defaultValue?: number; min?: number; max?: number; step?: number; rules?: Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, hasValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => {
  const raw = fieldValue.value
  // Once the form holds a slot for this field the context is the source of
  // truth: a cleared value must stay cleared instead of snapping back to
  // defaultValue.
  if (hasValue.value) {
    if (raw === undefined || raw === null || raw === '') return undefined
    const n = Number(raw)
    return Number.isNaN(n) ? undefined : n
  }
  const d = p.value.defaultValue
  return d === undefined || Number.isNaN(Number(d)) ? undefined : Number(d)
})
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <UInputNumber :disabled="!inForm" :model-value="modelValue" :min="p?.min" :max="p?.max" :step="p?.step" :placeholder="p?.placeholder" @update:model-value="(v: string | number | null | undefined) => update(v === undefined || v === null ? undefined : Number(v))" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
