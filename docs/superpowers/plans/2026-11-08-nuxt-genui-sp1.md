# SP1: Monorepo Skeleton + Library Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the full `@nuxt-ui-genui/*` pnpm monorepo (all packages with real build/exports wiring on day one) and ship the first vertical slice: a stock-OpenUI-Vue-backed generative UI library for Nuxt 4 + Nuxt UI 4, with the built-in registry, custom developer component registration, a deterministic demo playground, and green build/typecheck/test.

**Architecture:** pnpm workspaces (git initialized 2026-11-08). `apps/playground` (Nuxt 4, `ssr: false`) + `packages/{core,components,nuxt,chat,ai-sdk}`. `packages/core` = server-safe registry contracts/prompt generation/thin OpenUI adapter (no Vue imports). `packages/components` = source-only built-in Nuxt UI 4-backed definitions + SFCs (single `props` object prop; key order of the zod schemas IS the OpenUI Lang wire format â€” never reorder). `packages/nuxt` = Nuxt module registering `<NuxtGenUI>` (ClientOnly wrapper over vue-lang `<Renderer>`) + `@nuxt/test-utils` fixture pipeline test. `packages/chat` / `packages/ai-sdk` = wired-but-minimal shells (SP1 scope: smoke tests only).

**Tech Stack:** Nuxt 4, Nuxt UI 4, Tailwind 4, Vue 3, TypeScript (strict), zod/v4, `@openuidev/vue-lang@0.4.2` + `@openuidev/lang-core@^0.4.1` (Lang "0.5" line â€” NOT React/Lang 1.0 parity), `ai` / `@ai-sdk/*` v6-era, unbuild/nuxt-module-builder, Vitest + `@nuxt/test-utils`, pnpm 9+ / Node 20.19+.

**Spec:** `docs/superpowers/specs/2026-11-08-nuxt-genui-sp1-design.md` â€” read it before starting. Hard constraints there are binding.

## Global Constraints

- Full monorepo skeleton upfront: ALL packages with real build/exports wiring on day one; implementations filled incrementally. Do NOT wait for features before wiring a package.
- Package scope `@nuxt-ui-genui/*`. Git repo (initialized 2026-11-08): never commit or push without explicit user approval.
- `@openuidev/vue-lang@0.4.2` / `@openuidev/lang-core@^0.4.1` only; import zod from `zod/v4`.
- Zod object key order is the OpenUI Lang positional wire format. Never reorder schema keys.
- `ssr: false` in playground; `nitro.externals.inline` + Vite `ssr.noExternal` + `optimizeDeps.include` = `["@openuidev/lang-core", "@openuidev/vue-lang", "zod"]` (mandatory â€” Nitro cannot bundle the ESM-only vue-lang otherwise).
- `OPENUI_TELEMETRY_DISABLED=1` everywhere (lang-core postinstall telemetry).
- Forms OUT of the SP1 allowlist (UForm trio deferred). Allowlist only.
- No fake streaming; never evaluate model-generated JS/Vue; actions only via registered tools; OpenUrl must be `https:` allowlisted.
- Definition of done: every command in this plan must be EXECUTED and its real output reported. Never claim tests/build pass without running them. If something fails, report the failure honestly.
- Chart wraps @nuxt/ui UChart (TanStack Charts) in SP1 - the earlier hand-rolled inline-SVG decision was superseded 2026-11-08 (user-approved). Adds @tanstack/charts ^1.5.0 (peer dep, playground).

## File map

- `pnpm-workspace.yaml`, `package.json`, `.gitignore`, `tsconfig.base.json`, `README.md`, `scripts/probe-openui.mjs` â€” Task 1
- `packages/core/src/{errors,define-component,create-library,prompt,index}.ts` + `*.test.ts` â€” Task 2
- `packages/components/src/{action,rules,helpers,defs,unions,library,index}.ts` + `renderers/*.vue` + `*.test.ts` â€” Tasks 3-4
- `packages/nuxt/src/module.ts` + `src/runtime/components/NuxtGenUI.vue` + `test/fixture/**` + `test/*.test.ts` â€” Task 5
- Task 4a (matrix-rows patch) folded inline into Tasks 3/4 (no separate step)
- `packages/chat/**`, `packages/ai-sdk/**` (smoke shells) â€” Task 7
- `apps/playground/**` (`nuxt.config.ts`, `lib/{library,demo-program}.ts`, `components/WeatherCard.vue`, `pages/index.vue`, `server/api/chat.post.ts`) â€” Task 6
- Root verification + `README.md`/`AGENTS.md` rewrite â€” Task 8

---

## Task 1: Root workspace scaffolding + dependency install

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `.gitignore`, `tsconfig.base.json`, `README.md`
- Create: `scripts/probe-openui.mjs`

- [ ] **Step 1: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 2: Write root `package.json`**

```json
{
  "name": "nuxt-genui",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "dev": "pnpm --filter playground dev"
  },
  "engines": { "node": ">=20.19", "pnpm": ">=9" },
  "devDependencies": { "typescript": "^5.6.0" }
}
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules/
dist/
.nuxt/
.output/
.data/
*.log
.env
```

- [ ] **Step 4: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "resolveJsonModule": true,
    "types": []
  }
}
```

- [ ] **Step 5: Write root `README.md`** (requirements floor, install/build/typecheck/test/dev commands, `OPENUI_TELEMETRY_DISABLED=1` note, "alpha: not published")

```markdown
# @nuxt-ui-genui (alpha)

Generative UI framework for Nuxt 4 â€” OpenUI Lang in, allowlisted Nuxt UI 4 components out. Powered by `@openuidev/vue-lang` (0.4.x). See `docs/superpowers/specs/2026-11-08-nuxt-genui-sp1-design.md`.

## Requirements
- Node.js 20.19+ (or >=22.12), pnpm 9+
- `OPENUI_TELEMETRY_DISABLED=1` recommended (silences lang-core install telemetry)

## Commands
- `pnpm install`
- `pnpm build` â€” topological build of all packages
- `pnpm typecheck`
- `pnpm test`
- `pnpm dev` â€” playground at http://localhost:3000
```

- [ ] **Step 6: Write `scripts/probe-openui.mjs`**

```js
import { execSync } from 'node:child_process'
for (const pkg of ['@openuidev/vue-lang', '@openuidev/lang-core', 'zod', 'vue', 'nuxt', '@nuxt/ui', 'ai', '@ai-sdk/vue', '@ai-sdk/openai']) {
  try {
    const v = execSync('npm view ' + pkg + ' version', { encoding: 'utf8' }).trim()
    console.log(pkg.padEnd(30), v)
  } catch { console.log(pkg.padEnd(30), 'NOT FOUND') }
}
```

- [ ] **Step 7: Run `pnpm install --ignore-scripts` then `node scripts/probe-openui.mjs`**

Expected: exits 0; records latest upstream versions (informational). Then `pnpm install` runs postinstall (note lang-core telemetry; env var set).

- [ ] **Step 8: Verification** â€” `pnpm -r typecheck` runs with no packages yet (no-op). Record: root created, install clean.

## Task 2: `packages/core` â€” the adapter seam (TDD)

**Files:**
- Create: `packages/core/package.json`, `tsconfig.json`, `vitest.config.ts`
- Create: `packages/core/src/errors.ts`, `src/define-component.ts`, `src/create-library.ts`, `src/prompt.ts`, `src/index.ts`
- Test: `test/define-component.test.ts`, `test/create-library.test.ts`, `test/prompt.test.ts`, `test/key-order.test.ts`

**Interfaces:**
- Consumes: `@openuidev/lang-core` (`createLibrary`, `generateSystemPrompt`), `zod/v4`
- Produces (later tasks import these): `defineGenUIComponent`, `createGenUILibrary`, `generateGenUISystemPrompt`, `placeholderRenderer`, `GenUILibraryError`, `ComponentGroup` re-export type

- [ ] **Step 1: `packages/core/package.json`**

```json
{
  "name": "@nuxt-ui-genui/core",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } },
  "files": ["dist"],
  "scripts": {
    "build": "unbuild",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": { "@openuidev/lang-core": "^0.4.1", "zod": "^4.0.0" },
  "devDependencies": { "typescript": "^5.6.0", "unbuild": "^3.0.0", "vitest": "^3.0.0" }
}
```

`tsconfig.json`: extends `../../tsconfig.base.json`, includes `src`.
`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', include: ['test/**/*.test.ts'] } })
```

`build.config.ts` for unbuild (`entries: ['src/index.ts']`, `declaration: true`).

- [ ] **Step 2: Write failing test `test/define-component.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'
import { defineGenUIComponent, GenUILibraryError } from '../src/index'

