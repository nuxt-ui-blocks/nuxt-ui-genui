<script setup lang="ts">
import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'

const props = defineProps<{ props: { name?: string; label?: string; placeholder?: string; options?: string[]; defaultValue?: string; rules?: import('../rules').Rules } }>()
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)
const modelValue = computed(() => (fieldValue.value === undefined || fieldValue.value === null ? undefined : String(fieldValue.value)))
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :label="p?.label" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <USelectMenu :disabled="!inForm" :model-value="modelValue" :items="p?.options ?? []" :placeholder="p?.placeholder" @update:model-value="(v: unknown) => update(v)" />
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
