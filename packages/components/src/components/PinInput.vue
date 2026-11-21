<script setup lang="ts">
import UPinInput from '@nuxt/ui/components/PinInput.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'

const props = defineProps<{ props: { name?: string; label?: string; length?: number; mask?: boolean; defaultValue?: string; rules?: import('../rules').Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => String(fieldValue.value ?? '').split(''))
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <UPinInput :disabled="!inForm" :model-value="modelValue" :length="p?.length ?? 4" :mask="p?.mask" @update:model-value="(v: unknown) => update(Array.isArray(v) ? v.map(String).join('') : String(v))" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