describe('defineGenUIComponent', () => {
  it('rejects zod v3 schemas with a clear error', () => {
    const { z: zod3 } = require('zod') as never
    expect(() =>
      defineGenUIComponent({ name: 'Bad', props: zod3.object({ a: zod3.string() }), description: 'x' } as never)
    ).toThrow(/zod\/v4/)
  })
  it('creates a component definition with key order preserved', () => {
    const def = defineGenUIComponent({
      name: 'StatsCard',
      props: z.object({ label: z.string(), value: z.string() }),
      description: 'metric'
    })
    expect(Object.keys((def as never as { props: { shape: object } }).props.shape)).toEqual(['label', 'value'])
  })
})
```

Note: `require` is not available in ESM; write the v3-rejection test using `createRequire` or simply pass a non-v4 object `{ parse() {} }` and assert it throws. Use the latter:

```ts
expect(() =>
  defineGenUIComponent({ name: 'Bad', props: { parse: () => ({}), notV4: true } as never, description: 'x' })
).toThrow(/zod\/v4/)
```

- [ ] **Step 3: Implement `src/errors.ts`**

```ts
export type GenUILibraryErrorCode =
  | 'NOT_V4_SCHEMA'
  | 'DUPLICATE_COMPONENT'
  | 'RESERVED_NAME'
  | 'INVALID_ROOT'

export class GenUILibraryError extends Error {
  constructor(readonly code: GenUILibraryErrorCode, message: string) { super(message); this.name = 'GenUILibraryError' }
}
```

- [ ] **Step 4: Implement `src/define-component.ts`**

```ts
import { defineComponent } from '@openuidev/lang-core'
import type { $ZodObject } from 'zod/v4/core'
import { GenUILibraryError } from './errors'

/** Placeholder renderer for server-side spec generation. Safe: renders nothing. */
export const placeholderRenderer = () => null

function assertV4(props: unknown): asserts props is $ZodObject {
  const p = props as { _zod?: { def?: { type?: string } } } | null
  if (!p || typeof p !== 'object' || !p._zod || !p._zod.def || !p._zod.def.type) {
    throw new GenUILibraryError(
      'NOT_V4_SCHEMA',
      'GenUI components must be defined with schemas imported from "zod/v4" (got a non-v4 schema).'
    )
  }
}

export interface GenUIComponentConfig<P extends $ZodObject> {
  name: string
  props: P
  description: string
  /** Client-side Vue component. Omit for server-side spec generation. */
  component?: unknown
}

export function defineGenUIComponent<P extends $ZodObject>(config: GenUIComponentConfig<P>) {
  assertV4(config.props)
  return defineComponent({
    name: config.name,
    props: config.props,
    description: config.description,
    component: (config.component ?? placeholderRenderer) as never
  })
}
```

- [ ] **Step 5: Write failing test `test/create-library.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'
import { createGenUILibrary, defineGenUIComponent, GenUILibraryError } from '../src/index'

const mk = (name: string) =>
  defineGenUIComponent({ name, props: z.object({ a: z.string() }), description: name + ' comp' })

describe('createGenUILibrary', () => {
  it('rejects duplicate component names at construction', () => {
    expect(() =>
      createGenUILibrary({ components: [mk('A'), mk('A')], root: 'A' })
    ).toThrow(GenUILibraryError)
  })
  it('rejects reserved builtin prefix names at construction', () => {
    expect(() =>
      createGenUILibrary({ components: [mk('@Count')], root: '@Count' })
    ).toThrow(/reserved/i)
  })
})
```

- [ ] **Step 6: Implement `src/create-library.ts`**

```ts
import { createLibrary } from '@openuidev/lang-core'
import { GenUILibraryError } from './errors'

export interface GenUILibraryConfig {
  components: Array<ReturnType<typeof import('./define-component').defineGenUIComponent>>
  root: string
  componentGroups?: Array<{ name: string; components: string[]; notes?: string[] }>
  promptOptions?: { examples?: string[]; additionalRules?: string[]; preamble?: string }
}

