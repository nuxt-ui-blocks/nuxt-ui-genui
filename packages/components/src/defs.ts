import { z } from 'zod/v4'
import { defineGenUIComponent } from '@nuxt-ui-genui/core'
import {
  ChartDef, TextContentDef, BadgeDef, ProgressDef, ButtonDef, StatsCardDef, AlertDef, DataTableDef,
  AccordionDef, AvatarDef, AvatarGroupDef, BannerDef, ChipDef, CollapsibleDef, EmptyDef, KbdDef,
  SeparatorDef, SkeletonDef,
  ChatMessageDef, ChatMessagesDef, ChatPaletteDef, ChatReasoningDef, ChatShimmerDef, ChatToolDef
} from './defs/base'
import {
  InputDef, TextareaDef, InputNumberDef, SelectDef, CheckboxDef, CheckboxGroupDef, RadioGroupDef, SwitchDef, SliderDef,
  InputRatingDef, SelectMenuDef, PinInputDef, InputTagsDef, ColorPickerDef, InputDateDef, InputTimeDef,
  FileUploadDef, FormDef, InputMenuDef
} from './defs/forms'
import { TabsDef, StepperDef, TimelineDef, BreadcrumbDef, UserDef, PaginationDef, NavigationMenuDef, TreeDef } from './defs/stateful'
import { ModalDef, SlideoverDef, CommandPaletteDef, PopoverDef, DropdownMenuDef, ContextMenuDef, DrawerDef } from './defs/overlays'
import { ToastDef, TooltipDef, CalendarDef, TableDef, ListboxDef, MarqueeDef, StatsDef, ProgressGroupDef } from './defs/display'

export * from './defs/base'
export * from './defs/forms'
export * from './defs/stateful'
export * from './defs/overlays'
export * from './defs/display'

/** Anything that can sit inside a content container. Single source of truth. */
export const CONTENT_CHILD_DEFS = [TextContentDef, BadgeDef, ProgressDef, AlertDef] as const

type ChildDef = { ref: unknown; name: string }

function asChildUnion(defs: readonly ChildDef[]) {
  return z.union(defs.map((def) => def.ref) as unknown as [z.ZodTypeAny, ...z.ZodTypeAny[]])
}

export const ContentChildUnion = asChildUnion(CONTENT_CHILD_DEFS)
export const CONTENT_CHILD_NAMES: readonly string[] = CONTENT_CHILD_DEFS.map((def) => def.name)

// Carousel lives in defs.ts (not defs/display.ts) because it reuses CardChildUnion.
// Its children are lazy to avoid the module-evaluation cycle with CardChildUnion.
export const CarouselDef = defineGenUIComponent({
  name: 'Carousel',
  props: z.object({
    children: z.lazy(() => z.array(CardChildUnion)).describe('Slide contents; each child node becomes one slide. Slides accept the same content components as Card.'),
    arrows: z.boolean().optional().default(true).describe('Show previous/next arrow buttons. Default true.'),
    dots: z.boolean().optional().default(true).describe('Show dot indicators. Default true.'),
    loop: z.boolean().optional().describe('Wrap around from the last slide back to the first'),
    orientation: z.enum(['horizontal', 'vertical']).optional().describe('horizontal (default) or vertical'),
    slidesToScroll: z.number().int().positive().optional().describe('Number of slides to advance per arrow click')
  }),
  description: 'Carousel of card-like content. children: inline array of Card-legal content nodes, one per slide. arrows/dots: show navigation (default true). loop/orientation/slidesToScroll: optional. Display-only; local state only.'
})

// ScrollArea and Splitter also live in defs.ts because they reuse CardChildUnion.
export const ScrollAreaDef = defineGenUIComponent({
  name: 'ScrollArea',
  props: z.object({
    children: z.lazy(() => z.array(CardChildUnion)).describe('Inline array of Card-legal content nodes to render inside the scroll viewport'),
    orientation: z.enum(['horizontal', 'vertical']).optional().describe('vertical (default) or horizontal'),
    shadow: z.boolean().optional().describe('Show fade shadows at the scroll edges. Default false.')
  }),
  description: 'Scrollable content viewport. children: inline array of Card-legal content nodes. orientation: vertical (default) or horizontal. shadow: optional fade shadows. Display-only; local scroll state only.'
})

