import { computed, inject, watch, type InjectionKey } from 'vue'
import type { Rules } from './rules'

export interface GenUIFormContext {
  /** Live field values keyed by field name. */
  values: Record<string, unknown>
  setField(name: string, value: unknown): void
  register(name: string, rules?: Rules): void
  /** Drop a field that no longer exists (its name changed) from the form. */
  unregister(name: string): void
}

export const GENUI_FORM_KEY: InjectionKey<GenUIFormContext> = Symbol('genui-form')

/** The part of a field's props the form wiring needs. */
export interface GenUIFieldProps {
  name?: string
  defaultValue?: unknown
  rules?: Rules
}

/**
 * Shared wiring for the field SFCs.
 *
 * `source` must be a getter, never a snapshot: the renderer patches a mounted
 * component's props while a program streams, so a field's name, rules and
 * default value can arrive - or change - after setup. See AGENTS.md
 * ("SFC props contract").
 */
export function useGenUIField(source: () => GenUIFieldProps) {
  const ctx = inject(GENUI_FORM_KEY, null)
  const name = computed(() => source()?.name)
  const rules = computed(() => source()?.rules)
  const defaultValue = computed(() => source()?.defaultValue)
  /** False when the field is rendered outside a Form: such a field is inert. */
  const inForm = computed(() => !!ctx)
  /** The current value of this field, or undefined when it has no value yet. */
  const fieldValue = computed(() => (ctx && name.value ? ctx.values[name.value] : undefined))
  /** True once the form holds a slot for this field (even if it is empty). */
  const hasValue = computed(() => !!ctx && !!name.value && name.value in ctx.values)

  // Names whose default value has already been applied (or whose value the
  // user has already set): a default must never overwrite a real value.
  const settled = new Set<string>()

  watch(
    () => [name.value, rules.value, defaultValue.value] as const,
    (next, prev) => {
      const nextName = next[0]
      const nextRules = next[1]
      const nextDefault = next[2]
      const prevName = prev?.[0]
      if (!ctx) return
      // The renderer can rename a field between chunks: drop the stale
      // registration so it is no longer validated or submitted.
      if (prevName && prevName !== nextName) {
        ctx.unregister(prevName)
        settled.delete(prevName)
      }
      if (!nextName) return
      ctx.register(nextName, nextRules)
      if (settled.has(nextName)) return
      // The form already holds a slot for this field (possibly an emptied
      // one): never overwrite it with the default value.
      if (nextName in ctx.values) {
        settled.add(nextName)
        return
      }
      if (nextDefault !== undefined) {
        ctx.setField(nextName, nextDefault)
        settled.add(nextName)
      }
    },
    { immediate: true }
  )

  const update = (value: unknown) => {
    const n = name.value
    if (!ctx || !n) return
    ctx.setField(n, value)
  }

  return { ctx, name, rules, defaultValue, inForm, fieldValue, hasValue, update }
}
