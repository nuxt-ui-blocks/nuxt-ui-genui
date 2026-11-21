<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'
import type { Rules } from '../rules'

const props = defineProps<{ props: { name?: string; label?: string; defaultValue?: boolean; rules?: Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => Boolean(fieldValue.value ?? false))
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <UCheckbox :disabled="!inForm" :model-value="modelValue" :label="p?.label" @update:model-value="(v: boolean | 'indeterminate') => update(v === true)" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
