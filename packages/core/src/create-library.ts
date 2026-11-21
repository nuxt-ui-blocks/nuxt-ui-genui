import { createLibrary } from '@openuidev/lang-core'
import { GenUILibraryError } from './errors'
import type { GenUIPromptOptions } from './prompt'
import type { GenUIComponentGroup, GenUILibrary } from './types'

export interface GenUILibraryConfig {
  components: Array<ReturnType<typeof import('./define-component').defineGenUIComponent>>
  root: string
  componentGroups?: GenUIComponentGroup[]
  promptOptions?: GenUIPromptOptions
}

export function createGenUILibrary(config: GenUILibraryConfig): GenUILibrary {
  const names = new Set<string>()
  for (const c of config.components) {
    const name = (c as never as { name: string }).name
    if (names.has(name)) throw new GenUILibraryError('DUPLICATE_COMPONENT', 'Duplicate component: ' + name)
    if (name.startsWith('@')) {
      throw new GenUILibraryError('RESERVED_NAME', 'Component "' + name + '" uses the reserved OpenUI builtin prefix "@".')
    }
    names.add(name)
  }
  if (!names.has(config.root)) {
    throw new GenUILibraryError('INVALID_ROOT', `Root component "${config.root}" is not registered in components.`)
  }
  const library = createLibrary({
    components: config.components as never,
    root: config.root,
    componentGroups: config.componentGroups as never
  })
  return Object.assign(library, { promptOptions: config.promptOptions })
}
