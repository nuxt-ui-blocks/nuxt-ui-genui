import { describe, it, expect } from 'vitest'
import {
  ALL_DEFS,
  ContentChildUnion,
  CardChildUnion,
  ChatChildUnion,
  AccordionDef,
  AvatarDef,
  AvatarGroupDef,
  BannerDef,
  ChipDef,
  CollapsibleDef,
  EmptyDef,
  KbdDef,
  SeparatorDef,
  SkeletonDef,
  ChatMessageDef,
  ChatMessagesDef,
  ChatPaletteDef,
  ChatReasoningDef,
  ChatShimmerDef,
  ChatToolDef
} from '../src/index'
import { CHAT_CHILD_NAMES } from '../src/unions'

const nameOf = (def: unknown) => (def as { name: string }).name
const shapeOf = (def: unknown) => (def as never as { props: { shape: Record<string, never> } }).props.shape
const keysOf = (def: unknown) => Object.keys(shapeOf(def))
const nestedShapeOf = (def: unknown, key: string) =>
  (shapeOf(def)[key] as never as { element: { shape: Record<string, never> } }).element.shape
const nestedKeysOf = (def: unknown, key: string) => Object.keys(nestedShapeOf(def, key))
const enumValuesOf = (schema: unknown) => (schema as never as { options: string[] }).options
const optionalEnumValuesOf = (schema: unknown) =>
  (schema as never as { _zod: { def: { innerType: { options: string[] } } } })._zod.def.innerType.options
const refOf = (def: unknown) => (def as never as { ref: unknown }).ref

const EXISTING_TEN = ['Card', 'StatsCard', 'TextContent', 'Button', 'Buttons', 'Alert', 'Badge', 'DataTable', 'Chart', 'Progress']
const PHASE_A_NAMES = ['Accordion', 'Avatar', 'AvatarGroup', 'Banner', 'Chip', 'Collapsible', 'Empty', 'Kbd', 'Separator', 'Skeleton']
const PHASE_B_NAMES = ['ChatMessage', 'ChatMessages', 'ChatPalette', 'ChatReasoning', 'ChatShimmer', 'ChatTool']

const PHASE_A_DEFS = [AccordionDef, AvatarDef, AvatarGroupDef, BannerDef, ChipDef, CollapsibleDef, EmptyDef, KbdDef, SeparatorDef, SkeletonDef]
const PHASE_B_DEFS = [ChatMessageDef, ChatMessagesDef, ChatPaletteDef, ChatReasoningDef, ChatShimmerDef, ChatToolDef]
const PHASE_C_NAMES = ['Form', 'Input', 'Textarea', 'InputNumber', 'Select', 'Checkbox', 'RadioGroup', 'Switch', 'Slider', 'InputRating']
const PHASE_D_NAMES = ['Tabs', 'Stepper', 'Timeline', 'Breadcrumb']
const PHASE_E_NAMES = ['Modal', 'Slideover', 'CommandPalette']
const PHASE_F_NAMES = ['SelectMenu', 'PinInput', 'InputTags', 'ColorPicker', 'User', 'Pagination', 'NavigationMenu', 'Tree', 'Popover', 'DropdownMenu', 'ContextMenu', 'Drawer']
const PHASE_G_NAMES = ['InputDate', 'InputTime', 'FileUpload']
const PHASE_H_NAMES = ['Toast', 'Tooltip', 'Calendar']
const PHASE_I_NAMES = ['Table', 'Listbox', 'Marquee']
const PHASE_J_NAMES = ['CheckboxGroup']
const PHASE_K_NAMES = ['Stats']
const PHASE_L_NAMES = ['InputMenu', 'ProgressGroup']
const PHASE_M_NAMES = ['Carousel']
const PHASE_N_NAMES = ['ScrollArea', 'Splitter']

