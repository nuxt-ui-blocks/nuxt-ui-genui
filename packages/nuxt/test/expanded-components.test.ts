// @vitest-environment nuxt
// Cross-root boundary note: the installed @openuidev/vue-lang / lang-core 0.4.x does
// NOT reject out-of-union element references at parse or render time. The cross-root
// boundary is wrapper-side: Card blocks the six chat-only component names and
// ChatPalette allowlists them. These tests pin that wrapper-side contract — they do
// not expect CardChildUnion / ChatChildUnion to reject element refs in this stack.
import { describe, expect, it } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, Accordion, Empty, Separator, ChatPalette, ChatMessages, ChatMessage, ChatReasoning, ChatShimmer, ChatTool, Skeleton, Kbd, Avatar, Chip } from '@nuxt-ui-genui/components/sfc'

const cardLibrary = createNuxtUILibrary({
  renderers: { Card, Accordion, Empty, Separator, ChatPalette, ChatMessages, ChatTool }
})
const chatLibrary = createNuxtUILibrary({
  root: 'ChatPalette',
  renderers: { Card, Accordion, Empty, Separator, ChatPalette, ChatMessages, ChatMessage, ChatReasoning, ChatShimmer, ChatTool }
})

async function renderHtml(library: unknown, response: string): Promise<string> {
  const { container } = await renderSuspended(NuxtGenUI as never, { props: { library, response, isStreaming: false } } as never) as never as { container: { innerHTML: string } }
  return container.innerHTML
}

// Wrapper-level assertions (missing/streamed props, defensive clamps) are rendered
// directly through renderSuspended in this same Nuxt environment — never in the
// Node-only components package.
async function renderSfc(component: unknown, props: unknown): Promise<{ container: HTMLElement; html: string }> {
  const { container } = await renderSuspended(component as never, { props } as never) as never as { container: HTMLElement }
  return { container, html: container.innerHTML }
}

describe('expanded components through Lang -> <NuxtGenUI>', () => {
  it('Accordion renders its trigger marker under Card', async () => {
    const html = await renderHtml(cardLibrary, [
      'root = Card("Expanded", [acc])',
      'acc = Accordion([{ label: "AccordionPanelMarker", content: "AccordionBodyMarker" }])'
    ].join('\n'))
    expect(html).toContain('AccordionPanelMarker')
  })
  it('Empty renders its title marker under Card', async () => {
    const html = await renderHtml(cardLibrary, [
      'root = Card("Empty", [empty])',
      'empty = Empty("EmptyStateMarker")'
    ].join('\n'))
    expect(html).toContain('EmptyStateMarker')
  })
  it('Separator with a label renders its marker under Card', async () => {
    const html = await renderHtml(cardLibrary, [
      'root = Card("Divider", [sep])',
      'sep = Separator("SeparatorLabelMarker")'
    ].join('\n'))
    expect(html).toContain('SeparatorLabelMarker')
  })
  it('ChatMessages renders two deterministic undefined-free markers under ChatPalette', async () => {
    const html = await renderHtml(chatLibrary, [
      'root = ChatPalette([feed])',
      'feed = ChatMessages([{ role: "assistant", text: "alpha-first-marker" }, { role: "user", text: "beta-second-marker" }])'
    ].join('\n'))
    expect(html).toContain('alpha-first-marker')
    expect(html).toContain('beta-second-marker')
    expect(html).not.toContain('undefined')
  })
  it('ChatTool renders its display text and no actions element or action buttons', async () => {
    const html = await renderHtml(chatLibrary, [
      'root = ChatPalette([tool])',
      'tool = ChatTool("ComposeWidgetToolMarker")'
    ].join('\n'))
    expect(html).toContain('ComposeWidgetToolMarker')
    expect(html).not.toContain('data-slot="actions"')
    // The installed UChatTool always renders the CollapsibleTrigger button; no other action buttons are allowed.
    const { container } = await renderSuspended(NuxtGenUI as never, { props: { library: chatLibrary, response: [
      'root = ChatPalette([tool])',
      'tool = ChatTool("ComposeWidgetToolMarker")'
    ].join('\n'), isStreaming: false } } as never) as never as { container: HTMLElement }
    const buttons = [...container.querySelectorAll('button')]
    expect(buttons.length).toBeLessThanOrEqual(1)
    expect(buttons.every((b) => b.getAttribute('data-slot') === 'trigger')).toBe(true)
  })
  it('cross-root: ChatTool under Card does not render its marker', async () => {
    const html = await renderHtml(cardLibrary, [
      'root = Card("ShellMarker", [tool])',
      'tool = ChatTool("IllegalCardToolMarker")'
    ].join('\n'))
    expect(html).toContain('ShellMarker')
    expect(html).not.toContain('IllegalCardToolMarker')
  })
  it('cross-root: Accordion under ChatPalette does not render its marker', async () => {
    const html = await renderHtml(chatLibrary, [
      'root = ChatPalette([tool, acc])',
      'tool = ChatTool("PalettePositiveControlMarker")',
      'acc = Accordion([{ label: "IllegalChatPaletteAccordionMarker", content: "body" }])'
    ].join('\n'))
    // Positive control in the same render: an allowlisted ChatTool child renders, so an
    // empty palette cannot masquerade as a pass; the out-of-root Accordion stays filtered.
    expect(html).toContain('PalettePositiveControlMarker')
    expect(html).not.toContain('IllegalChatPaletteAccordionMarker')
  })
})

