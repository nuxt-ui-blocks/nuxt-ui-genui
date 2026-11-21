import { z } from 'zod/v4'
import { defineGenUIComponent } from '@nuxt-ui-genui/core'

import { rulesSchema } from '../rules'

export const InputDef = defineGenUIComponent({
  name: 'Input',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
    rules: rulesSchema
  }),
  description: 'Single-line text input. name: required, unique within the form. rules: optional { required?, email?, url?, minLength?, maxLength?, pattern? } enforced by the renderer.'
})

export const TextareaDef = defineGenUIComponent({
  name: 'Textarea',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
    rows: z.number().optional(),
    rules: rulesSchema
  }),
  description: 'Multi-line text input. name: required, unique within the form. rules: optional; enforced by the renderer.'
})

export const InputNumberDef = defineGenUIComponent({
  name: 'InputNumber',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    defaultValue: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    rules: rulesSchema
  }),
  description: 'Numeric input. name: required, unique within the form. min/max/step: optional bounds. rules: optional; enforced by the renderer.'
})

export const SelectDef = defineGenUIComponent({
  name: 'Select',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    options: z.array(z.string()).describe('Inline array of option strings to render'),
    defaultValue: z.string().optional(),
    rules: rulesSchema
  }),
  description: 'Native single-select dropdown. name: required, unique within the form. options: inline array of strings (never fetched). rules: optional; enforced by the renderer.'
})

export const CheckboxDef = defineGenUIComponent({
  name: 'Checkbox',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    defaultValue: z.boolean().optional(),
    rules: rulesSchema
  }),
  description: 'Checkbox. name: required, unique within the form. rules: optional; enforced by the renderer.'
})

export const RadioGroupDef = defineGenUIComponent({
  name: 'RadioGroup',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    options: z.array(z.string()).describe('Inline array of option strings to render'),
    defaultValue: z.string().optional(),
    rules: rulesSchema
  }),
  description: 'Radio group. name: required, unique within the form. options: inline array of strings. rules: optional; enforced by the renderer.'
})

export const SwitchDef = defineGenUIComponent({
  name: 'Switch',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    defaultValue: z.boolean().optional(),
    rules: rulesSchema
  }),
  description: 'Toggle switch. name: required, unique within the form. rules: optional; enforced by the renderer.'
})

export const SliderDef = defineGenUIComponent({
  name: 'Slider',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    defaultValue: z.number().optional(),
    rules: rulesSchema
  }),
  description: 'Slider. name: required, unique within the form. min/max/step: optional bounds (defaults 0/100/1). rules: optional; enforced by the renderer.'
})

export const InputRatingDef = defineGenUIComponent({
  name: 'InputRating',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    max: z.number().optional(),
    defaultValue: z.number().optional(),
    rules: rulesSchema
  }),
  description: 'Star-rating input. name: required, unique within the form. max: optional star count (default 5). rules: optional; enforced by the renderer.'
})


export const SelectMenuDef = defineGenUIComponent({
  name: 'SelectMenu',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).describe('Inline array of option strings to render'),
    defaultValue: z.string().optional(),
    rules: rulesSchema
  }),
  description: 'Searchable single-select input. name: required, unique within the form. options: inline array of strings. rules: optional; enforced by the renderer.'
})

export const PinInputDef = defineGenUIComponent({
  name: 'PinInput',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    length: z.number().optional().describe('Number of single-character cells (default 4)'),
    mask: z.boolean().optional(),
    defaultValue: z.string().optional(),
    rules: rulesSchema
  }),
  description: 'PIN/OTP input. name: required, unique within the form. length: optional cells (default 4). mask: optional. rules: optional; enforced by the renderer.'
})

export const InputTagsDef = defineGenUIComponent({
  name: 'InputTags',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    max: z.number().optional(),
    defaultValue: z.array(z.string()).describe('Inline array of initial tag strings').optional(),
    rules: rulesSchema
  }),
  description: 'Tag input; value is an array of strings. name: required, unique within the form. max: optional tag cap. rules: optional; enforced by the renderer.'
})

