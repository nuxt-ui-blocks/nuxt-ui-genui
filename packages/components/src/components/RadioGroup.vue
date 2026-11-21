<script setup lang="ts">
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'
import type { Rules } from '../rules'

const props = defineProps<{ props: { name?: string; label?: string; options?: string[]; defaultValue?: string; rules?: Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => {
  const raw = fieldValue.value
  return raw === undefined || raw === null ? undefined : String(raw)
})
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <URadioGroup :disabled="!inForm" :model-value="modelValue" :items="p?.options ?? []" @update:model-value="(v: unknown) => update(v)" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
