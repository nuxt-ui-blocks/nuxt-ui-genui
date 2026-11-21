<script setup lang="ts">
import UColorPicker from '@nuxt/ui/components/ColorPicker.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed, watchEffect } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'

const props = defineProps<{ props: { name?: string; label?: string; defaultValue?: string; rules?: import('../rules').Rules } }>()
const p = computed(() => props.props ?? {})
const { name, fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => String(fieldValue.value ?? '#22c55e'))
// The colour the control displays must also be the submitted value.
watchEffect(() => {
  if (!inForm.value || !name.value) return
  if (fieldValue.value === undefined) update('#22c55e')
})
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <template #label><span v-if="p?.label">{{ p.label }}: <span class="font-mono">{{ modelValue }}</span></span></template>
    <UColorPicker :disabled="!inForm" :model-value="modelValue" @update:model-value="(v: unknown) => { if (typeof v === 'string') update(v) }" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
