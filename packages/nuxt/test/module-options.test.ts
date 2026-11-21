import { describe, it, expect } from 'vitest'
import genuiModule from '../src/module'

function fakeNuxt(genui: Record<string, unknown>) {
  return { options: { genui } } as never
}

describe('@nuxt-ui-genui/nuxt module options', () => {
  it('reads the host config from the genui key', async () => {
    const meta = await genuiModule.getMeta?.()
    expect(meta?.configKey).toBe('genui')
  })

  it('resolves the defaults when the host sets nothing', async () => {
    const options = await genuiModule.getOptions?.(undefined, fakeNuxt({}))
    expect(options?.componentName).toBe('NuxtGenUI')
    expect(options?.registerComponent).toBe(true)
  })

  it('honours the host overrides', async () => {
    const options = await genuiModule.getOptions?.(undefined, fakeNuxt({ componentName: 'MyGenUI', registerComponent: false }))
    expect(options?.componentName).toBe('MyGenUI')
    expect(options?.registerComponent).toBe(false)
  })
})
