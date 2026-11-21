import type { Component } from 'vue'
import { createGenUILibrary, defineGenUIComponent, GenUILibraryError, type GenUIComponentGroup, type GenUIPromptOptions } from '@nuxt-ui-genui/core'
import { ALL_DEFS, CARD_CHILD_DEFS, createCardDef } from './defs'

export * from './defs'
export { ContentChildUnion, CardChildUnion, ChatChildUnion, FormChildUnion, CONTENT_CHILD_NAMES, CARD_CHILD_NAMES, CHAT_CHILD_NAMES, FORM_FIELD_NAMES } from './unions'
export { actionSchema, type GenUIAction } from './action'
export { rulesSchema, type Rules } from './rules'
export { hasAllProps, asArray } from './helpers'
export { provideGenUIContainerChildren, useGenUIContainerChildren, type GenUIContainerChildren } from './container-context'

export type GenUIComponentDef = ReturnType<typeof defineGenUIComponent>

/** Names of the built-in component definitions. */
export type GenUIComponentName = (typeof ALL_DEFS)[number]['name']

export interface CreateLibraryOptions {
  root?: string
  componentGroups?: GenUIComponentGroup[]
  promptOptions?: GenUIPromptOptions
  /**
   * Component names to include. Defaults to every built-in definition.
   * Names may refer to a built-in or to an entry in `extraComponents`.
   */
  components?: readonly GenUIComponentName[]
  /** Custom definitions appended after the selected built-ins. */
  extraComponents?: readonly GenUIComponentDef[]
  /**
   * Custom components that Card may render as children. They are also added to
   * Card's Zod union, so the generated prompt and JSON Schema advertise them.
   */
  extraCardChildren?: readonly GenUIComponentDef[]
  /** Map of component NAME -> Vue SFC. Omit on the server. */
  renderers?: Partial<Record<GenUIComponentName | (string & {}), Component>>
}

function nameOf(def: GenUIComponentDef): string {
  return (def as never as { name: string }).name
}

export function createNuxtUILibrary(options: CreateLibraryOptions = {}) {
  const {
    root = 'Card',
    componentGroups,
    promptOptions,
    renderers = {},
    components,
    extraComponents = [],
    extraCardChildren = []
  } = options

  const available = [...ALL_DEFS, ...extraComponents]

  const selected = components
    ? components.map((name) => {
        const def = available.find((candidate) => nameOf(candidate) === name)
        if (!def) {
          throw new GenUILibraryError('UNKNOWN_COMPONENT', `Unknown component "${name}".`)
        }
        return def
      })
    : [...ALL_DEFS]

  // Card's Zod union must match the library the model was given: keep only the
  // selected built-in children, then append the host's extra Card children.
  // Otherwise a subset library still advertises every built-in name in Card's
  // signature, and extra components stay invisible to the prompt/JSON Schema.
  const selectedNames = new Set(selected.map(nameOf))
  const baseChildren = components
    ? CARD_CHILD_DEFS.filter((def) => selectedNames.has(def.name))
    : CARD_CHILD_DEFS
  const resolved = components || extraCardChildren.length
    ? selected.map((def) => (nameOf(def) === 'Card' ? createCardDef(extraCardChildren, baseChildren) : def))
    : selected

  const withRenderers = [...resolved, ...extraComponents].map((def) => {
    const renderer = renderers[nameOf(def)]
    // Copy the definition before attaching a client renderer — never mutate the shared ALL_DEFS objects.
    return renderer ? { ...(def as object), component: renderer } as never : def
  })

  return createGenUILibrary({ components: withRenderers, root, componentGroups, promptOptions })
}