export function createGenUILibrary(config: GenUILibraryConfig) {
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
```

- [ ] **Step 7: Write failing test `test/key-order.test.ts`** (golden: wire format)

```ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'
import { defineGenUIComponent } from '../src/index'

describe('positional argument order (wire format)', () => {
  it('keeps zod shape key order stable', () => {
    const def = defineGenUIComponent({
      name: 'Chart',
      props: z.object({ title: z.string().optional(), type: z.string(), labels: z.array(z.string()), series: z.array(z.unknown()) }),
      description: 'chart'
    })
    expect(Object.keys((def as never as { props: { shape: object } }).props.shape))
      .toEqual(['title', 'type', 'labels', 'series'])
  })
})
```

- [ ] **Step 8: Write failing test `test/prompt.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'
import { createGenUILibrary, defineGenUIComponent, generateGenUISystemPrompt } from '../src/index'

const mk = (name: string, props: z.ZodTypeAny) =>
  defineGenUIComponent({ name, props: props as never, description: name })

describe('generateGenUISystemPrompt', () => {
  it('produces a non-empty local prompt without network access', () => {
    const lib = createGenUILibrary({ components: [mk('Card', z.object({ children: z.array(z.unknown()).optional() }))], root: 'Card' })
    const prompt = generateGenUISystemPrompt(lib)
    expect(prompt.length).toBeGreaterThan(100)
    expect(prompt).toContain('Card(')
  })
})
```

- [ ] **Step 8b: Extend `test/prompt.test.ts` — cloud/local `promptOptions` split**

Add `vi.mock` at the top of `test/prompt.test.ts` and a deterministic assertion that the cloud path strips `promptOptions` from the library spec while passing the original options. Replace/extend the imports:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod/v4'

const generateSystemPrompt = vi.fn(() => 'prompt')
vi.mock('@openuidev/lang-core', () => ({ generateSystemPrompt }))
```

```ts
describe('generateGenUISystemPrompt promptOptions split', () => {
  beforeEach(() => generateSystemPrompt.mockClear())

  it('keeps local spec shape and passes options separately', () => {
    const spec = {
      foo: 'x',
      promptOptions: { examples: ['stale'], preamble: 'stale', additionalRules: ['stale'] }
    }
    const library = { toSpec: () => spec }
    generateGenUISystemPrompt(library, { examples: ['ex'], additionalRules: ['rule'], preamble: 'pre' })
    expect(generateSystemPrompt).toHaveBeenCalledWith({
      library: spec,
      promptOptions: { examples: ['ex'], additionalRules: ['rule'], preamble: 'pre' }
    })
  })

  it('strips promptOptions from the cloud library before calling the Cloud helper', () => {
    const spec = {
      foo: 'x',
      promptOptions: { examples: ['stale'], preamble: 'stale', additionalRules: ['stale'] }
    }
    const library = { toSpec: () => spec }
    generateGenUISystemPrompt(library, { cloud: true, examples: ['ex'], preamble: 'pre' })
    expect(generateSystemPrompt).toHaveBeenCalledWith({
      cloud: true,
      library: { foo: 'x' },
      promptOptions: { examples: ['ex'], preamble: 'pre' }
    })
  })
})
```

- [ ] **Step 9: Implement `src/prompt.ts`**

```ts
import { generateSystemPrompt } from '@openuidev/lang-core'

export interface GenUIPromptOptions {
  examples?: string[]
  additionalRules?: string[]
  preamble?: string
  cloud?: boolean
}

export function generateGenUISystemPrompt(
  library: { toSpec(): unknown },
  options: GenUIPromptOptions = {}
): string {
  const spec = library.toSpec() as Record<string, unknown>
  const { cloud, ...promptOptions } = options
  if (cloud) {
    // Cloud rejects promptOptions inside the library spec; strip them there.
    const { promptOptions: _drop, ...cloudLibrary } = spec as { promptOptions?: unknown }
    return generateSystemPrompt({ cloud: true, library: cloudLibrary as never, promptOptions: promptOptions as never })
  }
  return generateSystemPrompt({ library: spec as never, promptOptions: promptOptions as never })
}
```

- [ ] **Step 10: `src/index.ts` barrel**

```ts
export { GenUILibraryError, type GenUILibraryErrorCode } from './errors'
export { defineGenUIComponent, placeholderRenderer, type GenUIComponentConfig } from './define-component'
export { createGenUILibrary, type GenUILibraryConfig } from './create-library'
export { generateGenUISystemPrompt, type GenUIPromptOptions } from './prompt'
export type { ComponentGroup } from '@openuidev/lang-core'
```

- [ ] **Step 11: Run tests**

```
cd packages/core && pnpm test
```
Expected: 4 files pass. If lang-core's `defineComponent` requires a different placeholder type, fix the cast â€” do NOT change key order or error codes.

- [ ] **Step 12: Verification** â€” `pnpm typecheck && pnpm build` in `packages/core`; `dist/index.js` + `dist/index.d.ts` exist.

## Task 3: `packages/components` â€” built-in registry defs + helpers (TDD, no SFCs yet)

**Files:**
- Create: `packages/components/package.json`, `tsconfig.json`, `vitest.config.ts`
- Create: `packages/components/src/action.ts`, `src/rules.ts`, `src/helpers.ts`, `src/unions.ts`, `src/defs.ts`, `src/index.ts`
- Test: `test/helpers.test.ts`, `test/defs.test.ts`, `test/action-rules.test.ts`

**Interfaces:**
- Consumes: `@nuxt-ui-genui/core` (`defineGenUIComponent`, `createGenUILibrary`, `placeholderRenderer`), `zod/v4`, `@openuidev/vue-lang` (`BuiltinActionType` only â€” safe type/const import)
- Produces: `createNuxtUILibrary(renderers?, options?)`, individual `*Def`s, `ContentChildUnion`/`CardChildUnion`, `actionSchema`, `formRulesSchema`, `hasAllProps`, `asArray`

NOTE: package ships **source** (no `.vue` precompile); `"build": "pnpm typecheck"`. Consumers compile SFCs through Nuxt. typecheck uses `vue-tsc --noEmit`.

- [ ] **Step 1: `package.json`**

```json
{
  "name": "@nuxt-ui-genui/components",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./sfc": { "types": "./src/components/index.ts", "import": "./src/components/index.ts" }
  },
  "files": ["src"],
  "scripts": {
    "build": "pnpm typecheck",
    "typecheck": "vue-tsc --noEmit -p tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "@nuxt-ui-genui/core": "workspace:*",
    "@openuidev/vue-lang": "^0.4.2",
    "zod": "^4.0.0",
    "marked": "^15.0.0",
    "dompurify": "^3.2.0"
  },
  "peerDependencies": { "vue": ">=3.5.0", "@nuxt/ui": ">=4.0.0", "nuxt": ">=4.0.0" },
  "devDependencies": { "typescript": "^5.6.0", "vue": "^3.5.0", "vue-tsc": "^2.1.0", "vitest": "^3.0.0", "@vitejs/plugin-vue": "^5.0.0" }
}
```

`vitest.config.ts`: `plugins: [vue()]`, environment `node`, include `test/**/*.test.ts`. `tsconfig.json` includes `src`, `test`, `vue` types.

- [ ] **Step 2: `src/action.ts`** (port of OpenUI design-system action.ts)

```ts
import { z } from 'zod/v4'
import { BuiltinActionType } from '@openuidev/vue-lang'

const continueConversationAction = z.object({
  type: z.literal(BuiltinActionType.ContinueConversation),
  context: z.string().optional()
})
const openUrlAction = z.object({
  type: z.literal(BuiltinActionType.OpenUrl),
  url: z.string()
})
const customAction = z.object({
  type: z.string(),
  params: z.record(z.string(), z.any()).optional()
})

export const actionSchema = z.union([openUrlAction, continueConversationAction, customAction]).optional()
export type GenUIAction = z.infer<typeof actionSchema>
```

- [ ] **Step 3: `src/rules.ts`** (form-rules vocabulary; defined now so future Input components don't churn the wire format)

```ts
import { z } from 'zod/v4'
export const rulesSchema = z.object({
  required: z.boolean().optional(),
  email: z.boolean().optional(),
  url: z.boolean().optional(),
  numeric: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional()
}).optional()
export type Rules = z.infer<typeof rulesSchema>
```

- [ ] **Step 4: `src/helpers.ts`**

```ts
export function hasAllProps(obj: Record<string, unknown> | null | undefined, ...keys: string[]): boolean {
  if (!obj) return false
  return keys.every((k) => obj[k] !== undefined && obj[k] !== null)
}
export function asArray<T = unknown>(v: T[] | T | null | undefined): T[] {
  if (Array.isArray(v)) return v
  if (v === null || v === undefined) return []
  return [v]
}
```

- [ ] **Step 5: failing tests** `test/helpers.test.ts` + `test/action-rules.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { hasAllProps, asArray } from '../src/helpers'
describe('helpers', () => {
  it('hasAllProps requires every key present', () => {
    expect(hasAllProps({ a: 1, b: 'x' }, 'a', 'b')).toBe(true)
    expect(hasAllProps({ a: 1 }, 'a', 'b')).toBe(false)
    expect(hasAllProps(null, 'a')).toBe(false)
  })
  it('asArray normalizes', () => {
    expect(asArray(1)).toEqual([1])
    expect(asArray([1, 2])).toEqual([1, 2])
    expect(asArray(undefined)).toEqual([])
  })
})
```

```ts
import { describe, it, expect } from 'vitest'
import { actionSchema, rulesSchema } from '../src/index'
describe('action/rules schemas', () => {
  it('parses continue_conversation and open_url actions', () => {
    expect(actionSchema.parse({ type: 'continue_conversation' })).toBeTruthy()
    expect(actionSchema.parse({ type: 'open_url', url: 'https://example.com' })).toBeTruthy()
  })
  it('parses empty rules as undefined-safe', () => {
    expect(rulesSchema.parse({ required: true })).toEqual({ required: true })
    expect(rulesSchema.parse(undefined)).toBeUndefined()
  })
})
```

Add `rulesSchema` + `actionSchema` exports to the barrel before running (see Step 9).

- [ ] **Step 6: `src/defs.ts`** â€” every schema, KEY ORDER IS WIRE FORMAT (do not reorder):

```ts
import { z } from 'zod/v4'
import { defineGenUIComponent } from '@nuxt-ui-genui/core'
import { actionSchema } from './action'

export const ChartDef = defineGenUIComponent({
  name: 'Chart',
  props: z.object({
    title: z.string().optional(),
    type: z.enum(['bar', 'line', 'pie']),
    labels: z.array(z.string()),
    series: z.array(z.object({ name: z.string(), data: z.array(z.number()) })).describe('One or more series. Each series.data aligns 1:1 with labels.')
  }),
  description: 'Chart. type: "bar" | "line" | "pie". labels: category axis. series: array of inline objects, e.g. [{ name: "Revenue", data: [18, 22, 27] }]. Each object is a plain inline literal (name, data). Use plain numbers.'
})

export const TextContentDef = defineGenUIComponent({
  name: 'TextContent',
  props: z.object({ text: z.string() }),
  description: 'A block of markdown-formatted text. Supports lists, bold, italic, headings. Never pass raw HTML.'
})

export const BadgeDef = defineGenUIComponent({
  name: 'Badge',
  props: z.object({ label: z.string(), color: z.enum(['neutral', 'primary', 'success', 'warning', 'error']).optional() }),
  description: 'Small status badge. color: "neutral" | "primary" | "success" | "warning" | "error".'
})

export const ProgressDef = defineGenUIComponent({
  name: 'Progress',
  props: z.object({ value: z.number().describe('0 to 100'), label: z.string().optional() }),
  description: 'Progress bar. value is a 0-100 percentage.'
})

export const ButtonDef = defineGenUIComponent({
  name: 'Button',
  props: z.object({ label: z.string(), action: actionSchema, variant: z.enum(['solid', 'soft', 'outline', 'ghost']).optional() }),
  description: 'Clickable button. variant: "solid" | "soft" | "outline" | "ghost". action: omit for continue_conversation, or { type: "open_url", url } for links.'
})

export const StatsCardDef = defineGenUIComponent({
  name: 'StatsCard',
  props: z.object({
    label: z.string(),
    value: z.string(),
    delta: z.string().optional(),
    trend: z.enum(['up', 'down', 'flat']).optional()
  }),
  description: 'A single KPI metric. trend: "up" (green) | "down" (red) | "flat". delta is pre-formatted, e.g. "+12.5%".'
})

export const AlertDef = defineGenUIComponent({
  name: 'Alert',
  props: z.object({ title: z.string(), description: z.string().optional(), color: z.enum(['info', 'success', 'warning', 'error']).optional() }),
  description: 'Inline alert banner. color: "info" | "success" | "warning" | "error".'
})

export const DataTableDef = defineGenUIComponent({
  name: 'DataTable',
  props: z.object({
    columns: z.array(z.object({ key: z.string(), label: z.string(), align: z.enum(['left', 'center', 'right']).optional() })).describe('Inline array of column definition objects, e.g. [{ key: "id", label: "Order ID" }]. key is a column id; rows are positional by column order.'),
    rows: z.array(z.array(z.union([z.string(), z.number()]))).describe('Row matrix; each row is an array of cells in column order.')
  }),
  description: 'Data table. columns: inline array of { key, label, align? } objects. rows: matrix of cells in column order. Cells render as text.'
})

export const ContentChildUnion = z.union([TextContentDef.ref, BadgeDef.ref, ProgressDef.ref, AlertDef.ref])
export const CardChildUnion = z.union([...ContentChildUnion.options, StatsCardDef.ref, ChartDef.ref, DataTableDef.ref, ButtonDef.ref])

export const CardDef = defineGenUIComponent({
  name: 'Card',
  props: z.object({
    title: z.string().optional(),
    children: z.array(CardChildUnion)
  }),
  description: 'Content container. title optional. children rendered in order. Card is the ONLY root content container.'
})

export const ButtonsDef = defineGenUIComponent({
  name: 'Buttons',
  props: z.object({ children: z.array(ButtonDef.ref) }),
  description: 'A horizontal row of Button components.'
})

export const ALL_DEFS = [
  CardDef, StatsCardDef, TextContentDef, ButtonDef, ButtonsDef,
  AlertDef, BadgeDef, DataTableDef, ChartDef, ProgressDef
]
```

- [ ] **Step 7: `src/unions.ts`** â€” re-export the unions for consumers:

```ts
export { ContentChildUnion, CardChildUnion } from './defs'
```

- [ ] **Step 8: `src/index.ts`**

```ts
import { createGenUILibrary, placeholderRenderer } from '@nuxt-ui-genui/core'
import { ALL_DEFS, CardDef } from './defs'

export * from './defs'
export { ContentChildUnion, CardChildUnion } from './unions'
export { actionSchema, type GenUIAction } from './action'
export { rulesSchema, type Rules } from './rules'
export { hasAllProps, asArray } from './helpers'

export interface CreateLibraryOptions {
  root?: string
  componentGroups?: Array<{ name: string; components: string[]; notes?: string[] }>
  promptOptions?: { examples?: string[]; additionalRules?: string[]; preamble?: string }
  /** Map of component NAME -> Vue SFC. Omit on the server. */
  renderers?: Partial<Record<string, unknown>>
}

export function createNuxtUILibrary(options: CreateLibraryOptions = {}) {
  const { root = 'Card', componentGroups, promptOptions, renderers = {} } = options
  const components = ALL_DEFS.map((def) => {
    const name = (def as never as { name: string }).name
    const renderer = renderers[name]
    // Copy the definition before attaching a client renderer — never mutate the shared ALL_DEFS objects.
    return renderer ? { ...(def as object), component: renderer } as never : def
  })
  return createGenUILibrary({ components, root, componentGroups, promptOptions })
}
```

- [ ] **Step 9: failing test `test/defs.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createNuxtUILibrary, ALL_DEFS } from '../src/index'

describe('built-in defs', () => {
  it('defines all alpha components', () => {
    expect(ALL_DEFS.map((d) => (d as never as { name: string }).name).sort())
      .toEqual(['Alert', 'Badge', 'Button', 'Buttons', 'Card', 'Chart', 'DataTable', 'Progress', 'StatsCard', 'TextContent'].sort())
  })
  it('Chart key order is wire format: type, labels, series', () => {
    const def = ALL_DEFS.find((d) => (d as never as { name: string }).name === 'Chart') as never as { props: { shape: object } }
    expect(Object.keys(def.props.shape)).toEqual(['title', 'type', 'labels', 'series'])
  })
  it('createNuxtUILibrary() builds a spec with Card as root without SFCs', () => {
    const lib = createNuxtUILibrary()
    const spec = (lib as never as { toSpec(): unknown }).toSpec()
    expect(JSON.stringify(spec)).toContain('Card(')
    expect(JSON.stringify(spec)).toContain('StatsCard(')
  })
  it('does not mutate shared server definitions when renderers are supplied', () => {
    const cardBefore = ALL_DEFS.find((d) => (d as never as { name: string }).name === 'Card') as never as { component?: unknown }
    const componentBefore = cardBefore.component
    createNuxtUILibrary({ renderers: { Card: { marker: 'client-renderer' } as never } })
    expect(cardBefore.component).toBe(componentBefore)
  })
})
```

- [ ] **Step 10: run tests** `cd packages/components && pnpm test` â€” expected: PASS (after Step 2-9 implemented). Fix type/API mismatches against installed node_modules; report them.

- [ ] **Step 11: Verification** â€” `pnpm typecheck` green; source-only package, no `dist`.

## Task 4: `packages/components` â€” Vue SFCs wrapping Nuxt UI 4

**Files:**
- Create: `packages/components/src/components/Card.vue`, `StatsCard.vue`, `TextContent.vue`, `Alert.vue`, `Badge.vue`, `Progress.vue`, `Button.vue`, `Buttons.vue`, `DataTable.vue`, `Chart.vue`
- Create: `packages/components/src/components/index.ts` (named re-export of every SFC for `@nuxt-ui-genui/components/sfc`)

**Interfaces:**
- Consumes: vue-lang composables (`useRenderNode`, `useTriggerAction`, `useIsStreaming`), Nuxt UI 4 SFCs (`UCard`, `UAlert`, `UBadge`, `UProgress`, `UButton`), `hasAllProps`, `marked`, `dompurify`
- Produces: compiled SFC set consumed by `createNuxtUILibrary(renderers)`; in playground these are imported once and passed to the factory.

Rules for every SFC: **single `props` object prop** (`defineProps<{ props: {...} }>()`), bail to `null` until required props resolve (streaming), disable interactive elements while streaming, no `v-html` except TextContent (marked + DOMPurify).

- [ ] **Step 1: `Card.vue`**

```vue
<script setup lang="ts">
import { UCard } from '@nuxt/ui'
import { useRenderNode } from '@openuidev/vue-lang'
const { props } = defineProps<{ props: { title?: string; children?: unknown }[] | { title?: string; children?: unknown } }>()
const renderNode = useRenderNode()
const p = (Array.isArray(props) ? props[0] : props) ?? ({} as never)
</script>
<template>
  <UCard>
    <template v-if="p.title" #header><div class="font-semibold">{{ p.title }}</div></template>
    <div class="space-y-3">
      <component :is="() => renderNode((p as never as { children?: unknown }).children)" />
    </div>
  </UCard>
</template>
```

NOTE on the `props` shape: vue-lang passes a SINGLE object (`{ props: {...}, renderNode }`). The `Array.isArray` dance above is WRONG â€” vue-lang calls SFCs with `props` = the evaluated props object only. Simplify:

```vue
<script setup lang="ts">
import { UCard } from '@nuxt/ui'
import { useRenderNode } from '@openuidev/vue-lang'
const props = defineProps<{ props: { title?: string; children?: unknown } }>()
const renderNode = useRenderNode()
const data = props.props
</script>
<template>
  <UCard>
    <template v-if="data?.title" #header><div class="font-semibold">{{ data.title }}</div></template>
    <div class="space-y-3"><component :is="() => renderNode(data?.children)" /></div>
  </UCard>
</template>
```

Use the SIMPLIFIED form for all SFCs: `const props = defineProps<{ props: Shape }>()`, then read `props.props`.

- [ ] **Step 2: `StatsCard.vue`**

```vue
<script setup lang="ts">
import { UCard, UBadge } from '@nuxt/ui'
const props = defineProps<{ props: { label?: string; value?: string; delta?: string; trend?: 'up' | 'down' | 'flat' } }>()
const p = props.props
</script>
<template>
  <UCard>
    <p v-if="p.label" class="text-xs uppercase tracking-wide text-muted">{{ p.label }}</p>
    <p v-if="p.value" class="text-2xl font-bold mt-1">{{ p.value }}</p>
    <UBadge v-if="p.delta" class="mt-2" :color="p.trend === 'down' ? 'error' : 'success'" variant="subtle">{{ p.delta }}</UBadge>
  </UCard>
</template>
```

- [ ] **Step 3: `TextContent.vue`**

```vue
<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { computed } from 'vue'
const props = defineProps<{ props: { text?: string } }>()
const html = computed(() => DOMPurify.sanitize(marked.parse(props.props?.text ?? '', { async: false }) as string))
</script>
<template><div v-html="html" /></template>
```

- [ ] **Step 4: `Alert.vue`** (`UAlert`, `:color="p?.color ?? 'info'"`, `:title="p?.title"`, `:description="p?.description"`; bail `v-if="!p || !p.title"`)

- [ ] **Step 5: `Badge.vue`** (`UBadge`, `:label="p?.label"`, `:color="p?.color ?? 'neutral'"`; bail if no label)

- [ ] **Step 6: `Progress.vue`** (`UProgress`, `:model-value="p?.value ?? 0"`, `:max="100"`; optional `:label="p?.label"`)

- [ ] **Step 7: `Button.vue`**

```vue
<script setup lang="ts">
import { UButton } from '@nuxt/ui'
import { BuiltinActionType, useIsStreaming, useTriggerAction } from '@openuidev/vue-lang'
const props = defineProps<{ props: { label?: string; action?: { type: string; url?: string; params?: Record<string, unknown> }; variant?: 'solid' | 'soft' | 'outline' | 'ghost' } }>()
const triggerAction = useTriggerAction()
const isStreaming = useIsStreaming()
const p = props.props
function onClick() {
  const action = p?.action ?? { type: BuiltinActionType.ContinueConversation }
  if (action.type === BuiltinActionType.OpenUrl) {
    const url = (action as { url?: string }).url ?? ''
    if (url.startsWith('https://')) window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  triggerAction(p?.label ?? '', undefined, { type: action.type, params: (action as { params?: Record<string, unknown> }).params })
}
</script>
<template>
  <UButton v-if="p?.label" :variant="p?.variant ?? 'solid'" :disabled="isStreaming" @click="onClick">{{ p.label }}</UButton>
</template>
```

- [ ] **Step 8: `Buttons.vue`** â€” render `props.children` via `useRenderNode()` inside a flex row (same pattern as Card).

- [ ] **Step 9: `DataTable.vue`** â€” hand-rolled Tailwind table (deterministic, streaming-safe):

```vue
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ props: { columns?: Array<{ key: string; label: string; align?: string }>; rows?: Array<Array<string | number>> } }>()
const p = props.props
const ready = computed(() => Array.isArray(p?.columns) && p.columns.length > 0 && Array.isArray(p?.rows))
</script>
<template>
  <table v-if="ready" class="w-full text-sm">
    <thead><tr><th v-for="c in p!.columns" :key="c.key" class="text-left font-medium border-b pb-2" :class="c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'">{{ c.label }}</th></tr></thead>
    <tbody><tr v-for="(row, i) in p!.rows" :key="i" class="border-b last:border-0"><td v-for="(c, ci) in p!.columns" :key="c.key" class="py-2" :class="c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''">{{ row[ci] }}</td></tr></tbody>
  </table>
</template>
```

- [ ] **Step 10: `Chart.vue`** - UChart wrapper (`@nuxt/ui` v4 built-in; requires `@tanstack/charts ^1.5.0` peer dep installed in the playground):

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { UChart } from '@nuxt/ui'
const props = defineProps<{ props: { title?: string; type?: 'bar' | 'line' | 'pie'; labels?: string[]; series?: Array<{ name: string; data: number[] }> } }>()
const p = props.props
const ready = computed(() => Array.isArray(p?.labels) && Array.isArray(p?.series) && p.labels.length > 0 && p.series.every(s => Array.isArray(s.data) && s.data.length === p.labels!.length))
// UChart consumes row objects: one row per label, one value column per series name, plus the index key.
const chartData = computed(() => p!.labels!.map((label, index) => {
  const row: Record<string, string | number> = { label }
  for (const s of p!.series!) row[s.name] = s.data[index] ?? 0
  return row
}))
const categories = computed(() => p!.series!.map((s) => s.name))
const chartType = computed(() => (p!.type === 'pie' ? 'donut' : p!.type ?? 'bar'))
</script>
<template>
  <div v-if="ready">
    <p v-if="p?.title" class="text-sm font-medium mb-2">{{ p.title }}</p>
    <UChart :type="chartType" :data="chartData" index="label" :categories="categories" :height="240" />
  </div>
</template>
```

`pie` maps to UChart's `donut` type (UChart has no raw pie type; donut is the supported equivalent). `categories` is a string array (series names become value columns); `index` tells UChart which column holds the category-axis labels. The SFC stays a thin wrapper: all geometry/legend/tooltip/a11y come from UChart + TanStack Charts. Implementer must verify UChart's exact prop names (`type`, `data`, `index`, `categories`, `height`) against the installed `@nuxt/ui` version before building - docs live at ui.nuxt.com/docs/components/chart and may lag the pinned release.

- [ ] **Step 10b:** Add `"@tanstack/charts": "^1.5.0"` to `apps/playground/package.json` dependencies (Task 6). @nuxt/ui lists it only as an optional peer; `UChart` cannot render without it. No Unovis anywhere.

- [ ] **Step 10c: `src/components/index.ts`** — named re-export for the `@nuxt-ui-genui/components/sfc` subpath:

```ts
export { default as Card } from './Card.vue'
export { default as StatsCard } from './StatsCard.vue'
export { default as TextContent } from './TextContent.vue'
export { default as Alert } from './Alert.vue'
export { default as Badge } from './Badge.vue'
export { default as Progress } from './Progress.vue'
export { default as Button } from './Button.vue'
export { default as Buttons } from './Buttons.vue'
export { default as DataTable } from './DataTable.vue'
export { default as Chart } from './Chart.vue'
```

- [ ] **Step 11: Verification** â€” `cd packages/components && pnpm typecheck` (vue-tsc) compiles all SFCs. Rendering is exercised via the nuxt fixture (Task 5).

## Task 5: `packages/nuxt` â€” module + `<NuxtGenUI>` wrapper (integration tests)

**Files:**
- Create: `packages/nuxt/package.json`, `tsconfig.json`, `build.config.ts`
- Create: `packages/nuxt/src/module.ts`, `src/runtime/NuxtGenUI.vue`, `src/runtime/index.ts`
- Create: `packages/nuxt/test/fixtures/basic/package.json`, `test/fixtures/basic/nuxt.config.ts`
- Test: `test/render.test.ts`, `test/components.test.ts`

**Interfaces:**
- Consumes: `@nuxt/kit` (`defineNuxtModule`, `addComponent`), `@openuidev/vue-lang` (`Renderer`, `BuiltinActionType`, types `ActionEvent`, `ParseResult`), `vue` (`ClientOnly`, `computed`), `@nuxt/test-utils`
- Produces: registered auto component `<NuxtGenUI>`; props `response?: string | null`, `isStreaming?: boolean`, `library: Library`, `onAction?`, `onError?`, `onParseResult?`; emits an `action` via callback props only.

- [ ] **Step 1: `package.json`**

```json
{
  "name": "@nuxt-ui-genui/nuxt",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": { "import": "./dist/module.mjs", "types": "./dist/module.d.mts" } },
  "scripts": { "build": "nuxt-module-builder build", "typecheck": "tsc --noEmit -p tsconfig.json", "test": "vitest run" },
  "dependencies": {
    "@nuxt/kit": "^4.0.0",
    "@openuidev/vue-lang": "^0.4.2",
    "zod": "^4.0.0"
  },
  "devDependencies": { "@nuxt/module-builder": "^1.0.0", "@nuxt/test-utils": "^3.17.0", "nuxt": "^4.1.0", "typescript": "^5.6.0", "vue": "^3.5.0", "vitest": "^3.0.0", "@nuxt/ui": "^4.12.0", "@tanstack/charts": "^1.5.0", "@nuxt-ui-genui/components": "workspace:*" }
}
```

`build.config.ts`: `import { defineBuildConfig } from 'unbuild'; export default defineBuildConfig({ entries: [{ input: 'src/module.ts', builder: 'mkdist' }] })`

- [ ] **Step 2: `src/module.ts`**

```ts
import { addComponent, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: { name: '@nuxt-ui-genui/nuxt', configKey: 'genui', compatibility: { nuxt: '^4.0.0' } },
  setup() {
    const resolver = createResolver(import.meta.url)
    addComponent({ name: 'NuxtGenUI', filePath: resolver.resolve('./runtime/NuxtGenUI.vue') })
  }
})
```

- [ ] **Step 3: `src/runtime/NuxtGenUI.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Renderer, BuiltinActionType, type ActionEvent, type Library, type OpenUIError, type ParseResult } from '@openuidev/vue-lang'

