import type { Library, LibraryJSONSchema } from '@openuidev/lang-core'
import type { GenUIPromptOptions } from './prompt'

/** JSON Schema document produced by `library.toJSONSchema()`. */
export type GenUILibrarySpec = LibraryJSONSchema

/** Library object returned by `createGenUILibrary`: upstream library + stored prompt options. */
export type GenUILibrary = Library<unknown> & { promptOptions?: GenUIPromptOptions }

/** Minimal server-safe library surface consumed by the prompt/chat seams. */
export interface GenUILibraryLike {
  toSpec(): unknown
  promptOptions?: GenUIPromptOptions
}

/** Prompt grouping of component names, keyed by group name. */
export interface GenUIComponentGroup {
  name: string
  components: string[]
  notes?: string[]
}