describe('Phase A combined fixture (Card root)', () => {
  it('Card renders Accordion, Empty, and Separator visible markers together', async () => {
    const html = await renderHtml(cardLibrary, [
      'root = Card("Expanded", [accordion, empty, separator])',
      'accordion = Accordion([{ label: "CombinedAccordionMarker", content: "CombinedAccordionBodyMarker" }])',
      'empty = Empty("CombinedEmptyMarker")',
      'separator = Separator("CombinedSeparatorMarker")'
    ].join('\n'))
    expect(html).toContain('CombinedAccordionMarker')
    expect(html).toContain('CombinedEmptyMarker')
    expect(html).toContain('CombinedSeparatorMarker')
  })
})

describe('Phase B combined fixture (ChatPalette root)', () => {
  it('renders ChatMessage nested text, ChatReasoning, ChatShimmer, and ChatTool; out-of-root Accordion is filtered', async () => {
    const html = await renderHtml(chatLibrary, [
      'root = ChatPalette([message, reasoning, shimmer, tool, acc])',
      'message = ChatMessage("assistant", "NestedChatMessageMarker")',
      'reasoning = ChatReasoning("NestedReasoningMarker", true)',
      'shimmer = ChatShimmer("NestedShimmerMarker")',
      'tool = ChatTool("NestedToolMarker")',
      'acc = Accordion([{ label: "Compose safely", content: "Compose safely body" }])'
    ].join('\n'))
    expect(html).toContain('NestedChatMessageMarker')
    expect(html).toContain('NestedReasoningMarker')
    expect(html).toContain('NestedShimmerMarker')
    expect(html).toContain('NestedToolMarker')
    // The wrapper-side allowlist drops non-chat children under ChatPalette.
    expect(html).not.toContain('Compose safely')
  })
  it('ChatMessages caps rendered messages at 100 and keeps the first 100 in order', async () => {
    const entries = Array.from({ length: 105 }, (_, i) => `{ role: "user", text: "cap-marker-${i}" }`).join(', ')
    const html = await renderHtml(chatLibrary, [
      'root = ChatPalette([feed])',
      `feed = ChatMessages([${entries}])`
    ].join('\n'))
    // The 100-cap is applied before rendering; the installed UChatMessage declares `id`
    // as a prop and does not render it as a DOM attribute, so the cap is asserted via
    // content markers rather than element ids. Count the rendered markers and assert
    // their index sequence is exactly 0..99, in order.
    const markers = [...html.matchAll(/cap-marker-(\d+)/g)].map((m) => Number(m[1]))
    expect(markers.length).toBe(100)
    expect(markers).toEqual([...Array(100).keys()])
  })
})