const props = withDefaults(defineProps<{
  response?: string | null
  isStreaming?: boolean
  library: Library
  onAction?: (e: ActionEvent) => void
  onError?: (errors: OpenUIError[]) => void
  onParseResult?: (result: ParseResult | null) => void
}>(), { response: null, isStreaming: false })

const devOverlay = ref<OpenUIError[]>([])
const isDev = import.meta.dev

function handleError(errors: OpenUIError[]) {
  if (isDev) devOverlay.value = errors
  props.onError?.(errors)
}
function handleAction(event: ActionEvent) { props.onAction?.(event) }
const errorsList = computed(() => devOverlay.value)
</script>
<template>
  <ClientOnly>
    <Renderer :response="response ?? null" :library="library" :is-streaming="isStreaming" :on-action="handleAction" :on-error="handleError" :on-parse-result="onParseResult" />
    <div v-if="isDev && errorsList.length" class="fixed bottom-2 right-2 z-50 max-h-40 max-w-md overflow-auto rounded border border-error/50 bg-error/10 p-2 text-[10px]">
      <p class="font-bold">OpenUI parse errors ({{ errorsList.length }})</p>
      <ul><li v-for="(e, i) in errorsList" :key="i"><code>{{ e.code ?? 'error' }}</code>: {{ e.message }}</li></ul>
    </div>
  </ClientOnly>
