import { parseStructuredRules, validate as validateValue, type ValidatorFn } from '@openuidev/lang-core'
import type { Rules } from './rules'

export interface GenUIStandardSchemaIssue {
  message: string
  path: [string]
}

export type GenUIStandardSchemaResult =
  | { value: Record<string, unknown> }
  | { issues: readonly GenUIStandardSchemaIssue[] }

export interface GenUIStandardSchema {
  readonly '~standard': {
    readonly version: 1
    readonly vendor: '@nuxt-ui-genui/components'
    validate: (value: unknown) => GenUIStandardSchemaResult
  }
}

/** Preserve our unchecked-checkbox contract on top of lang-core's validators. */
const requiredValidator: ValidatorFn = (value) =>
  value === false || validateValue(value, [{ type: 'required' }]) ? 'Required' : undefined

export interface GenUIStandardSchemaOptions {
  /** Current child field names. Stale registered fields are never validated. */
  fieldNames: () => readonly string[]
  /** Live rules map owned by the enclosing form instance. */
  rules: Map<string, Rules | undefined>
}

/**
 * Adapt the model's declarative field rules to Standard Schema so Nuxt UI's
 * Form/FormField can orchestrate validation and error display without
 * duplicating lang-core's validators or semantics.
 */
export function createGenUIStandardSchema(options: GenUIStandardSchemaOptions): GenUIStandardSchema {
  return {
    '~standard': {
      version: 1,
      vendor: '@nuxt-ui-genui/components',
      validate(value) {
        const state = value && typeof value === 'object' ? value as Record<string, unknown> : {}
        const issues: GenUIStandardSchemaIssue[] = []

        for (const name of options.fieldNames()) {
          const rules = options.rules.get(name)
          if (!rules) continue

          let message: string | undefined
          try {
            message = validateValue(state[name], parseStructuredRules(rules), { required: requiredValidator })
          } catch (error) {
            // Rules are model-authored. A malformed rule must not brick the submit path.
            console.warn(`[genui] ignoring invalid rules for field "${name}"`, error)
            continue
          }

          if (message) issues.push({ message, path: [name] })
        }

        return issues.length ? { issues } : { value: state }
      }
    }
  }
}
