import { z } from 'zod/v4'
import { defineGenUIComponent } from '@nuxt-ui-genui/core'

export const TabsDef = defineGenUIComponent({
  name: 'Tabs',
  props: z.object({
    items: z.array(z.object({ label: z.string(), content: z.string() })).describe('Inline array of { label, content }; content is plain text or markdown, never raw HTML'),
    defaultIndex: z.number().optional().describe('Zero-based index of the initially active tab')
  }),
  description: 'Tabs. items: inline array of { label, content }. content is markdown/text only. defaultIndex: optional zero-based tab index. Display-only; local state only.'
})

export const StepperDef = defineGenUIComponent({
  name: 'Stepper',
  props: z.object({
    items: z.array(z.object({ title: z.string(), description: z.string().optional() })),
    current: z.number().optional().describe('Zero-based index of the active step')
  }),
  description: 'Stepper. items: inline array of { title, description? }. current: optional zero-based active step index (clamped). Display-only; local navigation only.'
})

export const TimelineDef = defineGenUIComponent({
  name: 'Timeline',
  props: z.object({
    items: z.array(z.object({ title: z.string(), description: z.string().optional(), date: z.string().optional() }))
  }),
  description: 'Timeline. items: inline array of inline { title, description?, date? } objects. Display-only chronological list.'
})

export const BreadcrumbDef = defineGenUIComponent({
  name: 'Breadcrumb',
  props: z.object({
    items: z.array(z.object({ label: z.string(), url: z.string().optional().describe('https URL only; non-https urls render as plain text') }))
  }),
  description: 'Breadcrumb. items: inline array of { label, url? }. url must be https; non-https urls render as plain text.'
})


export const UserDef = defineGenUIComponent({
  name: 'User',
  props: z.object({
    name: z.string(),
    description: z.string().optional(),
    avatar: z.object({ src: z.string().optional(), alt: z.string().optional(), text: z.string().optional() }).optional()
  }),
  description: 'User identity block: avatar + name + optional description. avatar is an inline { src?, alt?, text? } object.'
})

export const PaginationDef = defineGenUIComponent({
  name: 'Pagination',
  props: z.object({
    total: z.number().optional().describe('Total number of items (default 100)'),
    itemsPerPage: z.number().optional().describe('Items per page (default 10)'),
    siblingCount: z.number().optional().describe('Sibling page buttons around the current page (default 1)')
  }),
  description: 'Pagination control. total: optional (default 100). itemsPerPage: optional (default 10). Local page state only.'
})

export const NavigationMenuDef = defineGenUIComponent({
  name: 'NavigationMenu',
  props: z.object({
    items: z.array(z.object({ label: z.string(), url: z.string().optional().describe('https URL only; non-https renders as plain text'), icon: z.string().optional() }))
  }),
  description: 'Navigation menu. items: inline array of { label, url?, icon? }. url must be https; non-https urls render as plain text.'
})

export interface TreeItemShape { label: string; icon?: string; children?: TreeItemShape[] }
export const TreeItemDefShape: z.ZodType<TreeItemShape> = z.lazy(() =>
  z.object({
    label: z.string(),
    icon: z.string().optional(),
    children: z.array(TreeItemDefShape).optional()
  })
)

export const TreeDef = defineGenUIComponent({
  name: 'Tree',
  props: z.object({
    items: z.array(TreeItemDefShape).describe('Recursive inline array of { label, icon?, children? }')
  }),
  description: 'Tree view. items: recursive inline array of { label, icon?, children? }. Local selection/expansion state only.'
})

