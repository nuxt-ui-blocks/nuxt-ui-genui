import { generateSystemPrompt } from '@openuidev/lang-core'
import type { GenUILibraryLike } from './types'

/**
 * A tool the model may call through `Query()`/`Mutation()`. `inputSchema` /
 * `outputSchema` are JSON Schema objects, so a host can hand over the schema of
 * an AI SDK / MCP / plain-Zod tool by converting it (`z.toJSONSchema`, or the
 * tool's own JSON Schema) rather than inventing a second shape. Both schemas
 * are optional as a host convenience (a bare name/description tool is valid);
 * this is a superset of lang-core's `ToolSpec`, which requires both.
 */
export interface GenUIToolSpec {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean }
}

export interface GenUIPromptOptions {
  examples?: string[]
  additionalRules?: string[]
  preamble?: string
  cloud?: boolean
  /**
   * Tool-specific examples (Query/Mutation patterns). When present, these are
   * included alongside `examples`. Hidden on the Cloud wire.
   */
  toolExamples?: string[]
  /** Set `true` to enable edit-mode instructions in the prompt. */
  editMode?: boolean
  /** Set `true` to enable inline mode (text plus an optional openui-lang fence). */
  inlineMode?: boolean
  /**
   * Tool definitions handed to the OpenUI Lang prompt generator, as
   * Either a bare tool name or a `{ name, description?, inputSchema?,
   * outputSchema?, annotations? }` object. These are what teach the model to
   * call `Query()`/`Mutation()` against your `toolProvider`. Schemas are JSON
   * Schema — convert Zod with `z.toJSONSchema` at the call site.
   */
  tools?: readonly (string | GenUIToolSpec)[]
  /** Set `false` to hide the query/mutation documentation even with tools. */
  toolCalls?: boolean
  /** Set `false` to hide the `$variable` / `@Run` documentation. */
  bindings?: boolean
}

/**
 * Build the OpenUI Lang system prompt for a library.
 *
 * Stored `promptOptions` (set on the library via `createGenUILibrary`) are
 * shallowly merged with the explicit `options` argument; explicit values win.
 * Array fields such as `examples` are REPLACED, not concatenated, so passing
 * `examples: ['one']` discards any stored examples. `cloud` is stripped from
 * the options for the local path and removed from the library spec on the
 * cloud path (the Cloud prompt generator rejects it in both places).
 */
export function generateGenUISystemPrompt(
  library: GenUILibraryLike,
  options: GenUIPromptOptions = {}
): string {
  const spec = library.toSpec() as Record<string, unknown>
  // `createGenUILibrary` stashes `promptOptions` on the returned library object;
  // the renderer's `toSpec()` does not carry them. Merge stored options with the
  // explicit options argument (explicit wins) so a stored config is not silently dropped.
  const stored = (library as { promptOptions?: GenUIPromptOptions }).promptOptions ?? {}
  const { cloud, ...promptOptions } = { ...stored, ...options }
  if (cloud) {
    // Cloud rejects promptOptions inside the library spec; strip them there.
    const { promptOptions: _drop, ...cloudLibrary } = spec as { promptOptions?: unknown }
    return generateSystemPrompt({ cloud: true, library: cloudLibrary as never, promptOptions: promptOptions as never })
  }
  return generateSystemPrompt({ library: spec as never, promptOptions: promptOptions as never })
}