describe('expanded defs: registry contract', () => {
  it('ALL_DEFS starts with the existing ten in current order, then Phase A, then Phase B', () => {
    expect(ALL_DEFS.map(nameOf)).toEqual([...EXISTING_TEN, ...PHASE_A_NAMES, ...PHASE_B_NAMES, ...PHASE_C_NAMES, ...PHASE_D_NAMES, ...PHASE_E_NAMES, ...PHASE_F_NAMES, ...PHASE_G_NAMES, ...PHASE_H_NAMES, ...PHASE_I_NAMES, ...PHASE_J_NAMES, ...PHASE_K_NAMES, ...PHASE_L_NAMES, ...PHASE_M_NAMES, ...PHASE_N_NAMES])
  })

  it('ALL_DEFS names are unique', () => {
    const names = ALL_DEFS.map(nameOf)
    expect(new Set(names).size).toBe(names.length)
  })

  it('exports every new definition from the package entry point', () => {
    for (const def of [...PHASE_A_DEFS, ...PHASE_B_DEFS]) {
      expect(ALL_DEFS).toContain(def)
    }
  })

  it('CHAT_CHILD_NAMES stays in sync with ChatChildUnion members', () => {
    expect([...CHAT_CHILD_NAMES]).toEqual(PHASE_B_NAMES)
  })
})

describe('expanded defs: exact prop key order (wire format)', () => {
  it('AccordionDef: items, type; nested items label, content', () => {
    expect(keysOf(AccordionDef)).toEqual(['items', 'type'])
    expect(nestedKeysOf(AccordionDef, 'items')).toEqual(['label', 'content'])
    expect(optionalEnumValuesOf(shapeOf(AccordionDef)['type'])).toEqual(['single', 'multiple'])
  })

  it('AvatarDef: src, alt, text, size, icon', () => {
    expect(keysOf(AvatarDef)).toEqual(['src', 'alt', 'text', 'size', 'icon'])
  })

  it('AvatarGroupDef: avatars, max; nested avatars src, alt, text', () => {
    expect(keysOf(AvatarGroupDef)).toEqual(['avatars', 'max'])
    expect(nestedKeysOf(AvatarGroupDef, 'avatars')).toEqual(['src', 'alt', 'text'])
  })

  it('BannerDef: title, icon', () => {
    expect(keysOf(BannerDef)).toEqual(['title', 'icon'])
  })

  it('ChipDef: text, color, size', () => {
    expect(keysOf(ChipDef)).toEqual(['text', 'color', 'size'])
  })

  it('CollapsibleDef: label, content', () => {
    expect(keysOf(CollapsibleDef)).toEqual(['label', 'content'])
  })

  it('EmptyDef: title, description, icon', () => {
    expect(keysOf(EmptyDef)).toEqual(['title', 'description', 'icon'])
  })

  it('KbdDef: keys', () => {
    expect(keysOf(KbdDef)).toEqual(['keys'])
  })

  it('SeparatorDef: label, orientation', () => {
    expect(keysOf(SeparatorDef)).toEqual(['label', 'orientation'])
    expect(optionalEnumValuesOf(shapeOf(SeparatorDef)['orientation'])).toEqual(['horizontal', 'vertical'])
  })

  it('SkeletonDef: width, height, lines', () => {
    expect(keysOf(SkeletonDef)).toEqual(['width', 'height', 'lines'])
  })

  it('ChatMessageDef: role, text; role enum user, assistant, system', () => {
    expect(keysOf(ChatMessageDef)).toEqual(['role', 'text'])
    expect(enumValuesOf(shapeOf(ChatMessageDef)['role'])).toEqual(['user', 'assistant', 'system'])
  })

  it('ChatMessagesDef: messages, status; nested messages role, text; status enum', () => {
    expect(keysOf(ChatMessagesDef)).toEqual(['messages', 'status'])
    expect(nestedKeysOf(ChatMessagesDef, 'messages')).toEqual(['role', 'text'])
    expect(enumValuesOf(nestedShapeOf(ChatMessagesDef, 'messages')['role'])).toEqual(['user', 'assistant', 'system'])
    expect(optionalEnumValuesOf(shapeOf(ChatMessagesDef)['status'])).toEqual(['ready', 'submitted', 'streaming', 'error'])
  })

  it('ChatPaletteDef: children, title, icon; children is an array of lazy refs', () => {
    expect(keysOf(ChatPaletteDef)).toEqual(['children', 'title', 'icon'])
    const children = shapeOf(ChatPaletteDef)['children'] as never as {
      _zod: { def: { type: string, element: { _zod: { def: { type: string } } } } }
    }
    expect(children._zod.def.type).toBe('array')
    expect(children._zod.def.element._zod.def.type).toBe('lazy')
  })

  it('ChatReasoningDef: text, streaming', () => {
    expect(keysOf(ChatReasoningDef)).toEqual(['text', 'streaming'])
  })

  it('ChatShimmerDef: text', () => {
    expect(keysOf(ChatShimmerDef)).toEqual(['text'])
  })

  it('ChatToolDef: name, text, suffix, icon, loading', () => {
    expect(keysOf(ChatToolDef)).toEqual(['name', 'text', 'suffix', 'icon', 'loading'])
  })
})

