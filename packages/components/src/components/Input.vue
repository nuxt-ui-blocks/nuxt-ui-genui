<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'
import type { Rules } from '../rules'

const props = defineProps<{ props: { name?: string; label?: string; placeholder?: string; defaultValue?: string; rules?: Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => String(fieldValue.value ?? ''))
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <UInput :disabled="!inForm" :model-value="modelValue" :placeholder="p?.placeholder" @update:model-value="(v: string | number) => update(v)" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
