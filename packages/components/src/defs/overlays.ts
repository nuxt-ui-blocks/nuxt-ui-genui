import { z } from 'zod/v4'
import { defineGenUIComponent } from '@nuxt-ui-genui/core'

export const ModalDef = defineGenUIComponent({
  name: 'Modal',
  props: z.object({
    title: z.string().optional(),
    triggerLabel: z.string(),
    content: z.string().describe('Markdown text for the modal body; never raw HTML'),
    defaultOpen: z.boolean().optional()
  }),
  description: 'Modal. triggerLabel: text for the open button. content: markdown body. defaultOpen: render open. Display-only, self-contained local open state; never controls host UI.'
})

export const SlideoverDef = defineGenUIComponent({
  name: 'Slideover',
  props: z.object({
    title: z.string().optional(),
    triggerLabel: z.string(),
    content: z.string().describe('Markdown text for the slideover body; never raw HTML'),
    defaultOpen: z.boolean().optional()
  }),
  description: 'Slideover. triggerLabel: text for the open button. content: markdown body. defaultOpen: render open. Display-only, self-contained local open state; never controls host UI.'
})

export const CommandPaletteDef = defineGenUIComponent({
  name: 'CommandPalette',
  props: z.object({
    items: z.array(z.object({
      label: z.string(),
      icon: z.string().optional(),
      url: z.string().optional().describe('https-only; non-https urls never navigate'),
      message: z.string().optional().describe('Optional follow-up message sent as continue_conversation to the host')
    }))
  }),
  description: 'CommandPalette. items: inline array of { label, icon?, url?, message? }. https-only url opens a new tab; message continues the conversation via the host action. Self-contained local state.'
})


export const PopoverDef = defineGenUIComponent({
  name: 'Popover',
  props: z.object({
    title: z.string().optional(),
    triggerLabel: z.string(),
    content: z.string().describe('Markdown text for the popover body; never raw HTML')
  }),
  description: 'Popover. triggerLabel: open button label. content: markdown body. Self-contained local open state.'
})

export const DropdownMenuDef = defineGenUIComponent({
  name: 'DropdownMenu',
  props: z.object({
    triggerLabel: z.string(),
    items: z.array(z.object({
      label: z.string(),
      icon: z.string().optional(),
      url: z.string().optional().describe('https-only; non-https urls never navigate'),
      message: z.string().optional().describe('Optional follow-up message sent as continue_conversation to the host'),
      disabled: z.boolean().optional()
    }))
  }),
  description: 'Dropdown menu. items: inline array of { label, icon?, url?, message?, disabled? }. url must be https; message continues the conversation via the host action.'
})

export const ContextMenuDef = defineGenUIComponent({
  name: 'ContextMenu',
  props: z.object({
    items: z.array(z.object({
      label: z.string(),
      icon: z.string().optional(),
      url: z.string().optional().describe('https-only; non-https urls never navigate'),
      message: z.string().optional().describe('Optional follow-up message sent as continue_conversation to the host'),
      disabled: z.boolean().optional()
    }))
  }),
  description: 'Right-click context menu. items: inline array of { label, icon?, url?, message?, disabled? }. url must be https; message continues the conversation via the host action.'
})

export const DrawerDef = defineGenUIComponent({
  name: 'Drawer',
  props: z.object({
    title: z.string().optional(),
    triggerLabel: z.string(),
    content: z.string().describe('Markdown text for the drawer body; never raw HTML'),
    defaultOpen: z.boolean().optional()
  }),
  description: 'Drawer. triggerLabel: open button label. content: markdown body. defaultOpen: render open. Self-contained local open state.'
})