describe('expanded defs: union membership', () => {
  it('ContentChildUnion contains exactly the SP1 members', () => {
    const byName = new Map(ALL_DEFS.map((d) => [nameOf(d), refOf(d)]))
    const expected = ['TextContent', 'Badge', 'Progress', 'Alert'].map((name) => byName.get(name))
    expect(new Set(ContentChildUnion.options)).toEqual(new Set(expected))
  })

  it('CardChildUnion options = ContentChildUnion + StatsCard/Chart/DataTable/Button/Buttons refs + ten Phase A refs + Form', () => {
    const byName = new Map(ALL_DEFS.map((d) => [nameOf(d), refOf(d)]))
    const expected = [
      ...ContentChildUnion.options,
      byName.get('StatsCard'),
      byName.get('Chart'),
      byName.get('DataTable'),
      byName.get('Button'),
      byName.get('Buttons'),
      byName.get('Accordion'),
      byName.get('Avatar'),
      byName.get('AvatarGroup'),
      byName.get('Banner'),
      byName.get('Chip'),
      byName.get('Collapsible'),
      byName.get('Empty'),
      byName.get('Kbd'),
      byName.get('Separator'),
      byName.get('Skeleton'),
      byName.get('Form'),
      byName.get('Tabs'),
      byName.get('Stepper'),
      byName.get('Timeline'),
      byName.get('Breadcrumb'),
      byName.get('Modal'),
      byName.get('Slideover'),
      byName.get('CommandPalette'),
      byName.get('User'),
      byName.get('Pagination'),
      byName.get('NavigationMenu'),
      byName.get('Tree'),
      byName.get('Popover'),
      byName.get('DropdownMenu'),
      byName.get('ContextMenu'),
      byName.get('Drawer'),
      byName.get('Toast'),
      byName.get('Tooltip'),
      byName.get('Calendar'),
      byName.get('Table'),
      byName.get('Listbox'),
      byName.get('Marquee'),
      byName.get('Stats'),
      byName.get('ProgressGroup'),
      byName.get('Carousel'),
      byName.get('ScrollArea'),
      byName.get('Splitter')
    ]
    expect(new Set(CardChildUnion.options)).toEqual(new Set(expected))
  })

  it('ChatChildUnion options are exactly the six chat refs', () => {
    const expected = [ChatMessageDef, ChatMessagesDef, ChatPaletteDef, ChatReasoningDef, ChatShimmerDef, ChatToolDef].map(refOf)
    expect(new Set(ChatChildUnion.options)).toEqual(new Set(expected))
  })

  it('Phase A refs occur in CardChildUnion only as the appended Phase A refs, not in ContentChildUnion or ChatChildUnion', () => {
    const phaseARefs = PHASE_A_DEFS.map(refOf)
    for (const ref of phaseARefs) {
      expect(CardChildUnion.options).toContain(ref)
      expect(ContentChildUnion.options).not.toContain(ref)
      expect(ChatChildUnion.options).not.toContain(ref)
    }
  })

  it('Chat refs do not occur in CardChildUnion or ContentChildUnion', () => {
    const chatRefs = PHASE_B_DEFS.map(refOf)
    for (const ref of chatRefs) {
      expect(CardChildUnion.options).not.toContain(ref)
      expect(ContentChildUnion.options).not.toContain(ref)
    }
  })

  it('Content refs occur in ChatChildUnion nowhere', () => {
    for (const ref of ContentChildUnion.options) {
      expect(ChatChildUnion.options).not.toContain(ref)
    }
  })

  it('ChatPalette ref is legal only in ChatChildUnion, not in CardChildUnion or ContentChildUnion', () => {
    expect(ChatChildUnion.options).toContain(refOf(ChatPaletteDef))
    expect(CardChildUnion.options).not.toContain(refOf(ChatPaletteDef))
    expect(ContentChildUnion.options).not.toContain(refOf(ChatPaletteDef))
  })
})