</template>
```

- [ ] **Step 4: `src/runtime/index.ts`** â€” `export { NuxtGenUI }`? module auto-registers; keep empty export for types (`export {}`).

- [ ] **Step 5: fixture** `test/fixtures/basic/nuxt.config.ts`

```ts
import NuxtGenUI from '../../../src/module'
export default defineNuxtConfig({
  modules: [NuxtGenUI, '@nuxt/ui'],
  ssr: false,
  nitro: { externals: { inline: ['@openuidev/lang-core', '@openuidev/vue-lang', 'zod'] } },
  vite: { ssr: { noExternal: ['@openuidev/lang-core', '@openuidev/vue-lang', 'zod'] } }
})
```

Create fixture package:

```json
{
  "name": "basic-fixture",
  "private": true,
  "type": "module",
  "dependencies": {
    "nuxt": "^4.1.0",
    "@nuxt/ui": "^4.12.0",
    "@nuxt-ui-genui/components": "workspace:*",
    "@tanstack/charts": "^1.5.0"
  }
}
```

The nuxt package also declares `@nuxt/ui`, `@tanstack/charts`, and `@nuxt-ui-genui/components` in devDependencies so package-context test imports resolve under pnpm isolation.

- [ ] **Step 6: failing test `test/render.test.ts`**

```ts
// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, StatsCard, TextContent, Button, DataTable, Chart } from '@nuxt-ui-genui/components/sfc'

