<script setup lang="ts">
import USlider from '@nuxt/ui/components/Slider.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed, watchEffect } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'

const props = defineProps<{ props: { name?: string; label?: string; min?: number; max?: number; step?: number; defaultValue?: number; rules?: import('../rules').Rules } }>()
const p = computed(() => props.props ?? {})
const { name, fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => {
  const raw = fieldValue.value
  if (typeof raw === 'number') return raw
  if (raw !== undefined && raw !== null && raw !== '' && Number.isFinite(Number(raw))) return Number(raw)
  return p.value.min ?? 0
})
// Whatever the control displays must also be the submitted value, otherwise the
// slider shows `min` while the payload carries nothing for this field.
watchEffect(() => {
  if (!inForm.value || !name.value) return
  if (fieldValue.value === undefined) update(p.value.min ?? 0)
})
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <template #label><span v-if="p?.label">{{ p.label }}: {{ modelValue }}</span></template>
    <USlider :disabled="!inForm" :model-value="modelValue" :min="p?.min ?? 0" :max="p?.max ?? 100" :step="p?.step ?? 1" @update:model-value="(v: unknown) => update(Array.isArray(v) ? v[0] : v)" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
