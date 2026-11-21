<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UForm from '@nuxt/ui/components/Form.vue'
import { useIsStreaming, useSetFieldValue, useTriggerAction } from '@openuidev/vue-lang'
import { computed, onBeforeUnmount, provide, reactive, ref, watch, useTemplateRef, defineComponent } from 'vue'
import { useRenderNode } from '@openuidev/vue-lang'
import { createGenUIStandardSchema } from '../form-schema'
import { FORM_FIELD_NAMES } from '../unions'
import { GENUI_FORM_KEY, type GenUIFormContext } from '../form-context'
import type { Rules } from '../rules'
import { hasAllProps } from '../helpers'

const props = defineProps<{ props: { formId?: string; title?: string; submitLabel?: string; children?: unknown } }>()
const p = computed(() => props.props ?? {})
const renderNode = useRenderNode()
const triggerAction = useTriggerAction()
const setFieldValue = useSetFieldValue()
const isStreaming = useIsStreaming()
const formRef = useTemplateRef<{ clear(name?: string | string[]): void } | null>('formRef')
/** Nuxt UI eagerly shows schema errors; only enable them after a submit attempt. */
const submittedOnce = ref(false)

const values = reactive<Record<string, unknown>>({})
const rules = new Map<string, Rules | undefined>()

/** Drop a field from the visible Nuxt UI error state. */
function clearFieldError(name: string) {
  formRef.value?.clear(name)
}

const mirrored = new Map<string, string>()

/** The current form id, or undefined while the program is still streaming. */
function currentFormId(): string | undefined {
  const formId = p.value.formId
  return typeof formId === 'string' && formId ? formId : undefined
}

/** Drop a field from the renderer store so it cannot travel with the action. */
function forgetInStore(name: string) {
  const formId = mirrored.get(name)
  if (!formId) return
  mirrored.delete(name)
  setFieldValue(formId, 'Form', name, undefined)
}

// Keep only field components — vue-lang 0.4.x will not enforce FormChildUnion membership.
const children = computed(() => {
  const kids = p.value.children
  if (!Array.isArray(kids)) return kids
  return kids.filter((n) => {
    if (!n || typeof n !== 'object') return false
    const node = n as { type?: unknown; typeName?: unknown }
    if (node.type !== 'element' || typeof node.typeName !== 'string') return false
    return (FORM_FIELD_NAMES as readonly string[]).includes(node.typeName)
  })
})

/**
 * The names of the fields that belong to this form right now.
 *
 * A form instance is reused by the renderer: it can be pointed at another
 * program (another `formId`) or given different children. Values and rules of
 * fields that are no longer children are stale, so they are neither validated
 * nor submitted.
 */
const fieldNames = computed(() => {
  const kids = children.value
  if (!Array.isArray(kids)) return [] as string[]
  const names: string[] = []
  for (const node of kids) {
    const name = (node as { props?: { name?: unknown } })?.props?.name
    if (typeof name === 'string' && name) names.push(name)
  }
  return names
})
// Stable identity: an inline arrow in :is would force Vue to remount the
// subtree on every patch and drop focus from the active field.
const Children = defineComponent({ setup: () => () => renderNode(children.value) })

const schema = createGenUIStandardSchema({
  fieldNames: () => fieldNames.value,
  rules
})

provide<GenUIFormContext>(GENUI_FORM_KEY, {
  values,
  setField(name, value) {
    values[name] = value
    // Deliberately NOT mirrored into the renderer store here: that store is
    // reactive and subscribed components re-render on every call, so writing
    // on each keystroke remounts the field (losing focus) and shifts layout.
    // The store is populated at submit time only (see onSubmit).
  },
  register(name, r) {
    rules.set(name, r)
  },
  unregister(name) {
    rules.delete(name)
    delete values[name]
    clearFieldError(name)
    forgetInStore(name)
  }
})

// A field that is no longer a child of this form must not travel with the
// submission - neither in the payload nor in the form state of the action.
watch(fieldNames, (names) => {
  const current = new Set(names)
  for (const name of [...mirrored.keys()]) {
    if (!current.has(name)) {
      clearFieldError(name)
      forgetInStore(name)
    }
  }
})

// When the renderer replaces this form (a new program for the same slot), the
// mirrored values of the old form must not stay in the renderer store: the
// form state of a later action is built from that store.
onBeforeUnmount(() => {
  for (const name of [...mirrored.keys()]) forgetInStore(name)
})

function onSubmit() {
  if (!hasAllProps(p.value as Record<string, unknown>, 'formId')) return
  const formId = p.value.formId as string
  // Only the current fields are submitted: a value of a field that is no
  // longer part of this form must not travel with the payload.
  const submitted: Record<string, unknown> = {}
  for (const name of fieldNames.value) {
    if (name in values) submitted[name] = values[name]
  }
  // Populate the renderer store only at submit time so the action's
  // formState is complete; store writes notify subscribers, so doing this per
  // keystroke re-renders (and remounts) the whole card.
  for (const name of [...mirrored.keys()]) {
    if (!fieldNames.value.includes(name) || mirrored.get(name) !== formId) forgetInStore(name)
  }
  for (const name of fieldNames.value) {
    if (name in values) {
      setFieldValue(formId, 'Form', name, values[name])
      mirrored.set(name, formId)
    }
  }
  // Pass formId as the form name so the ActionEvent carries `formName` and a
  // scoped `formState`. Without it the event has no form identity and formState
  // falls back to the renderer's whole (usually empty) snapshot.
  triggerAction(p.value.submitLabel ?? 'Submit', formId, { type: 'submit_form', params: { formId, values: submitted } })
}

function onValidationError() {
  submittedOnce.value = true
}
</script>

<template>
  <UForm
    v-if="p?.formId"
    ref="formRef"
    :state="values"
    :schema="schema"
    :transform="false"
    :validate-on="submittedOnce ? ['input', 'blur', 'change'] : []"
    :validate-on-input-delay="0"
    class="space-y-4"
    novalidate
    @submit="onSubmit"
    @error="onValidationError"
  >
    <h3 v-if="p?.title" class="text-base font-semibold">{{ p.title }}</h3>
    <Children />
    <UButton type="submit" :disabled="isStreaming">{{ p?.submitLabel ?? 'Submit' }}</UButton>
  </UForm>
</template>
