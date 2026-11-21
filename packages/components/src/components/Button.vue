<script setup lang="ts">
import { computed } from 'vue'
import UButton from '@nuxt/ui/components/Button.vue'
import { BuiltinActionType, useIsStreaming, useTriggerAction } from '@openuidev/vue-lang'
import { hasAllProps } from '../helpers'
import { actionSchema } from '../action'
const props = defineProps<{ props: { label?: string; action?: { type?: string; url?: string; context?: string; params?: Record<string, unknown>; steps?: unknown[] }; variant?: 'solid' | 'soft' | 'outline' | 'ghost' } }>()
const triggerAction = useTriggerAction()
const isStreaming = useIsStreaming()
// Reactive on purpose: the renderer patches this instance in place while the program streams.
const p = computed(() => props.props ?? {})
function onClick() {
  const action = p.value.action
  // An Action([@Set($x, y)]) plan reaches the component evaluated as { steps: [...] }.
  // vue-lang executes the plan itself - it must be forwarded intact, never flattened.
  if (action && Array.isArray(action.steps) && action.steps.length > 0) {
    triggerAction(p.value.label ?? '', undefined, action as never)
    return
  }
  const plain = action ?? { type: BuiltinActionType.ContinueConversation }
  // Vue-lang does not enforce the actionSchema at render or parse time; a model
  // can emit an action whose builtin type carries no payload (open_url without
  // url, continue_conversation is fine without one). Validate only this plain
  // path — Action-plans are forwarded intact above — so unactionable builtins
  // never reach the host.
  const parsed = actionSchema.safeParse(plain)
  if (!parsed.success || !parsed.data) {
    console.warn('[genui] dropping invalid action on Button', parsed.success ? '' : parsed.error.issues[0]?.message)
    return
  }
  const params = {
    ...('url' in parsed.data ? { url: parsed.data.url as string } : {}),
    ...('context' in parsed.data ? { context: parsed.data.context as string } : {}),
    ...('params' in parsed.data ? { ...(parsed.data.params as Record<string, unknown>) } : {})
  }
  // Always hand the action to the host. <NuxtGenUI> owns opening external URLs
  // (it checks the scheme), so the host's onAction sees every valid action exactly once.
  const data = parsed.data as { type?: string | undefined; url?: string; context?: string; params?: Record<string, unknown> }
  triggerAction(p.value.label ?? '', undefined, { type: data.type ?? BuiltinActionType.ContinueConversation, params } as never)
}
</script>
<template>
  <UButton v-if="hasAllProps(p, 'label')" :variant="p.variant ?? 'solid'" :disabled="isStreaming" @click="onClick">{{ p.label }}</UButton>
</template>