const DEMO = [
  'root = Card([stat, note])',
  'stat = StatsCard("Total Revenue", "$128,430", "+12.5%", "up")',
  'note = TextContent("Q3 looks healthy.")'
].join('\n')

describe('<NuxtGenUI> full pipeline', () => {
  const library = createNuxtUILibrary({ renderers: { Card, StatsCard, TextContent, Button, DataTable, Chart } })
  it('renders a deterministic demo program through vue-lang into SFCs', async () => {
    const html = await renderSuspended(NuxtGenUI as never, { props: { library, response: DEMO, isStreaming: false } })
    expect(html).toContain('Total Revenue')
    expect(html).toContain('$128,430')
  })
})
```

The `./sfc` subpath is mandatory for this fixture and for the playground; do not fall back to relative imports.

- [ ] **Step 7: `./sfc` subpath export** (mandatory) to `packages/components/package.json`:

```json
"./sfc": { "types": "./src/components/index.ts", "import": "./src/components/index.ts" }
```

`src/components/index.ts` re-exports the SFCs (see Task 4 Step 10c); the fixture imports `{ Card, StatsCard, TextContent, Button, DataTable, Chart } from '@nuxt-ui-genui/components/sfc'`.

- [ ] **Step 7b: component behavior tests** `test/components.test.ts` (component render contract; `@vitest-environment nuxt`):

```ts
// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { StatsCard, TextContent, DataTable, Chart } from '@nuxt-ui-genui/components/sfc'

describe('built-in component render contract', () => {
  it('StatsCard renders label, value, and delta', async () => {
    const html = await renderSuspended(StatsCard as never, { props: { props: { label: 'Revenue', value: '$128,430', delta: '+12.5%', trend: 'up' } } })
    expect(html).toContain('Revenue')
    expect(html).toContain('$128,430')
    expect(html).toContain('+12.5%')
  })
  it('TextContent renders sanitized markdown', async () => {
    const html = await renderSuspended(TextContent as never, { props: { props: { text: '**Bold**<script>window.__x = 1</script>' } } })
    expect(html).toContain('<strong>')
    expect(html).not.toContain('<script')
  })
  it('DataTable renders the positional row matrix', async () => {
    const html = await renderSuspended(DataTable as never, { props: { props: { columns: [{ key: 'id', label: 'ID' }, { key: 'customer', label: 'Customer' }], rows: [['#1024', 'Ana Silva']] } } })
    expect(html).toContain('#1024')
    expect(html).toContain('Ana Silva')
  })
  it('Chart renders only once labels and series are aligned', async () => {
    const incomplete = await renderSuspended(Chart as never, { props: { props: { title: 'Monthly Revenue', type: 'bar' } } })
    expect(incomplete).not.toContain('Monthly Revenue')
    const ready = await renderSuspended(Chart as never, { props: { props: { title: 'Monthly Revenue', type: 'bar', labels: ['Jun', 'Jul'], series: [{ name: 'Revenue', data: [18, 22] }] } } })
    expect(ready).toContain('Monthly Revenue')
  })
})
```

Adjust any assertions only to match what `renderSuspended` actually returns; report exact output. Do not loosen the sanitizer or positional-matrix assertions without explanation.

- [ ] **Step 8: run tests** `cd packages/nuxt && pnpm test` â€” expect PASS; SFC import of Nuxt UI in fixture requires `@nuxt/ui` module in fixture nuxt.config (done). Debug failures by checking `node_modules` compiled module; report exact errors.

- [ ] **Step 9: Verification** â€” `pnpm build` emits `dist/module.mjs`; `pnpm typecheck` green.

## Task 4a: FOLDED - matrix rows applied inline in Task 3/4

Matrix rows for `DataTable` are built directly into the Task 3 `DataTableDef` schema and the Task 4 `DataTable.vue` SFC (`row[ci]` positional binding); no separate patch step remains. Verify the components tasks match those inline sections.

## Task 6: `apps/playground` â€” demo app

**Files:**
- Create: `apps/playground/package.json`, `nuxt.config.ts`, `app.vue`, `app/assets/css/main.css`, `pages/index.vue`
- Create: `apps/playground/lib/library.ts` (shared zero-arg/with-renderers factory), `lib/demo-program.ts`
- Create: `apps/playground/server/api/chat.post.ts`

**Interfaces:**
- Consumes: `@nuxt-ui-genui/nuxt` module, `@nuxt-ui-genui/components` (`ALL_DEFS`, `createGenUILibrary` via core), `@nuxt-ui-genui/core`, `@nuxt/ui`, `ai`, `@ai-sdk/vue`, `@ai-sdk/openai`, `zod/v4`
- Produces: runnable playground at `http://localhost:3000`

- [ ] **Step 1: `apps/playground/package.json`**

```json
{
  "name": "playground",
  "private": true,
  "type": "module",
  "scripts": { "dev": "nuxt dev", "build": "nuxt build", "typecheck": "nuxt typecheck", "test": "echo no-tests" },
  "dependencies": {
    "vue": "^3.5.0",
    "nuxt": "^4.1.0",
    "@nuxt/ui": "^4.12.0",
    "@tanstack/charts": "^1.5.0",
    "tailwindcss": "^4.0.0",
    "@iconify-json/lucide": "^1.2.0",
    "@nuxt-ui-genui/nuxt": "workspace:*",
    "@nuxt-ui-genui/components": "workspace:*",
    "@nuxt-ui-genui/core": "workspace:*",
    "ai": "^6.0.325",
    "@ai-sdk/openai": "^3.0.139",
    "@ai-sdk/vue": "^3.0.325",
    "marked": "^15.0.0",
    "dompurify": "^3.2.0",
    "zod": "^4.0.0"
  }
}
```

