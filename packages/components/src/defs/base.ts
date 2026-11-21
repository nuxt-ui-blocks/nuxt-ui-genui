import { z } from 'zod/v4'
import { defineGenUIComponent } from '@nuxt-ui-genui/core'
import { actionSchema } from '../action'

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
  description: 'Clickable button. variant: "solid" | "soft" | "outline" | "ghost". action: omit for continue_conversation; { type: "open_url", url } for links; or Action([@Set($var, value), @Run(mutationOrQueryRef), @ToAssistant("message")]) to run steps when clicked.'
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
    rows: z.array(z.array(z.union([z.string(), z.number()]))).describe('Row matrix; each row is an array of cells in column order.'),
    striped: z.boolean().optional().describe('Alternate row shading (display only)')
  }),
  description: 'Data table. columns: inline array of { key, label, align? } objects. rows: matrix of cells in column order. Cells render as text.'
})

export const AccordionDef = defineGenUIComponent({
  name: 'Accordion',
  props: z.object({
    items: z.array(z.object({ label: z.string(), content: z.string() })),
    type: z.enum(['single', 'multiple']).optional()
  }),
  description: 'Accordion. items: array of inline { label, content } objects (string content only, never raw HTML or nested components); type: "single" | "multiple" (omit for single). Display-only; no arbitrary classes or slot content.'
})

export const AvatarDef = defineGenUIComponent({
  name: 'Avatar',
  props: z.object({
    src: z.string().optional(),
    alt: z.string().optional(),
    text: z.string().optional(),
    size: z.string().optional(),
    icon: z.string().optional()
  }),
  description: 'Avatar. Optional src (a browser image URL, never rendered as HTML), alt, text fallback, size, icon (lucide name). Display-only; no raw markup or arbitrary classes.'
})

export const AvatarGroupDef = defineGenUIComponent({
  name: 'AvatarGroup',
  props: z.object({
    avatars: z.array(z.object({ src: z.string().optional(), alt: z.string().optional(), text: z.string().optional() })),
    max: z.number().optional()
  }),
  description: 'AvatarGroup. avatars: array of inline { src?, alt?, text? } objects rendered in order; max: optional cap on visible avatars (renderer caps at 8). Display-only; no arbitrary child components.'
})

export const BannerDef = defineGenUIComponent({
  name: 'Banner',
  props: z.object({
    title: z.string(),
    icon: z.string().optional()
  }),
  description: 'Banner. title: required string; icon: optional lucide name. Inline informational banner only; no dismiss actions, persistence, or raw HTML.'
})

export const ChipDef = defineGenUIComponent({
  name: 'Chip',
  props: z.object({
    text: z.string(),
    color: z.string().optional(),
    size: z.string().optional()
  }),
  description: 'Chip. text: required string; color: optional; size: optional. Compact status display only; no actions, events, or arbitrary classes.'
})

export const CollapsibleDef = defineGenUIComponent({
  name: 'Collapsible',
  props: z.object({
    label: z.string(),
    content: z.string()
  }),
  description: 'Collapsible. label: trigger string; content: string-only body (never raw HTML or nested OpenUI components). Display-only disclosure; no slot injection.'
})

export const EmptyDef = defineGenUIComponent({
  name: 'Empty',
  props: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional()
  }),
  description: 'Empty. title: required string; description: optional string; icon: optional lucide name. Empty-state display only; no actions or slot content.'
})

export const KbdDef = defineGenUIComponent({
  name: 'Kbd',
  props: z.object({
    keys: z.array(z.string())
  }),
  description: 'Kbd. keys: array of keyboard key label strings. Visual key hints only; no behavior, bindings, or HTML.'
})

export const SeparatorDef = defineGenUIComponent({
  name: 'Separator',
  props: z.object({
    label: z.string().optional(),
    orientation: z.enum(['horizontal', 'vertical']).optional()
  }),
  description: 'Separator. label: optional string; orientation: "horizontal" | "vertical" (omit for horizontal). Purely visual divider; no content or actions.'
})

export const SkeletonDef = defineGenUIComponent({
  name: 'Skeleton',
  props: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    lines: z.number().optional()
  }),
  description: 'Skeleton. width: optional pixels; height: optional pixels; lines: optional row count (renderer clamps dimensions and caps lines). Placeholder display only; no arbitrary CSS or classes.'
})

export const ChatMessageDef = defineGenUIComponent({
  name: 'ChatMessage',
  props: z.object({
    role: z.enum(['user', 'assistant', 'system']),
    text: z.string()
  }),
  description: 'ChatMessage. role: "user" | "assistant" | "system"; text: required string. Display-only single message; the renderer synthesizes index-derived ids (message-<index>); no metadata, actions, or callbacks.'
})

export const ChatMessagesDef = defineGenUIComponent({
  name: 'ChatMessages',
  props: z.object({
    messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), text: z.string() })),
    status: z.enum(['ready', 'submitted', 'streaming', 'error']).optional()
  }),
  description: 'ChatMessages. messages: array of inline { role, text } objects (role: "user" | "assistant" | "system"); status: optional "ready" | "submitted" | "streaming" | "error". Display-only list with index-derived ids; no transport, persistence, or actions.'
})

export const ChatPaletteDef = defineGenUIComponent({
  name: 'ChatPalette',
  props: z.object({
    children: z.array(z.lazy((): z.ZodType<unknown> => ChatChildUnion)),
    title: z.string().optional(),
    icon: z.string().optional()
  }),
  description: 'ChatPalette. children: array of ChatChildUnion entries (chat components only, never Card content); title: optional static label; icon: optional lucide name. Host-selected chat root that renders children only; no input, send, transport, or Card placement.'
})

export const ChatReasoningDef = defineGenUIComponent({
  name: 'ChatReasoning',
  props: z.object({
    text: z.string(),
    streaming: z.boolean().optional()
  }),
  description: 'ChatReasoning. text: required string; streaming: optional boolean. Display-only reasoning disclosure; no provider metadata, parts, or actions.'
})

export const ChatShimmerDef = defineGenUIComponent({
  name: 'ChatShimmer',
  props: z.object({
    text: z.string()
  }),
  description: 'ChatShimmer. text: required string. Display-only loading shimmer; no state, actions, or callbacks.'
})

export const ChatToolDef = defineGenUIComponent({
  name: 'ChatTool',
  props: z.object({
    name: z.string(),
    text: z.string().optional(),
    suffix: z.string().optional(),
    icon: z.string().optional(),
    loading: z.boolean().optional()
  }),
  description: 'ChatTool. name: required string (mapped to display text); text: optional; suffix: optional; icon: optional lucide name; loading: optional boolean. Display-only tool summary; no tool execution, actions, URLs, or callbacks.'
})

export const CHAT_CHILD_DEFS = [ChatMessageDef, ChatMessagesDef, ChatPaletteDef, ChatReasoningDef, ChatShimmerDef, ChatToolDef] as const

/** Runtime mirror of ChatChildUnion, for containers that must filter children. */
export const CHAT_CHILD_NAMES: readonly string[] = CHAT_CHILD_DEFS.map((def) => def.name)

export const ChatChildUnion: z.ZodUnion<readonly [
  typeof ChatMessageDef.ref,
  typeof ChatMessagesDef.ref,
  typeof ChatPaletteDef.ref,
  typeof ChatReasoningDef.ref,
  typeof ChatShimmerDef.ref,
  typeof ChatToolDef.ref
]> = z.union([ChatMessageDef.ref, ChatMessagesDef.ref, ChatPaletteDef.ref, ChatReasoningDef.ref, ChatShimmerDef.ref, ChatToolDef.ref])


