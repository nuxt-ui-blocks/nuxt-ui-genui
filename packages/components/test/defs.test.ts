import { describe, it, expect } from 'vitest'
import { createNuxtUILibrary, ALL_DEFS } from '../src/index'

describe('built-in defs', () => {
  it('defines all built-in components', () => {
    expect(ALL_DEFS.map((d) => (d as never as { name: string }).name).sort())
      .toEqual(['Accordion', 'Alert', 'Avatar', 'AvatarGroup', 'Badge', 'Banner', 'Breadcrumb', 'Button', 'Buttons', 'Calendar', 'Card', 'Carousel', 'CheckboxGroup', 'Chart', 'ChatMessage', 'ChatMessages', 'ChatPalette', 'ChatReasoning', 'ChatShimmer', 'ChatTool', 'Checkbox', 'Chip', 'Collapsible', 'ColorPicker', 'CommandPalette', 'ContextMenu', 'DataTable', 'DropdownMenu', 'Drawer', 'Empty', 'FileUpload', 'Form', 'Input', 'InputDate', 'InputMenu', 'InputNumber', 'InputRating', 'InputTags', 'InputTime', 'Kbd', 'Listbox', 'Marquee', 'Modal', 'NavigationMenu', 'Pagination', 'PinInput', 'Popover', 'Progress', 'ProgressGroup', 'RadioGroup', 'Select', 'SelectMenu', 'Separator', 'Skeleton', 'Slideover', 'Slider', 'Stats', 'StatsCard', 'Stepper', 'Switch', 'Tabs', 'Table', 'TextContent', 'Textarea', 'Timeline', 'Toast', 'Tooltip', 'Tree', 'User', 'ScrollArea', 'Splitter'].sort())
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