- [ ] **Step 2: `nuxt.config.ts`**

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-ui-genui/nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  nitro: { externals: { inline: ['@openuidev/lang-core', '@openuidev/vue-lang', 'zod'] } },
  vite: {
    ssr: { noExternal: ['@openuidev/lang-core', '@openuidev/vue-lang', 'zod'] },
    optimizeDeps: { include: ['@openuidev/vue-lang'], exclude: ['@openuidev/lang-core'] }
  },
  runtimeConfig: { thesysApiKey: '' } // never used client-side; read via process.env on server
})
```

Actually read `process.env.THESYS_API_KEY` in the server route directly; do not leak via runtimeConfig public. Keep `runtimeConfig` empty.

- [ ] **Step 3: `app/assets/css/main.css`** (Nuxt 4 srcDir is `app/`) -- BOTH imports are mandatory for Nuxt UI v4:

```css
@import "tailwindcss";
@import "@nuxt/ui";
```

(`@nuxt/icon`, `@nuxt/fonts`, `@nuxtjs/color-mode` are auto-registered by the `@nuxt/ui` module -- do not add them to `modules`. `<UApp>` is required only for toasts/tooltips/overlays. `@iconify-json/lucide` is preinstalled so icons render offline.)
- [ ] **Step 4: `app.vue`**: `<UApp><NuxtPage /></UApp>`

- [ ] **Step 5: `lib/library.ts`** â€” THE shared module (official-example pattern):

```ts
import { z } from 'zod/v4'
import { defineGenUIComponent, createGenUILibrary } from '@nuxt-ui-genui/core'
import { ALL_DEFS } from '@nuxt-ui-genui/components'

export const weatherCardDef = defineGenUIComponent({
  name: 'WeatherCard',
  props: z.object({ city: z.string(), temp: z.string(), condition: z.string() }),
  description: 'Weather card for a city. condition: e.g. "Sunny", "Cloudy".'
})

export const promptOptions = {
  additionalRules: [
    'Card is the only root container. Never nest Card inside Card.',
    'StatsCard value must be a single string, e.g. "$128,430" or "98.2%".',
    'Each Chart series object is { name: string, data: number[] } inline literals; data must align 1:1 with labels.',
    'Use DataTable for order lists; keep at most 6 rows in examples.',
    'Prefer StatsCard x4 + one Chart + one DataTable for dashboard requests.'
  ],
  examples: [
    'root = Card([rev, chart])\nrev = StatsCard("Total Revenue", "$128,430", "+12.5%", "up")\nchart = Chart("Monthly Revenue", "bar", ["Jan","Feb","Mar"], [{ name: "Revenue", data: [42, 51, 63] }])',
    'root = Card([tbl])\ntbl = DataTable([{ key: "id", label: "ID" }, { key: "customer", label: "Customer" }, { key: "amount", label: "Amount" }], [["#1024", "Ana Silva", "$4,820"], ["#1025", "Bruno Costa", "$1,310"]])'
  ]
}

export function createPlaygroundLibrary(renderers?: Record<string, unknown>) {
  const builtins = ALL_DEFS.map((def) => {
    const name = (def as never as { name: string }).name
    const renderer = renderers?.[name]
    return renderer ? ({ ...(def as object), component: renderer } as never) : def
  })
  const weather = renderers?.WeatherCard
    ? defineGenUIComponent({ ...weatherCardDef, component: renderers.WeatherCard } as never)
    : weatherCardDef
  return createGenUILibrary({ components: [...builtins, weather], root: 'Card', promptOptions })
}
```

- [ ] **Step 6: `lib/demo-program.ts`** â€” deterministic SalesDashboard program:

```ts
export const DEMO_PROGRAM = [
  'root = Card([revenue, orders, aov, growth, salesChart, ordersTable, note, weather])',
  'revenue = StatsCard("Total Revenue", "$128,430", "+12.5%", "up")',
  'orders = StatsCard("Orders", "1,284", "+8.1%", "up")',
  'aov = StatsCard("Avg Order Value", "$100.02", "-2.3%", "down")',
  'growth = StatsCard("Growth", "+12.5%", "vs last quarter", "up")',
  'salesChart = Chart("Monthly Revenue", "bar", ["Jun","Jul","Aug","Sep","Oct","Nov"], [{ name: "Revenue", data: [18, 22, 27, 31, 38, 46] }])',
  'ordersTable = DataTable([{ key: "id", label: "Order ID" }, { key: "customer", label: "Customer" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }], [["#1024", "Ana Silva", "$4,820", "Paid"], ["#1023", "Bruno Costa", "$1,310", "Shipped"], ["#1022", "Carla Nunes", "$2,940", "Processing"], ["#1021", "DÃ¡rio Mendes", "$780", "Paid"], ["#1020", "Elena Rocha", "$1,150", "Delivered"]])',
  'note = TextContent("Q3 performance is healthy. Revenue is **up 12.5%** with average order value slightly down. Watch enterprise orders next week.")',
  'weather = WeatherCard("Lisbon", "23Â°C", "Sunny")'
].join('\n')
```

- [ ] **Step 7: `server/api/chat.post.ts`**

```ts
import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, simulateReadableStream, stepCountIs, streamText } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { createPlaygroundLibrary, promptOptions } from '~/lib/library'
import { generateGenUISystemPrompt } from '@nuxt-ui-genui/core'
import { DEMO_PROGRAM } from '~/lib/demo-program'

const library = createPlaygroundLibrary()
const systemPrompt = generateGenUISystemPrompt(library, promptOptions)

export default defineEventHandler(async (event) => {
  const { messages } = await readBody<{ messages: unknown[] }>(event)
  const apiKey = process.env.THESYS_API_KEY

  if (!apiKey) {
    // Deterministic demo â€” clearly not AI. Streams the fixed program as text deltas through streamText.
    const mock = new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: 'stream-start', warnings: [] },
            { type: 'text-start', id: 'txt' },
            ...DEMO_PROGRAM.split('\n').map(l => ({ type: 'text-delta' as const, id: 'txt', delta: l + '\n' })),
            { type: 'text-end', id: 'txt' },
            { type: 'finish',
              finishReason: { unified: 'stop', raw: undefined },
              usage: { inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
                       outputTokens: { total: 0, text: 0, reasoning: undefined } } }
          ]
        })
      })
    })
    const result = streamText({
      model: mock,
      system: systemPrompt,
      messages: await convertToModelMessages(messages as never),
      stopWhen: stepCountIs(1)
    })
    return result.toUIMessageStreamResponse()
  }

  const openai = createOpenAI({ apiKey, baseURL: 'https://api.thesys.dev/v1/embed' })
  const result = streamText({
    model: openai.chat('google/gemini-3.6-flash-free'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages as never),
    stopWhen: stepCountIs(5)
  })
  return result.toUIMessageStreamResponse({ onError: (e) => (e instanceof Error ? e.message : String(e)) })
})
```

VERIFIED 2026-11-08 (registry, dist-tags `ai-v6`): `ai@6.0.325` / `@ai-sdk/vue@3.0.325` / `@ai-sdk/openai@3.0.139`; `MockLanguageModelV3` from `ai/test`, parts require `id`, `text-delta` uses `delta`, `finish.finishReason` is an object `{ unified: 'stop', raw: undefined }` with NESTED `usage.inputTokens/outputTokens`; `simulateReadableStream` imported from `ai`. If anything drifts, trust `node_modules` over this note. Fallback if the demo path errors: return the raw program text with header `x-demo-mode: deterministic` and document non-streaming demo — do NOT fake success.

- [ ] **Step 8: `pages/index.vue`**

```vue
<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { computed, ref } from 'vue'
import { BuiltinActionType, type ActionEvent } from '@openuidev/vue-lang'
import NuxtGenUI from '@nuxt-ui-genui/nuxt/runtime/NuxtGenUI.vue'
import { createPlaygroundLibrary } from '~/lib/library'
import * as sfc from '@nuxt-ui-genui/components/sfc'
import WeatherCard from '../components/WeatherCard.vue'

const library = createPlaygroundLibrary({ ...sfc, WeatherCard })
const chat = new Chat({}) // @ai-sdk/vue v3 has NO `api` init option; default transport is DefaultChatTransport('/api/chat'). Customize via: new Chat({ transport: new DefaultChatTransport({ api: '/api/chat' }) })
const input = ref('')
const messages = computed(() => chat.messages)
const status = computed(() => chat.status)
const error = computed(() => chat.error)
const lastAssistantText = computed(() => {
  const m = [...messages.value].reverse().find(m => m.role === 'assistant')
  if (!m) return ''
  return m.parts.filter(p => p.type === 'text').map(p => (p as { text: string }).text).join('')
})
const ready = computed(() => lastAssistantText.value.length > 0 || status.value === 'streaming')
function send() {
  const text = input.value.trim()
  if (!text || status.value === 'streaming') return
  chat.sendMessage({ text })
  input.value = ''
}
function handleAction(event: ActionEvent) {
  if (event.type === BuiltinActionType.ContinueConversation && event.humanFriendlyMessage) {
    chat.sendMessage({ text: event.humanFriendlyMessage })
  }
}
</script>
<template>
  <main class="mx-auto max-w-3xl p-4 space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Nuxt GenUI Playground</h1>
      <span class="text-xs text-muted">deterministic demo when no THESYS_API_KEY</span>
    </header>
    <div class="space-y-3">
      <div v-for="m in messages" :key="m.id" class="text-sm">
        <p class="text-xs uppercase text-muted">{{ m.role }}</p>
        <p v-if="m.role === 'user'">{{ m.parts.filter(p => p.type === 'text').map(p => p.text).join('') }}</p>
      </div>
      <NuxtGenUI v-if="lastAssistantText || status === 'streaming'" :library="library" :response="lastAssistantText" :is-streaming="status === 'streaming'" :on-action="handleAction" />
      <p v-if="error" class="text-sm text-error">{{ error }}</p>
    </div>
    <form class="flex gap-2" @submit.prevent="send">
      <input v-model="input" class="flex-1 rounded border px-3 py-2 text-sm" placeholder="Show me a sales dashboard..." />
      <button type="submit" :disabled="status === 'streaming'" class="rounded bg-primary px-4 py-2 text-sm text-inverted">Send</button>
    </form>
  </main>
