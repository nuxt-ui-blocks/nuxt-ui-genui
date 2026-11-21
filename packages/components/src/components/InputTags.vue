<script setup lang="ts">
import UInputTags from '@nuxt/ui/components/InputTags.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'

const props = defineProps<{ props: { name?: string; label?: string; placeholder?: string; max?: number; defaultValue?: string[]; rules?: import('../rules').Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => {
  const raw = fieldValue.value
  return Array.isArray(raw) ? raw.map(String) : []
})
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <UInputTags :disabled="!inForm" :model-value="modelValue" :placeholder="p?.placeholder" :max="p?.max" @update:model-value="(v: unknown) => update(Array.isArray(v) ? v.map(String) : [])" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
