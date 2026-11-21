import { z } from 'zod/v4'
import { defineGenUIComponent } from '@nuxt-ui-genui/core'
import { StatsCardDef } from './base'

export const StatsDef = defineGenUIComponent({
  name: 'Stats',
  props: z.object({ children: z.array(StatsCardDef.ref) }),
  description: 'Responsive KPI grid of StatsCard components (2 across when narrow, 4 when wide). Use this for dashboard metric rows — never wrap StatsCard in Buttons.'
})

export const TableDef = defineGenUIComponent({
  name: 'Table',
  props: z.object({
    columns: z.array(z.object({ accessorKey: z.string().describe('Field name used as the row key'), header: z.string() })).describe('Inline array of inline { accessorKey, header } objects'),
    rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))).describe('Inline array of row objects whose keys match column accessorKey values'),
    striped: z.boolean().optional().describe('Alternate row shading')
  }),
  description: 'Data table powered by UTable. columns: inline array of inline { accessorKey, header }. rows: inline array of inline row objects. striped: optional alternate row shading. Values render as text. (Use DataTable for positional matrix rows or custom cell alignment.)'
})

export const ListboxDef = defineGenUIComponent({
  name: 'Listbox',
  props: z.object({
    label: z.string().optional(),
    items: z.array(z.string()).describe('Inline array of strings; at most 100 rendered'),
    multiple: z.boolean().optional().describe('Allow multiple selected items (default single)')
  }),
  description: 'Selectable list. items: inline array of strings. multiple: optional multi-select. Local selection state only; no form submission.'
})

export const MarqueeDef = defineGenUIComponent({
  name: 'Marquee',
  props: z.object({
    text: z.string(),
    reverse: z.boolean().optional(),
    pauseOnHover: z.boolean().optional(),
    repeat: z.number().describe('Repeat count 1-10; renderer clamps').optional()
  }),
  description: 'Infinite text ticker. text: required string. reverse/pauseOnHover/repeat optional. Display-only.'
})

export const ToastDef = defineGenUIComponent({
  name: 'Toast',
  props: z.object({
    label: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    color: z.enum(['neutral', 'primary', 'success', 'warning', 'error']).optional()
  }),
  description: 'Toast action button. Clicking shows a transient host-rendered toast under UApp; display/notification only, no privileged side effects.'
})

export const TooltipDef = defineGenUIComponent({
  name: 'Tooltip',
  props: z.object({
    text: z.string(),
    tooltip: z.string()
  }),
  description: 'Inline dotted-underline text with a hover tooltip. Display-only; the renderer mounts no callbacks. Requires the host UApp tooltip provider.'
})

export const CalendarDef = defineGenUIComponent({
  name: 'Calendar',
  props: z.object({
    label: z.string().optional(),
    defaultValue: z.string().describe('ISO date yyyy-mm-dd').optional(),
    min: z.string().describe('ISO date').optional(),
    max: z.string().describe('ISO date').optional()
  }),
  description: 'Calendar date picker. Local display-only selection; the chosen ISO date is shown inline and is NOT validated across submit_form (use InputDate for forms).'
})

export const ProgressGroupDef = defineGenUIComponent({
  name: 'ProgressGroup',
  props: z.object({
    items: z.array(z.object({
      label: z.string().optional(),
      value: z.number().describe('Completion amount for this segment'),
      icon: z.string().optional(),
      color: z.string().optional()
    })).describe('Inline array of inline { label, value, icon?, color? } items; value is clamped to 0..max.'),
    max: z.number().optional().describe('Shared maximum (default 100)'),
    status: z.boolean().optional().describe('Show the overall percentage status line'),
    orientation: z.enum(['horizontal', 'vertical']).optional()
  }),
  description: 'Segmented progress bar. items: inline array of inline { label, value, icon?, color? }. max: optional shared maximum. Display-only; no submission.'
})