describe('partial stream / missing required props (never crashes renderSuspended)', () => {
  it('unfinished ChatMessages([]) under a streaming flag resolves without throwing', async () => {
    const { container } = await renderSuspended(NuxtGenUI as never, { props: { library: chatLibrary, response: [
      'root = ChatPalette([feed])',
      'feed = ChatMessages([])'
    ].join('\n'), isStreaming: true } } as never) as never as { container: HTMLElement }
    expect(container.innerHTML).not.toContain('undefined')
    // Positive structural control: the streaming render produced the palette shell, not a blank page.
    expect(container.innerHTML).toContain('data-slot="root"')
  })
  it('ChatMessage with no (yet-arrived) text does not throw and renders nothing per the wrapper contract', async () => {
    const { container } = await renderSuspended(NuxtGenUI as never, { props: { library: chatLibrary, response: [
      'root = ChatPalette([msg])',
      'msg = ChatMessage("assistant")'
    ].join('\n'), isStreaming: true } } as never) as never as { container: HTMLElement }
    expect(container.innerHTML).not.toContain('undefined')
    expect(container.querySelector('article')).toBeNull()
    // Positive structural control: the palette shell still rendered around the missing-text message.
    expect(container.innerHTML).toContain('data-slot="root"')
  })
  it('truncated trailing statement mid-stream does not throw', async () => {
    const { container } = await renderSuspended(NuxtGenUI as never, { props: { library: chatLibrary, response: 'root = ChatPalette([feed])\nfeed = ChatMessages([', isStreaming: true } } as never) as never as { container: HTMLElement }
    expect(container.innerHTML).not.toContain('undefined')
    // Positive structural control: the palette shell rendered even though the feed statement is incomplete.
    expect(container.innerHTML).toContain('data-slot="root"')
  })
  it('ChatMessage wrapper bails when text is missing entirely', async () => {
    const { container, html } = await renderSfc(ChatMessage, { props: { role: 'assistant' } })
    expect(container.querySelector('article')).toBeNull()
    expect(html).not.toContain('undefined')
  })
  it('ChatReasoning wrapper bails when text is empty', async () => {
    const { container, html } = await renderSfc(ChatReasoning, { props: { text: '' } })
    expect(container.querySelector('button')).toBeNull()
    expect(html).not.toContain('undefined')
  })
  it('ChatShimmer wrapper bails when text is empty', async () => {
    const { container, html } = await renderSfc(ChatShimmer, { props: { text: '   ' } })
    expect(container.querySelector('[data-slot="base"]')).toBeNull()
    expect(html).not.toContain('undefined')
  })
  it('ChatTool wrapper bails when neither name nor text is usable', async () => {
    const { container, html } = await renderSfc(ChatTool, { props: {} })
    expect(container.querySelector('button')).toBeNull()
    expect(html).not.toContain('undefined')
  })
})

describe('ChatMessages wrapper: invalid entries, status, and deterministic order', () => {
  it('drops entries with unknown roles, keeps valid ones in order', async () => {
    const { html } = await renderSfc(ChatMessages, { props: { messages: [
      { role: 'admin', text: 'InvalidRoleMarker' },
      { role: 'user', text: 'FirstRenderedMarker' },
      { role: 'assistant', text: 'SecondRenderedMarker' }
    ] } })
    expect(html).not.toContain('InvalidRoleMarker')
    expect(html).toContain('FirstRenderedMarker')
    expect(html).toContain('SecondRenderedMarker')
    expect(html.indexOf('FirstRenderedMarker')).toBeLessThan(html.indexOf('SecondRenderedMarker'))
  })
  it('drops non-string-text entries and keeps valid ones', async () => {
    const { html } = await renderSfc(ChatMessages, { props: { messages: [
      { role: 'user' },
      { role: 'user', text: 'ValidTextMarker' }
    ] } } as never)
    expect(html).toContain('ValidTextMarker')
    expect(html).not.toContain('undefined')
  })
  it('forwards a valid status and drops an invalid one', async () => {
    const valid = await renderSfc(ChatMessages, { props: { messages: [], status: 'streaming' } })
    expect(valid.html).toContain('data-status="streaming"')
    const invalid = await renderSfc(ChatMessages, { props: { messages: [], status: 'bogus' } })
    expect(invalid.html).not.toContain('bogus')
    expect(invalid.html).not.toContain('data-status')
  })
})