export const SplitterDef = defineGenUIComponent({
  name: 'Splitter',
  props: z.object({
    children: z.lazy(() => z.array(CardChildUnion)).describe('Inline array of Card-legal content nodes; each child becomes one resizable panel'),
    orientation: z.enum(['horizontal', 'vertical']).optional().describe('horizontal (default) or vertical'),
    autoSaveId: z.string().optional().describe('Persist panel sizes to localStorage under this id'),
    disabled: z.boolean().optional().describe('Disable dragging the resize handles. Default false.')
  }),
  description: 'Resizable split panes. children: inline array of Card-legal content nodes, one panel per child. orientation: horizontal (default) or vertical. autoSaveId: optional localStorage persistence key. disabled: optional. Display-only; local drag state only.'
})

// The registry is the source of truth: the Zod union, the prompt spec and the
// client-side allowlist are all derived from this one list, so adding a component
// in one place cannot drift out of the others.
export const ButtonsDef = defineGenUIComponent({
  name: 'Buttons',
  props: z.object({ children: z.array(ButtonDef.ref) }),
  description: 'A horizontal row of Button components.'
})

export const CARD_CHILD_DEFS = [
  ...CONTENT_CHILD_DEFS,
  StatsCardDef,
  ChartDef,
  DataTableDef,
  ButtonDef,
  ButtonsDef,
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
  FormDef,
  TabsDef,
  StepperDef,
  TimelineDef,
  BreadcrumbDef,
  ModalDef,
  SlideoverDef,
  CommandPaletteDef,
  UserDef,
  PaginationDef,
  NavigationMenuDef,
  TreeDef,
  PopoverDef,
  DropdownMenuDef,
  ContextMenuDef,
  DrawerDef,
  ToastDef,
  TooltipDef,
  CalendarDef,
  TableDef,
  ListboxDef,
  MarqueeDef,
  StatsDef,
  ProgressGroupDef,
  CarouselDef,
  ScrollAreaDef,
  SplitterDef
] as const

// Lazy children defer this initializer; the circular Carousel/ScrollArea/Splitter
// refs force an explicit annotation (cast through unknown) so TS does not hit a
// circular-initializer error. Type-level only.
export const CardChildUnion = asChildUnion(CARD_CHILD_DEFS)

/** Runtime mirror of CardChildUnion, for containers that must filter children. */
export const CARD_CHILD_NAMES: readonly string[] = CARD_CHILD_DEFS.map((def) => def.name)


export function createCardDef(extraChildren: readonly ChildDef[] = [], baseChildren: readonly ChildDef[] = CARD_CHILD_DEFS) {
  const children = extraChildren.length ? [...baseChildren, ...extraChildren] : baseChildren
  return defineGenUIComponent({
    name: 'Card',
    props: z.object({
      title: z.string().optional(),
      children: z.array(asChildUnion(children))
    }),
    description: 'Content container. title optional. children rendered in order. Card is the ONLY root content container.'
  })
}

export const CardDef = createCardDef()

export const ALL_DEFS = [
  CardDef, StatsCardDef, TextContentDef, ButtonDef, ButtonsDef,
  AlertDef, BadgeDef, DataTableDef, ChartDef, ProgressDef,
  AccordionDef, AvatarDef, AvatarGroupDef, BannerDef, ChipDef, CollapsibleDef,
  EmptyDef, KbdDef, SeparatorDef, SkeletonDef,
  ChatMessageDef, ChatMessagesDef, ChatPaletteDef, ChatReasoningDef, ChatShimmerDef, ChatToolDef,
  FormDef, InputDef, TextareaDef, InputNumberDef, SelectDef, CheckboxDef, RadioGroupDef, SwitchDef, SliderDef, InputRatingDef,
  TabsDef, StepperDef, TimelineDef, BreadcrumbDef,
  ModalDef, SlideoverDef, CommandPaletteDef,
  SelectMenuDef, PinInputDef, InputTagsDef, ColorPickerDef,
  UserDef, PaginationDef, NavigationMenuDef, TreeDef,
  PopoverDef, DropdownMenuDef, ContextMenuDef, DrawerDef,
  InputDateDef, InputTimeDef, FileUploadDef,
  ToastDef, TooltipDef, CalendarDef,
  TableDef, ListboxDef, MarqueeDef,
  CheckboxGroupDef,
  StatsDef,
  InputMenuDef,
  ProgressGroupDef,
  CarouselDef,
  ScrollAreaDef,
  SplitterDef
]
