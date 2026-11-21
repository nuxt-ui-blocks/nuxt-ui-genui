<script setup lang="ts">
import UInputRating from '@nuxt/ui/components/InputRating.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed, watchEffect } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'

const props = defineProps<{ props: { name?: string; label?: string; max?: number; defaultValue?: number; rules?: import('../rules').Rules } }>()
const p = computed(() => props.props ?? {})
const { name, fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => {
  const raw = fieldValue.value
  if (typeof raw === 'number') return raw
  if (raw !== undefined && raw !== null && raw !== '' && Number.isFinite(Number(raw))) return Number(raw)
  return 0
})
// The visible rating (0 stars) must also be the submitted value.
watchEffect(() => {
  if (!inForm.value || !name.value) return
  if (fieldValue.value === undefined) update(0)
})
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <UInputRating :disabled="!inForm" :model-value="modelValue" :length="p?.max ?? 5" @update:model-value="(v: unknown) => update(Number(v))" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