</template>
```

NOTE: import path `@nuxt-ui-genui/nuxt/runtime/NuxtGenUI.vue` â€” add `./runtime/NuxtGenUI.vue` subpath export in packages/nuxt package.json exports (Step 9), or rely on the module's auto-component registration (`nuxt.config` has module) and simply use `<NuxtGenUI>` without import. **Use the auto-registered component; drop the import line.**

- [ ] **Step 9: packages/nuxt exports** â€” ensure `"./runtime/NuxtGenUI.vue": "./src/runtime/NuxtGenUI.vue"` subpath is NOT needed; auto-registration covers it.

- [ ] **Step 10: WeatherCard SFC** â€” `apps/playground/components/WeatherCard.vue`:

```vue
<script setup lang="ts">
import { UCard } from '@nuxt/ui'
const props = defineProps<{ props: { city?: string; temp?: string; condition?: string } }>()
</script>
<template>
  <UCard v-if="props.props">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-wide text-muted">{{ props.props.city }}</p>
        <p class="text-xl font-bold">{{ props.props.temp }}</p>
      </div>
      <span class="text-sm">{{ props.props.condition }}</span>
    </div>
  </UCard>
</template>
```

- [ ] **Step 11: runtime verification**

```
pnpm install
pnpm build        # repo root â€” all packages
cd apps/playground && pnpm dev
```

Then: `Invoke-WebRequest -Uri http://localhost:3000 -Method Get` shows 200 + HTML shell. POST to `/api/chat` with `{"messages":[{"role":"user","parts":[{"type":"text","text":"show me a sales dashboard"}]}]}` and confirm a streamed UIMessage response containing OpenUI Lang lines (`root = Card(`). If no `THESYS_API_KEY`, output must be the fixed demo program; if the MockLanguageModelV3 path fails, apply the honest fallback documented in Step 7 and REPORT it.

Type-check: `cd apps/playground && pnpm typecheck`.

## Task 7: `packages/chat` + `packages/ai-sdk` â€” wired-but-minimal shells

**Files:**
- Create: `packages/chat/package.json`, `src/index.ts`, `README.md`, `test/smoke.test.ts`
- Create: `packages/ai-sdk/package.json`, `src/index.ts`, `README.md`, `test/smoke.test.ts`

- [ ] **Step 1: `packages/chat/package.json`** (same shape for ai-sdk with name swapped)

```json
{
  "name": "@nuxt-ui-genui/chat",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "build": "pnpm typecheck", "typecheck": "tsc --noEmit -p tsconfig.json", "test": "vitest run" },
  "dependencies": {},
  "devDependencies": { "typescript": "^5.6.0", "vitest": "^3.0.0" }
}
```

- [ ] **Step 2: shells' `src/index.ts`**

chat:
```ts
// @nuxt-ui-genui/chat â€” optional chat layer. SP1 ships only the wiring point.
export {}
```
ai-sdk:
```ts
// @nuxt-ui-genui/ai-sdk â€” optional Vercel AI SDK adapter. SP1 ships only the wiring point.
// The reference adapter lives in the playground (server/api/chat.post.ts) until Phase 3 stabilizes it.
export {}
```

- [ ] **Step 3: smoke tests** â€” `test/smoke.test.ts` (identical in both):

```ts
import { describe, it, expect } from 'vitest'
describe('@nuxt-ui-genui/chat', () => { it('imports', async () => { expect(await import('../src/index.ts')).toBeTruthy() }) })
```
(adjust package name in ai-sdk's copy)

- [ ] **Step 4: READMEs** â€” one paragraph each: what the package will hold (chat components/composables; AI SDK adapter), status: shell for SP1, link to spec.

- [ ] **Step 5: Verification** â€” `pnpm --filter @nuxt-ui-genui/chat test`, `pnpm --filter @nuxt-ui-genui/ai-sdk test` â€” PASS.

## Task 8: Root verification matrix + docs + AGENTS.md update

- [ ] **Step 1: Fresh-install proof**

```
Remove-Item -Recurse -Force node_modules, packages\*\node_modules, apps\*\node_modules -ErrorAction SilentlyContinue
$env:OPENUI_TELEMETRY_DISABLED = '1'
pnpm install
```
Record actual output (time, warnings, errors) â€” do not claim clean without running.

- [ ] **Step 2: Build + typecheck + test from root**

```
pnpm build
pnpm typecheck
pnpm test
```
Expected: all exit 0. Report real results. Common failure modes and fixes:
- vue-lang externalization errors in playground â†’ check `nitro.externals.inline` + `vite.ssr.noExternal` + `vite.optimizeDeps.include` (Task 6 Step 2)
- `toSpec is not a function` â†’ check installed lang-core version (`pnpm why @openuidev/lang-core` must show 0.4.1)
- positional-order mismatch in demo table → confirm DataTable defs were wired inline (`DataTableDef.rows` matrix + `DataTable.vue` `row[ci]`)

- [ ] **Step 3: Dev-server smoke** â€” `pnpm --filter playground dev`, hit `/` (expect the playground UI), then POST `/api/chat` as in Task 6 Step 11 and paste the streamed body; confirm it contains `root = Card(`; confirm a custom WeatherCard renders (its definition appears in the demo program and the browser console shows no errors). Record results.

- [ ] **Step 4: Update root `README.md`** â€” add: packages list (all six), the exact demo URL, the `OPENUI_TELEMETRY_DISABLED=1` note, the demo-vs-AI distinction, status "alpha, SP1 complete".

- [ ] **Step 5: Update `AGENTS.md`** â€” replace "planning stage" sections with the real state:

```markdown
## Repo state
- pnpm monorepo: apps/playground + packages/{core,components,nuxt,chat,ai-sdk}
- Build: `pnpm build`; typecheck: `pnpm typecheck`; test: `pnpm test` (all `pnpm -r`, topological)
- Node 20.19+ / pnpm 9+; `OPENUI_TELEMETRY_DISABLED=1`
## Verified reality
- SSR disabled in playground; vue-lang ESM-only, callbacks as props; streaming via accumulated text
- Chart wraps @nuxt/ui UChart (TanStack Charts, @tanstack/charts ^1.5.0) - DataTable uses positional matrix rows
- Demo mode: no THESYS_API_KEY â†’ deterministic program through the same streamText path (MockLanguageModelV3)
```
Keep the hard constraints section; delete the stale "no code exists" wording.

- [ ] **Step 6: Self-review** â€” read the whole repo diff (files created), run the full Definition of Done from spec Â§7, and report honestly per item with actual command outputs.

- [ ] **Step 7: Mark spec implemented** â€” after every check in Steps 1-6 has been executed and passed, update `docs/superpowers/specs/2026-11-08-nuxt-genui-sp1-design.md` status/header to `Implemented` with the completion date (and commit hash if one was explicitly approved). Do not mark the spec implemented before verification is green.

---

## Verification checklist (spec Â§7 definition of done)

1. Fresh install clean (Node 20.19+, pnpm 9+) â€” executed, output shown.
2. `pnpm build`, `pnpm typecheck`, `pnpm test` â€” green, real output shown.
3. `pnpm dev` renders deterministic SalesDashboard + custom WeatherCard with no console errors; actions wired (ContinueConversation â†’ sendMessage, https OpenUrl â†’ window.open) â€” verified manually + curl.
4. `AGENTS.md` + `README.md` updated with real commands.
5. `docs/superpowers/specs/2026-11-08-nuxt-genui-sp1-design.md` status/header marked `Implemented` with the completion date after verification is green.
6. No claim of tests/build passing without actually running them.

