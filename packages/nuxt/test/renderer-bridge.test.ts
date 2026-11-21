// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import type { ParseResult } from '@openuidev/vue-lang'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, TextContent } from '@nuxt-ui-genui/components/sfc'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { GenUIRenderer } from '../src/runtime/GenUIRenderer'
import { cleanDiagnosticNames, useRendererBridge } from '../src/runtime/renderer-bridge'

const library = createNuxtUILibrary({ renderers: { Card, TextContent } })

const ORPHAN_DEMO = [
  'orphan = TextContent("unreachable")',
  'root = Card("Uses nothing", [summary])',
  'summary = TextContent("used")'
].join('\n')

function fakeParseResult(meta: { unresolved?: string[]; orphaned?: string[] }): ParseResult {
  return { meta } as unknown as ParseResult
}

describe('cleanDiagnosticNames', () => {
  it('drops bareword undefined/null and keeps real references', () => {
    expect(cleanDiagnosticNames(['undefined', 'null', 'real'])).toEqual(['real'])
  })

  it('returns an empty list for absent diagnostics', () => {
    expect(cleanDiagnosticNames(undefined)).toEqual([])
  })
})

describe('useRendererBridge', () => {
  it('filters undefined/null from both diagnostic callbacks', () => {
    const onUnresolved = vi.fn()
    const onOrphaned = vi.fn()
    const bridge = useRendererBridge(() => ({
      library,
      response: ORPHAN_DEMO,
      onUnresolved,
      onOrphaned
    }))

    bridge.handleParseResult(fakeParseResult({
      unresolved: ['undefined', 'null', 'missing'],
      orphaned: ['undefined', 'unused']
    }))

    expect(onUnresolved).toHaveBeenCalledWith(['missing'])
    expect(onOrphaned).toHaveBeenCalledWith(['unused'])
  })
})

describe('renderer entries forward diagnostics identically', () => {
  const entries = [
    ['NuxtGenUI', NuxtGenUI],
    ['GenUIRenderer', GenUIRenderer]
  ] as const

  for (const [name, entry] of entries) {
    it(`${name} forwards onOrphaned without undefined/null noise`, async () => {
      const onOrphaned = vi.fn()
      const onUnresolved = vi.fn()
      await renderSuspended(entry as never, {
        props: {
          library,
          response: ORPHAN_DEMO,
          isStreaming: false,
          onAction: () => {},
          onOrphaned,
          onUnresolved
        }
      } as never) as never

      expect(onOrphaned).toHaveBeenCalledWith(expect.arrayContaining(['orphan']))
      const forwarded = onOrphaned.mock.lastCall?.[0] as string[]
      expect(forwarded).not.toContain('undefined')
      expect(forwarded).not.toContain('null')
      expect(onUnresolved).toHaveBeenCalled()
    })
  }
})