export const ColorPickerDef = defineGenUIComponent({
  name: 'ColorPicker',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    defaultValue: z.string().describe('Hex color string, e.g. #22c55e').optional(),
    rules: rulesSchema
  }),
  description: 'Color picker. name: required, unique within the form. defaultValue: optional hex color. rules: optional; enforced by the renderer.'
})


export const InputDateDef = defineGenUIComponent({
  name: 'InputDate',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    min: z.string().describe('ISO date (yyyy-mm-dd) earliest selectable').optional(),
    max: z.string().describe('ISO date (yyyy-mm-dd) latest selectable').optional(),
    defaultValue: z.string().describe('ISO date (yyyy-mm-dd)').optional(),
    rules: rulesSchema
  }),
  description: 'Date input. name: required, unique within the form. min/max/defaultValue: ISO yyyy-mm-dd strings. rules: optional; enforced by the renderer.'
})

export const InputTimeDef = defineGenUIComponent({
  name: 'InputTime',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    defaultValue: z.string().describe('24h time, HH:mm').optional(),
    rules: rulesSchema
  }),
  description: 'Time input. name: required, unique within the form. defaultValue: HH:mm 24-hour. rules: optional; enforced by the renderer.'
})

export const FileUploadDef = defineGenUIComponent({
  name: 'FileUpload',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    accept: z.string().optional().describe('Mime hint, e.g. image/*,application/pdf'),
    maxFiles: z.number().optional().describe('Max files per upload (default 4)'),
    buttonLabel: z.string().optional(),
    rules: rulesSchema
  }),
  description: 'File upload field. Uploading is host-configured: when the app wraps the renderer in provideGenUIUploader the files are stored immediately and only their metadata refs are shown inline; otherwise the control is disabled. File contents never reach the model and never ride submit_form values. rules: optional; enforced by the renderer.'
})


export const CheckboxGroupDef = defineGenUIComponent({
  name: 'CheckboxGroup',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    options: z.array(z.string()).describe('Inline array of option strings to render'),
    defaultValue: z.array(z.string()).describe('Inline array of pre-checked option strings').optional(),
    rules: rulesSchema
  }),
  description: 'Checkbox group; value is an array of strings. name: required, unique within the form. options: inline array of strings. defaultValue: inline array of pre-checked strings. rules: optional; enforced by the renderer.'
})

export const InputMenuDef = defineGenUIComponent({
  name: 'InputMenu',
  props: z.object({
    name: z.string().describe('Unique field name within the form'),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).describe('Inline array of suggestion strings to render'),
    defaultValue: z.string().optional(),
    rules: rulesSchema
  }),
  description: 'Free-text input with a suggestion menu. name: required, unique within the form. options: inline array of suggestion strings; the user MAY type any value, not only an option. rules: optional; enforced by the renderer.'
})

export const FORM_CHILD_DEFS = [
  InputDef, TextareaDef, InputNumberDef, SelectDef, CheckboxDef, CheckboxGroupDef,
  RadioGroupDef, SwitchDef, SliderDef, InputRatingDef,
  SelectMenuDef, PinInputDef, InputTagsDef, ColorPickerDef,
  InputDateDef, InputTimeDef, FileUploadDef, InputMenuDef
] as const
export const FORM_FIELD_NAMES: readonly string[] = FORM_CHILD_DEFS.map((def) => def.name)
export const FormChildUnion = z.union([
  InputDef.ref, TextareaDef.ref, InputNumberDef.ref, SelectDef.ref, CheckboxDef.ref, CheckboxGroupDef.ref,
  RadioGroupDef.ref, SwitchDef.ref, SliderDef.ref, InputRatingDef.ref,
  SelectMenuDef.ref, PinInputDef.ref, InputTagsDef.ref, ColorPickerDef.ref,
  InputDateDef.ref, InputTimeDef.ref, FileUploadDef.ref, InputMenuDef.ref
])
export const FormDef = defineGenUIComponent({
  name: 'Form',
  props: z.object({
    formId: z.string().describe('Stable unique id for this form instance'),
    title: z.string().optional(),
    submitLabel: z.string().optional(),
    children: z.array(FormChildUnion)
  }),
  description: 'A form. children MUST be form field components only. Values are validated by the renderer and submitted to the host via a submit_form action — never interpreted as code.'
})