describe('ChatTool wrapper: text override contract', () => {
  it('model `text` overrides the mapped `name` display', async () => {
    const { html } = await renderSfc(ChatTool, { props: { name: 'NameMarkerTool', text: 'OverrideMarkerTool' } })
    expect(html).toContain('OverrideMarkerTool')
    expect(html).not.toContain('NameMarkerTool')
  })
  it('falls back to `name` when `text` is absent or blank', async () => {
    const { html } = await renderSfc(ChatTool, { props: { name: 'FallbackNameMarker', text: '   ' } })
    expect(html).toContain('FallbackNameMarker')
  })
})

describe('Skeleton wrapper: clamp and placeholder contract (Task 2 minors)', () => {
  it('renders an unconditional default placeholder with no props object', async () => {
    const { container } = await renderSfc(Skeleton, { props: {} })
    expect(container.querySelectorAll('[role="alert"]').length).toBe(1)
  })
  it('clamps lines to the 6-row cap and renders one role=alert per row', async () => {
    const { container } = await renderSfc(Skeleton, { props: { lines: 10 } })
    expect(container.querySelectorAll('[role="alert"]').length).toBe(6)
    const three = await renderSfc(Skeleton, { props: { lines: 3 } })
    expect(three.container.querySelectorAll('[role="alert"]').length).toBe(3)
  })
  it('clamps out-of-range pixel dimensions to the 8–480px bound', async () => {
    const { container } = await renderSfc(Skeleton, { props: { width: 99999, height: 1, lines: 1 } })
    const row = container.querySelector('[role="alert"]')
    expect(row).toBeTruthy()
    const style = row!.getAttribute('style') ?? ''
    expect(style).toContain('480px')
    expect(style).toContain('8px')
    expect(style).not.toContain('99999px')
  })
})

describe('Kbd wrapper: 12-entry defensive cap (Task 2 minor)', () => {
  it('renders at most 12 key caps', async () => {
    const keys = Array.from({ length: 14 }, (_, i) => `KeyCapMarker${String(i).padStart(2, '0')}`)
    const { container, html } = await renderSfc(Kbd, { props: { keys } })
    expect(container.querySelectorAll('kbd').length).toBe(12)
    expect(html).toContain('KeyCapMarker00')
    expect(html).toContain('KeyCapMarker11')
    expect(html).not.toContain('KeyCapMarker12')
    expect(html).not.toContain('KeyCapMarker13')
  })
})

describe('Avatar/Chip wrappers: unknown variant strings render without crashing (Task 2 minors)', () => {
  it('Avatar tolerates an unknown size and renders its text fallback', async () => {
    const { html } = await renderSfc(Avatar, { props: { text: 'AvatarFallbackMarker', size: 'huge-unknown' } })
    expect(html).toContain('AvatarFallbackMarker')
    expect(html).not.toContain('undefined')
  })
  it('Avatar tolerates an unknown icon name without crashing', async () => {
    const { html } = await renderSfc(Avatar, { props: { icon: 'lucide:definitely-not-a-real-icon-xyzqw' } })
    expect(html).not.toContain('undefined')
  })
  it('Chip tolerates unknown color and size strings and keeps its label', async () => {
    const { html } = await renderSfc(Chip, { props: { text: 'ChipStandaloneMarker', color: 'chartreuse', size: 'huge' } })
    expect(html).toContain('ChipStandaloneMarker')
    expect(html).not.toContain('undefined')
  })
})

describe('Accordion wrapper: empty-label items are filtered (Task 2 minor)', () => {
  it('renders nothing when every declared item has a blank label', async () => {
    const { html } = await renderSfc(Accordion, { props: { items: [{ label: '   ', content: 'BlankLabelMarker' }] } })
    expect(html).not.toContain('BlankLabelMarker')
  })
  it('keeps well-formed items while dropping blank-label ones', async () => {
    const { html } = await renderSfc(Accordion, { props: { items: [
      { label: '', content: 'DroppedLabelMarker' },
      { label: 'RealAccordionLabelMarker', content: 'RealAccordionContentMarker' }
    ] } })
    expect(html).toContain('RealAccordionLabelMarker')
    expect(html).not.toContain('DroppedLabelMarker')
  })
})
